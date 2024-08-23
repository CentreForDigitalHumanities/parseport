from dataclasses import asdict, dataclass, field
import json
from django.http import HttpRequest, JsonResponse
from rest_framework.views import APIView
from rest_framework import status

from aethel.frontend import Sample

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


@dataclass
class AethelSampleDataResult:
    name: str
    phrases: list[AethelSampleDataPhrase] = field(default_factory=list)

    def serialize(self):
        return asdict(self)


@dataclass
class AethelSampleDataResponse:
    results: list[AethelSampleDataResult] = field(default_factory=list)
    error: str | None = None

    def get_or_create_sample(self, sample: Sample) -> AethelSampleDataResult:
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

    def highlight_phrase(
        self, sample: AethelSampleDataResult, highlighted_phrase_index: int
    ) -> None:
        sample.phrases[highlighted_phrase_index].highlight = True

    def json_response(self) -> JsonResponse:
        return JsonResponse(
            {
                "results": [r.serialize() for r in self.results],
                "error": self.error,
            },
            status=status.HTTP_200_OK,
        )


import cProfile
class AethelSampleDataView(APIView):
    def get(self, request: HttpRequest) -> JsonResponse:
        type_input = self.request.query_params.get("type", None)
        word_input = self.request.query_params.get("word", None)

        if word_input:
            word_input = json.loads(word_input)

        response_object = AethelSampleDataResponse()

        assert dataset is not None
        by_type = dataset.by_type(type_input)
        by_word = dataset.by_word(' '.join(word_input))
        by_name = {sample.name: sample for sample in by_type + by_word}
        # we have to do the intersection by name because Samples are not hashable
        intersection = set(s.name for s in by_type).intersection(set(s.name for s in by_word))
        samples = [by_name[name] for name in intersection]

        for sample in samples:
            for phrase_index, phrase in enumerate(sample.lexical_phrases):
                word_match = word_input and match_word_with_phrase_exact(
                    phrase, word_input
                )
                type_match = type_input and match_type_with_phrase(phrase, type_input)

                if not (word_match and type_match):
                    continue

                aethel_sample = response_object.get_or_create_sample(sample=sample)

                response_object.highlight_phrase(
                    sample=aethel_sample, highlighted_phrase_index=phrase_index
                )

        return response_object.json_response()
