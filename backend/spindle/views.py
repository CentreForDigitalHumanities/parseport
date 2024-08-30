import base64
import json
import logging
import urllib3
from dataclasses import dataclass, field
from enum import Enum
from typing import Literal, Optional, List
from urllib.parse import quote

from django.conf import settings
from django.http import HttpRequest, JsonResponse
from django.views import View

from aethel.frontend import (
    LexicalPhrase,
    Proof,
    json_to_serial_proof,
    json_to_serial_phrase,
    deserialize_proof,
    deserialize_phrase,
    serialize_proof,
    serial_proof_to_json,
)

from spindle.utils import serialize_phrases

http = urllib3.PoolManager()


# Output mode
Mode = Literal["latex", "pdf", "overleaf", "term-table", "proof"]


class SpindleErrorSource(Enum):
    INPUT = "input"
    SPINDLE = "spindle"
    LATEX = "latex"
    GENERAL = "general"


# Should correspond with SpindleReturn interface in frontend.
@dataclass
class SpindleResponse:
    latex: Optional[str] = None
    pdf: Optional[str] = None
    redirect: Optional[str] = None
    error: Optional[SpindleErrorSource] = None
    term: Optional[str] = None
    lexical_phrases: List[dict] = field(default_factory=list)
    proof: Optional[dict] = None

    def json_response(self) -> JsonResponse:
        # TODO: set HTTP error code when error is not None

        # Convert display_type to displayType for frontend.
        camelized = [
            {
                **{k: v for k, v in phrase.items() if k != "display_type"},
                "displayType": phrase["display_type"],
            }
            for phrase in self.lexical_phrases
        ]

        return JsonResponse(
            {
                "latex": self.latex,
                "pdf": self.pdf,
                "redirect": self.redirect,
                "error": self.error.value if self.error else None,
                "term": self.term,
                "lexical_phrases": camelized,
                "proof": self.proof,
            }
        )


@dataclass
class ParserResponse:
    tex: str
    proof: Proof
    lexical_phrases: List[LexicalPhrase]


class SpindleView(View):
    def post(self, request: HttpRequest, mode: Mode):
        data = self.read_request(request)
        if data is None:
            return SpindleResponse(error=SpindleErrorSource.INPUT).json_response()

        parsed = self.send_to_parser(data)
        if parsed is None:
            return SpindleResponse(error=SpindleErrorSource.SPINDLE).json_response()

        if mode == "latex":
            return self.latex_response(parsed.tex)
        elif mode == "pdf":
            return self.pdf_response(parsed.tex)
        elif mode == "overleaf":
            return self.overleaf_redirect(parsed.tex)
        elif mode == "term-table":
            return self.term_table_response(parsed)
        elif mode == "proof":
            return self.proof_response(parsed)

        # Only if the query param is not a valid mode
        # This should never happen.
        logging.warn("Received unexpected mode.")
        return SpindleResponse(error=SpindleErrorSource.GENERAL).json_response()

    def send_to_parser(self, text: str) -> Optional[ParserResponse]:
        """Send request to downstream (natural language) parser"""
        # Sending data to Spindle container.
        spindle_response = http.request(
            method="POST",
            url=settings.SPINDLE_URL,
            body=json.dumps({"input": text}),
            headers={"Content-Type": "application/json"},
        )

        if spindle_response.status != 200:
            logging.warn(
                "Received non-200 response from Spindle server for input %s", text
            )
            return None

        try:
            spindle_response_json = spindle_response.json()
        except json.JSONDecodeError as e:
            logging.warn("Spindle response is not JSON parseable: %s", e.msg)
            return None

        try:
            return ParserResponse(
                tex=spindle_response_json["tex"],
                proof=deserialize_proof(
                    json_to_serial_proof(spindle_response_json["proof"])
                ),
                lexical_phrases=[
                    deserialize_phrase(json_to_serial_phrase(phrase))
                    for phrase in spindle_response_json["lexical_phrases"]
                ],
            )
        except:
            logging.exception(
                "Spindle response does not contain valid 'results': %s",
                json.dumps(spindle_response_json),
            )

    def read_request(self, request: HttpRequest) -> Optional[str]:
        """Read and validate the HTTP request received from the frontend"""
        request_body = request.body.decode("utf-8")

        try:
            parsed_json = json.loads(request_body)
        except json.JSONDecodeError:
            logging.warn("Input is not JSON parseable: %s", request_body)
            return None

        if not "input" in parsed_json or not isinstance(parsed_json["input"], str):
            logging.warn("Key input with value of type string not found:", request_body)
            return None

        return parsed_json["input"]

    def latex_response(self, latex: str) -> JsonResponse:
        """Return LaTeX code immediately."""
        return SpindleResponse(latex=latex).json_response()

    def pdf_response(self, latex: str) -> JsonResponse:
        """Forward LaTeX code to LaTeX service. Return PDF"""
        latex_response = http.request(
            method="POST",
            url=settings.LATEX_SERVICE_URL,
            body=latex,
            headers={"Content-Type": "application/tex"},
        )

        if latex_response.status != 200:
            logging.warn(
                "Received non-200 response from LaTeX server for input %s", latex
            )
            return SpindleResponse(error=SpindleErrorSource.LATEX).json_response()

        try:
            pdf = latex_response.data
        except KeyError:
            logging.warn(
                "LaTeX response does not contain valid 'data': %s", latex_response
            )
            return SpindleResponse(error=SpindleErrorSource.LATEX).json_response()

        # PDF generated succesfully
        pdf_base64_string = base64.b64encode(pdf).decode("utf-8")
        return SpindleResponse(latex=latex, pdf=pdf_base64_string).json_response()

    def overleaf_redirect(self, latex: str) -> JsonResponse:
        """Compose a link to Overleaf."""
        # quote() is used to escape special characters.
        redirect_url = f"https://www.overleaf.com/docs?snip={quote(latex)}"
        return SpindleResponse(redirect=redirect_url).json_response()

    def term_table_response(self, parsed: ParserResponse) -> JsonResponse:
        """Return the term and the lexical phrases as a JSON response."""

        phrases = serialize_phrases(parsed.lexical_phrases)
        return SpindleResponse(
            term=str(parsed.proof.term),
            lexical_phrases=phrases,
        ).json_response()

    def proof_response(self, parsed: ParserResponse) -> JsonResponse:
        """Return the proof as a JSON response."""
        return SpindleResponse(
            proof=serial_proof_to_json(serialize_proof(parsed.proof))
        ).json_response()


def spindle_status():
    try:
        r = http.request(
            method="GET",
            url=settings.SPINDLE_URL + "/status/",
            headers={"Content-Type": "application/json"},
            timeout=1,
            retries=False,
        )
        return r.status < 400
    except Exception:
        return False
