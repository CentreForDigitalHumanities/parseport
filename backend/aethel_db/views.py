from dataclasses import asdict, dataclass, field
from enum import Enum
from typing import List, Optional

from django.http import HttpRequest, JsonResponse
from rest_framework import status
from rest_framework.views import APIView
from aethel.frontend import LexicalItem
from spindle.utils import serialize_phrases_with_infix_notation
from aethel_db.search import search, in_lemma, in_word
from aethel.frontend import Sample

from aethel.frontend import LexicalItem

from .models import dataset
from .search import search, in_lemma, in_word


def aethel_status():
    return dataset is not None


@dataclass
class AethelListSample:
    name: str
    sentence: str


@dataclass
class AethelListItem:
    lemma: str
    word: str
    type: str
    samples: List[AethelListSample] = field(default_factory=list)

    def serialize(self):
        out = asdict(self)
        out['samples'] = sorted(out['samples'], key=lambda sample: len(sample['sentence']))
        return out


@dataclass
class AethelListResponse:
    """
    Response object for Aethel query view.
    """

    results: List[AethelListItem] = field(default_factory=list)
    error: Optional[str] = None

    def existing_result(
        self, lemma: str, word: str, type: str
    ) -> Optional[AethelListItem]:
        """
        Return an existing result with the same lemma, word, and type, if it exists.
        """
        for item in self.results:
            if item.lemma == lemma and item.type == type and item.word == word:
                return item
        return None

    def add_result(
        self, lemma: str, word: str, type: str, sample_name: str, sample_sentence: str
    ) -> None:
        result_item = self.existing_result(lemma, word, type)

        if result_item is None:
            result_item = AethelListItem(lemma=lemma, word=word, type=type)
            self.results.append(result_item)

        result_item.samples.append(
            AethelListSample(name=sample_name, sentence=sample_sentence)
        )

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
        query_input = self.request.query_params.get("query", None)
        if query_input is None or len(query_input) < 3:
            return AethelListResponse().json_response()

        # First we select all relevant samples from the dataset that contain the query string.
        query_result = search(
            bank=dataset.samples,
            query=in_word(query_input) | in_lemma(query_input),
        )

        def item_contains_query_string(item: LexicalItem) -> bool:
            return (
                query_input.lower() in item.lemma.lower()
                or query_input.lower() in item.word.lower()
            )

        response_object = AethelListResponse()
        # Then we loop over the samples and extract what we need from them (lemma, word, type etc.).
        for sample in query_result:
            lexical_phrases = sample.lexical_phrases
            for phrase in lexical_phrases:
                for item in phrase.items:
                    if item_contains_query_string(item):
                        response_object.add_result(
                            item.lemma,
                            item.word,
                            str(phrase.type),
                            sample.name,
                            sample.sentence,
                        )

        return response_object.json_response()


class AethelDetailError(Enum):
    NO_QUERY_INPUT = "NO_QUERY_INPUT"
    SAMPLE_NOT_FOUND = "SAMPLE_NOT_FOUND"
    MULTIPLE_FOUND = "MULTIPLE_FOUND"


aethel_detail_status_codes = {
    AethelDetailError.NO_QUERY_INPUT: status.HTTP_400_BAD_REQUEST,
    AethelDetailError.SAMPLE_NOT_FOUND: status.HTTP_404_NOT_FOUND,
    AethelDetailError.MULTIPLE_FOUND: status.HTTP_500_INTERNAL_SERVER_ERROR
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
        status_code = aethel_detail_status_codes[self.error] if self.error else status.HTTP_200_OK

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
