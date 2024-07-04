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
class AethelSamplePhrase:
    index: str
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


@dataclass
class AethelListResponse:
    """
    Response object for Aethel query view.
    """

    results: List[AethelListItem] = field(default_factory=list)
    error: Optional[str] = None

    def get_or_create_existing_result(
        self, lemma: str, word: str, type: str
    ) -> AethelListItem:
        """
        Return an existing result with the same lemma, word, and type, or create a new one if it doesn't exist.
        """
        for result in self.results:
            if result.lemma == lemma and result.type == type and result.word == word:
                return result
        return AethelListItem(lemma=lemma, word=word, type=type, samples=[])

    def json_response(self) -> JsonResponse:
        results = [asdict(result) for result in self.results]

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

        def item_contains_query_string(item: LexicalItem, query_input: str) -> bool:
            """
            Checks if a LexicalItem contains a given input string in its word or its lemma.
            """
            return (
                query_input.lower() in item.lemma.lower()
                or query_input.lower() in item.word.lower()
            )

        def serialize_sample(
            sample: Sample, highlighted_phrase_indices: set[int]
        ) -> AethelListSample:
            """
            Turns a Sample into an AethelListSample, while marking phrases that should be highlighted.
            """
            new_phrases = []
            for index, phrase in enumerate(sample.lexical_phrases):
                highlighted = index in highlighted_phrase_indices
                new_phrase = AethelSamplePhrase(
                    index=index,
                    display=phrase.string,
                    highlight=highlighted,
                )
                new_phrases.append(new_phrase)

            return AethelListSample(sample.name, new_phrases)

        response_object = AethelListResponse()

        # First we select all relevant samples from the dataset that contain the query string.
        query_result = search(
            bank=dataset.samples,
            query=in_word(query_input) | in_lemma(query_input),
        )

        # Then we transform the results.
        # Each key in result_dict is a unique combination of lemma, word, and type.
        # Each value is a sample, mapped to a set of indices referring to the specific phrase that has the type.
        result_dict: dict[tuple[str, str, str], dict[str, set]] = {}
        for sample in query_result:
            for phrase_index, phrase in enumerate(sample.lexical_phrases):
                for item in phrase.items:
                    if item_contains_query_string(item, query_input):
                        key = (item.lemma, item.word, str(phrase.type))
                        # setdefault gets the value for a given key or adds the key with a provided value if None is found.
                        samples = result_dict.setdefault(key, {})
                        phrase_indices = samples.setdefault(sample.name, set())
                        phrase_indices.add(phrase_index)

        # Finally, we serialize the samples and add them to the response object.
        for key, samples in result_dict.items():
            lemma, word, type = key
            list_item = response_object.get_or_create_existing_result(
                lemma=lemma, word=word, type=type
            )
            for sample_name, phrase_indices in samples.items():
                sample = dataset.find_by_name(sample_name).pop()
                list_item.samples.append(serialize_sample(sample, phrase_indices))
            response_object.results.append(list_item)

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
