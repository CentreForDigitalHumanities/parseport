from dataclasses import asdict, dataclass, field
from enum import Enum
from typing import List, Optional

from django.http import HttpRequest, JsonResponse
from rest_framework import status
from rest_framework.views import APIView
from spindle.utils import serialize_phrases_with_infix_notation
from aethel_db.search import (
    match_type_with_phrase,
    match_word_with_phrase,
)
from aethel.frontend import Sample
from .models import dataset


def aethel_status():
    return dataset is not None


@dataclass
class AethelSamplePhrase:
    display: str
    highlight: bool


@dataclass
class AethelListSample:
    name: str
    phrases: List[AethelSamplePhrase] = field(default_factory=list)


@dataclass
class AethelListItem:
    lemma: str
    word: str
    type: str
    samples: List[AethelListSample] = field(default_factory=list)

    def serialize(self):
        out = asdict(self)
        out["samples"] = sorted(
            out["samples"], key=lambda sample: len(sample["phrases"])
        )
        return out


@dataclass
class AethelListResponse:
    """
    Response object for Aethel query view.
    """

    results: List[AethelListItem] = field(default_factory=list)
    error: Optional[str] = None

    def get_or_create_result(self, lemma: str, word: str, type: str) -> AethelListItem:
        """
        Return an existing result with the same lemma, word, and type, or create a new one if it doesn't exist.
        """
        for result in self.results:
            if result.lemma == lemma and result.type == type and result.word == word:
                return result
        new_result = AethelListItem(lemma=lemma, word=word, type=type, samples=[])
        self.results.append(new_result)
        return new_result

    def json_response(self) -> JsonResponse:
        results = [result.serialize() for result in self.results]

        return JsonResponse(
            {
                "results": results,
                "error": self.error,
            },
            status=status.HTTP_200_OK,
        )


class AethelQueryView(APIView):
    def get(self, request: HttpRequest) -> JsonResponse:
        word_input = self.request.query_params.get("word", None)
        type_input = self.request.query_params.get("type", None)

        # We only search for strings of 3 or more characters.
        if word_input is not None and len(word_input) < 3:
            return AethelListResponse().json_response()

        response_object = AethelListResponse()

        for sample in dataset.samples:
            for phrase_index, phrase in enumerate(sample.lexical_phrases):
                word_match = word_input and match_word_with_phrase(phrase, word_input)
                type_match = type_input and match_type_with_phrase(phrase, type_input)
                if not (word_match or type_match):
                    continue

                phrase_word = " ".join([item.word for item in phrase.items])
                phrase_lemma = " ".join([item.lemma for item in phrase.items])

                result = response_object.get_or_create_result(
                    lemma=phrase_lemma, word=phrase_word, type=str(phrase.type)
                )

                # Check whether we have already added this sample for this result.
                existing_sample = next(
                    (s for s in result.samples if s.name == sample.name),
                    None,
                )

                if existing_sample:
                    existing_sample.phrases[phrase_index].highlight = True
                else:
                    new_sample = AethelListSample(name=sample.name, phrases=[])
                    for index, sample_phrase in enumerate(sample.lexical_phrases):
                        highlighted = index == phrase_index
                        new_phrase = AethelSamplePhrase(
                            display=sample_phrase.string,
                            highlight=highlighted,
                        )
                        new_sample.phrases.append(new_phrase)
                    result.samples.append(new_sample)

        return response_object.json_response()


class AethelDetailError(Enum):
    NO_QUERY_INPUT = "NO_QUERY_INPUT"
    SAMPLE_NOT_FOUND = "SAMPLE_NOT_FOUND"
    MULTIPLE_FOUND = "MULTIPLE_FOUND"


aethel_detail_status_codes = {
    AethelDetailError.NO_QUERY_INPUT: status.HTTP_400_BAD_REQUEST,
    AethelDetailError.SAMPLE_NOT_FOUND: status.HTTP_404_NOT_FOUND,
    AethelDetailError.MULTIPLE_FOUND: status.HTTP_500_INTERNAL_SERVER_ERROR,
}


@dataclass
class AethelDetailResult:
    sentence: str
    name: str
    term: str
    subset: str
    phrases: list[dict]


@dataclass
class AethelDetailResponse:
    result: Optional[AethelDetailResult] = None
    error: Optional[AethelDetailError] = None

    def parse_sample(self, sample: Sample) -> None:
        self.result = AethelDetailResult(
            sentence=sample.sentence,
            name=sample.name,
            term=str(sample.proof.term),
            subset=sample.subset,
            phrases=serialize_phrases_with_infix_notation(sample.lexical_phrases),
        )

    def json_response(self) -> JsonResponse:
        result = asdict(self.result) if self.result else None
        status_code = (
            aethel_detail_status_codes[self.error] if self.error else status.HTTP_200_OK
        )

        return JsonResponse(
            {
                "result": result,
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
