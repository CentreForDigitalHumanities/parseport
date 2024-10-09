from enum import Enum
from dataclasses import dataclass

from django.http import HttpRequest, JsonResponse
from rest_framework import status
from rest_framework.views import APIView
from spindle.utils import serialize_phrases
from aethel.frontend import Sample

from aethel_db.models import dataset


@dataclass
class AethelDetailResult:
    sentence: str
    name: str
    term: str
    subset: str
    phrases: list[dict[str, str]]

    def serialize(self):
        return {
            "sentence": self.sentence,
            "name": self.name,
            "term": self.term,
            "subset": self.subset,
            "phrases": [
                {
                    "type": phrase["type"],
                    "displayType": phrase["display_type"],
                    "items": phrase["items"],
                }
                for phrase in self.phrases
            ],
        }


class AethelDetailError(Enum):
    NO_QUERY_INPUT = "NO_QUERY_INPUT"
    SAMPLE_NOT_FOUND = "SAMPLE_NOT_FOUND"
    MULTIPLE_FOUND = "MULTIPLE_FOUND"


AETHEL_DETAIL_STATUS_CODES = {
    AethelDetailError.NO_QUERY_INPUT: status.HTTP_400_BAD_REQUEST,
    AethelDetailError.SAMPLE_NOT_FOUND: status.HTTP_404_NOT_FOUND,
    AethelDetailError.MULTIPLE_FOUND: status.HTTP_500_INTERNAL_SERVER_ERROR,
}


@dataclass
class AethelDetailResponse:
    result: AethelDetailResult | None = None
    error: AethelDetailError | None = None

    def parse_sample(self, sample: Sample) -> None:
        self.result = AethelDetailResult(
            sentence=sample.sentence,
            name=sample.name,
            term=str(sample.proof.term),
            subset=sample.subset,
            phrases=serialize_phrases(sample.lexical_phrases),
        )

    def json_response(self) -> JsonResponse:
        status_code = (
            AETHEL_DETAIL_STATUS_CODES[self.error] if self.error else status.HTTP_200_OK
        )

        return JsonResponse(
            {
                "result": self.result.serialize() if self.result else None,
                "error": self.error,
            },
            status=status_code,
        )


class AethelDetailView(APIView):
    def get(self, request: HttpRequest) -> JsonResponse:
        query_input = self.request.query_params.get("sample-name", None)

        if query_input is None:
            response = AethelDetailResponse(error=AethelDetailError.NO_QUERY_INPUT)
            return response.json_response()

        samples = dataset.find_by_name(query_input)

        if len(samples) == 0:
            response = AethelDetailResponse(error=AethelDetailError.SAMPLE_NOT_FOUND)
            return response.json_response()

        if len(samples) > 1:
            response = AethelDetailResponse(error=AethelDetailError.MULTIPLE_FOUND)
            return response.json_response()

        sample = samples[0]

        response = AethelDetailResponse()
        response.parse_sample(sample)

        return response.json_response()
