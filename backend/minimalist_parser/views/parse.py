import base64
import json
from typing import Optional
from dataclasses import dataclass
from enum import Enum

from django.conf import settings
from django.http import HttpRequest, HttpResponse, JsonResponse
from django.views import View

from parseport.http_client import http_client
from parseport.logger import logger
from uuid import uuid4


class MGParserErrorSource(Enum):
    INPUT = "input"
    MG_PARSER = "mg_parser"
    GENERAL = "general"
    VULCAN = "vulcan"


@dataclass
class MGParserResponse:
    error: Optional[MGParserErrorSource] = None
    id: Optional[str] = None

    def json_response(self) -> JsonResponse:
        return JsonResponse(
            {
                "error": self.error.value if self.error else None,
                "id": getattr(self, "id", None),
            },
            status=400 if self.error else 200,
        )


# Create your views here.
class MGParserView(View):
    def post(self, request: HttpRequest) -> HttpResponse:
        """
        Expects a POST request with a JSON body containing an English string to
        be parsed, in the following format:
        {
            "input": str
        }

        The input is sent to the parser, and an ID is generated if the parse is
        successful. The parse results are forwarded to the Vulcan server, where
        a visualisation is created ahead of time. The ID is returned to the
        client, which can be used to redirect the client to the Vulcan page
        where the visualisation is displayed.

        Returns a JSON response with the following format:
        {
            "id": str | None,
            "error": str | None
        }
        """
        data = self.validate_input(request)
        if data is None:
            logger.warning("Failed to validate user input.")
            return MGParserResponse(error=MGParserErrorSource.INPUT).json_response()

        logger.info("User input validated. Sending to parser...")

        parsed_binary = self.send_to_parser(data)

        if parsed_binary is None:
            logger.warning("Failed to parse input: %s", data)
            return MGParserResponse(error=MGParserErrorSource.MG_PARSER).json_response()

        logger.info("Parse successful. Sending to Vulcan...")
        parse_id = self.generate_parse_id()

        vulcan_response = self.send_to_vulcan(parsed_binary, parse_id)
        if vulcan_response is None:
            return MGParserResponse(error=MGParserErrorSource.VULCAN).json_response()

        logger.info("Vulcan response received. Returning ID to client...")

        return MGParserResponse(id=parse_id).json_response()

    def generate_parse_id(self) -> str:
        """Generate a unique, URL-safe ID for the current request."""
        return str(uuid4()).replace("-", "")

    def send_to_vulcan(self, parsed_data: bytes, id: str) -> Optional[dict]:
        """
        Send request to downstream Vulcan server.
        """
        try:
            base64_encoded = base64.b64encode(parsed_data).decode("utf-8")
        except Exception as e:
            logger.warning("Failed to base64 encode parsed data: %s", e)
            return None

        vulcan_response = http_client.request(
            method="POST",
            url=settings.VULCAN_URL,
            body=json.dumps(
                {
                    "parse_data": base64_encoded,
                    "id": id,
                }
            ),
            headers={"Content-Type": "application/json"},
        )

        if vulcan_response.status != 200:
            logger.warning(
                "Received non-200 response from Vulcan server for input %s", parsed_data
            )
            return None

        try:
            json_response = vulcan_response.json()
        except json.JSONDecodeError:
            logger.warning("Received non-JSON response from Vulcan server")
            return None

        return json_response

    def send_to_parser(self, input_string: str) -> Optional[bytes]:
        """Send request to downstream MG Parser"""
        mg_parser_response = http_client.request(
            method="POST",
            url=settings.MINIMALIST_PARSER_URL,
            body=json.dumps({"input": input_string}),
            headers={"Content-Type": "application/json"},
        )

        if mg_parser_response.status != 200:
            logger.warning(
                "Received non-200 response from MG Parser server for input %s",
                input_string,
            )
            return None

        parsed_data = mg_parser_response.data
        if type(parsed_data) != bytes:
            logger.warning("Received non-bytes response from MG Parser server")
            return None

        return parsed_data

    def validate_input(self, request: HttpRequest) -> Optional[str]:
        """Read and validate the HTTP request received from the frontend"""
        request_body = request.body.decode("utf-8")

        try:
            parsed_json = json.loads(request_body)
        except json.JSONDecodeError:
            logger.warning("Input is not JSON parseable: %s", request_body)
            return None

        if not "input" in parsed_json or not isinstance(parsed_json["input"], str):
            logger.warning(
                "Key input with value of type string not found:", request_body
            )
            return None

        return parsed_json["input"]
