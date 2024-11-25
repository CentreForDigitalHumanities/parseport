import pickle
import json
from typing import Optional
from dataclasses import dataclass
from enum import Enum

from django.conf import settings
from django.http import HttpRequest, HttpResponse, JsonResponse
from django.views import View

from parseport.http_client import http_client
from parseport.logger import logger


class MGParserErrorSource(Enum):
    INPUT = "input"
    MG_PARSER = "mg_parser"
    GENERAL = "general"


@dataclass
class MGParserResponse:
    ok: Optional[bool] = None
    error: Optional[MGParserErrorSource] = None

    def json_response(self) -> JsonResponse:
        return JsonResponse(
            {
                "ok": self.ok or False,
                "error": getattr(self, "error", None),
            },
            status=400 if self.error else 200,
        )


# Create your views here.
class MPParseView(View):
    def post(self, request: HttpRequest) -> HttpResponse:
        data = self.read_request(request)
        if data is None:
            return MGParserResponse(error=MGParserErrorSource.INPUT).json_response()

        parsed = self.send_to_parser(data)

        if parsed is None:
            return MGParserResponse(error=MGParserErrorSource.MG_PARSER).json_response()

        return MGParserResponse(ok=True).json_response()

    def send_to_parser(self, text: str) -> Optional[str]:
        """Send request to downstream MG Parser"""
        mg_parser_response = http_client.request(
            method="POST",
            url=settings.MINIMALIST_PARSER_URL,
            body=json.dumps({"input": text}),
            headers={"Content-Type": "application/json"},
        )

        if mg_parser_response.status != 200:
            logger.warning(
                "Received non-200 response from MG Parser server for input %s", text
            )
            return None

        # Parse as pickle
        try:
            response_body = mg_parser_response.data
            parsed_data = pickle.loads(response_body)
        except pickle.UnpicklingError:
            logger.warning("Received non-pickle response from MG Parser server")
            return None

        return parsed_data

    def read_request(self, request: HttpRequest) -> Optional[str]:
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
