from dataclasses import asdict, dataclass, field
from enum import Enum
import json
from django.http import HttpRequest, JsonResponse
from rest_framework.views import APIView
from rest_framework import status

from aethel.frontend import Sample, Type

from aethel_db.models import dataset
from aethel_db.search import (
    match_type_with_phrase,
    match_word_with_phrase_exact,
)


@dataclass
class AethelSampleDataPhrase:
    index: int
    display: str
    highlight: bool


class AethelSampleError(Enum):
    INVALID_WORD = "INVALID_WORD"
    NO_INPUT = "NO_INPUT"


@dataclass
class AethelSampleDataResult:
    name: str
    phrases: list[AethelSampleDataPhrase] = field(default_factory=list)

    def highlight_phrase_at_index(self, index: int) -> None:
        self.phrases[index].highlight = True

    def serialize(self):
        return asdict(self)


@dataclass
class AethelSampleDataResponse:
    results: list[AethelSampleDataResult] = field(default_factory=list)
    error: AethelSampleError | None = None

    def get_or_create_result(self, sample: Sample) -> AethelSampleDataResult:
        """
        Return an existing result with the same sample.name if it exists. Else create a new one.
        """
        existing = next(
            (result for result in self.results if result.name == sample.name), None
        )
        if existing:
            return existing
        phrases = [
            AethelSampleDataPhrase(display=phrase.string, highlight=False, index=index)
            for index, phrase in enumerate(sample.lexical_phrases)
        ]
        new_result = AethelSampleDataResult(name=sample.name, phrases=phrases)
        self.results.append(new_result)
        return new_result

    def json_response(self) -> JsonResponse:
        serialized = [result.serialize() for result in self.results]
        return JsonResponse(
            {
                "results": serialized,
                "error": self.error,
            },
            status=status.HTTP_200_OK,
        )


class AethelSampleDataView(APIView):
    def get(self, request: HttpRequest) -> JsonResponse:
        type_input = self.request.query_params.get("type", None)
        word_input = self.request.query_params.get("word", None)

        response_object = AethelSampleDataResponse()

        error = self.validate_input(type_input, word_input)

        if error:
            response_object.error = error
            return response_object.json_response()

        word_input = json.loads(word_input)

        if dataset is None:
            raise Exception("Dataset is not loaded.")

        # parse_prefix expects a type string with spaces.
        type_input = Type.parse_prefix(type_input, debug=True)
        by_type = dataset.by_type(str(type_input))  # re-serialize type to match index
        by_word = dataset.by_words(word_input)
        by_name = {sample.name: sample for sample in by_type + by_word}
        # we have to do the intersection by name because Samples are not hashable
        intersection = set(s.name for s in by_type).intersection(
            set(s.name for s in by_word)
        )
        samples = [by_name[name] for name in intersection]

        for sample in samples:
            for phrase_index, phrase in enumerate(sample.lexical_phrases):
                word_match = match_word_with_phrase_exact(phrase, word_input)
                type_match = match_type_with_phrase(phrase, type_input)

                if not (word_match and type_match):
                    continue

                aethel_sample = response_object.get_or_create_result(sample=sample)

                aethel_sample.highlight_phrase_at_index(index=phrase_index)

        return response_object.json_response()

    def validate_input(
        self,
        type_input: str | None,
        word_input: str | None,
    ) -> AethelSampleError | None:
        try:
            word_input = json.loads(word_input)
        except json.JSONDecodeError:
            return AethelSampleError.INVALID_WORD

        if not type_input or not word_input:
            # Not expected.
            return AethelSampleError.NO_INPUT
