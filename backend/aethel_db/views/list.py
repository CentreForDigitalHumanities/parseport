from dataclasses import asdict, dataclass, field
from enum import Enum

from django.http import HttpRequest, JsonResponse
from rest_framework import status
from rest_framework.views import APIView

from aethel_db.search import match_type_with_phrase, match_word_with_phrase
from aethel_db.models import dataset

from aethel.frontend import LexicalPhrase
from aethel.mill.types import type_prefix, Type, type_repr, parse_prefix


@dataclass
class AethelListLexicalItem:
    word: str
    lemma: str


@dataclass
class AethelListPhrase:
    items: list[AethelListLexicalItem]


class AethelListError(Enum):
    INVALID_LIMIT_OR_SKIP = "INVALID_LIMIT_OR_SKIP"
    WORD_TOO_SHORT = "WORD_TOO_SHORT"
    CANNOT_PARSE_TYPE = "CANNOT_PARSE_TYPE"


@dataclass
class AethelListResult:
    phrase: AethelListPhrase
    display_type: str
    type: str
    sampleCount: int = 0
    # Counter for the number of samples that contain this item.
    # Not meant to be serialized / sent to the frontend.
    _sample_names: set[str] = field(default_factory=set)

    def serialize(self):
        return {
            "phrase": asdict(self.phrase),
            "displayType": self.display_type,
            "type": self.type,
            "sampleCount": len(self._sample_names),
        }


@dataclass
class AethelListResponse:
    """
    Response object for Aethel query view.
    """

    results: dict[tuple[str, str, str], AethelListResult] = field(default_factory=dict)
    error: AethelListError | None = None
    sort: str | None = None
    limit: int = 10
    skip: int = 0

    def get_or_create_result(
        self, phrase: LexicalPhrase, type: Type
    ) -> AethelListResult:
        """
        Return an existing result with the same lemma, word, and type, or create a new one if it doesn't exist.
        """
        items = [
            AethelListLexicalItem(word=item.word, lemma=item.lemma)
            for item in phrase.items
        ]
        new_phrase = AethelListPhrase(items=items)

        # type_repr uses a parenthesised notation, used for frontend.
        display_type = type_repr(type)

        # type_prefix uses a space-separated notation, expected by parse_prefix in AethelSampleDataView.
        type = type_prefix(type)

        # Construct a unique 'key' for every combination of word, lemma and type, so we can group samples.
        key_word = tuple(item.word for item in phrase.items)
        key_lemma = tuple(item.lemma for item in phrase.items)
        key = (key_word, key_lemma, type)

        new_result = AethelListResult(
            phrase=new_phrase,
            display_type=display_type,
            type=type,
            sampleCount=0,
        )
        return self.results.setdefault(key, new_result)

    def _sort_results(self, results: list[dict]) -> list[dict]:
        if self.sort is None:
            return results

        descending = self.sort.startswith("-")
        sort_key = self.sort.lstrip("-")

        def combine_word(phrase: dict) -> str:
            return " ".join([item["word"].lower() for item in phrase["items"]])

        def combine_lemma(phrase: dict) -> str:
            return " ".join([item["lemma"].lower() for item in phrase["items"]])

        match sort_key:
            case "sampleCount":
                sorted_list = sorted(
                    results, key=lambda x: x["sampleCount"], reverse=descending
                )
            case "word":
                sorted_list = sorted(
                    results, key=lambda x: combine_word(x["phrase"]), reverse=descending
                )
            case "lemma":
                sorted_list = sorted(
                    results,
                    key=lambda x: combine_lemma(x["phrase"]),
                    reverse=descending,
                )
            case "type":
                sorted_list = sorted(
                    results, key=lambda x: x["displayType"], reverse=descending
                )
            case _:
                sorted_list = results

        return sorted_list

    def json_response(self) -> JsonResponse:
        if self.error:
            return JsonResponse(
                {
                    "results": [],
                    "totalCount": 0,
                    "error": self.error.value,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        total_count = len(self.results)
        limit = min(self.limit, total_count)
        skip = max(0, self.skip)
        paginated = list(self.results.values())[skip : skip + limit]
        serialized = [result.serialize() for result in paginated]
        sorted = self._sort_results(serialized)

        return JsonResponse(
            {
                "results": sorted,
                "totalCount": total_count,
                "error": self.error,
            },
            status=status.HTTP_200_OK,
        )


class AethelListView(APIView):
    def get(self, request: HttpRequest) -> JsonResponse:
        word_input = self.request.query_params.get("word", None)
        type_input = self.request.query_params.get("type", None)
        limit = self.request.query_params.get("limit", 10)
        skip = self.request.query_params.get("skip", 0)
        sort = self.request.query_params.get("sort", None)

        try:
            limit = int(limit)
            skip = int(skip)
        except ValueError:
            return AethelListResponse(
                error=AethelListError.INVALID_LIMIT_OR_SKIP
            ).json_response()

        # We only search for strings of 3 or more characters.
        if word_input is not None and len(word_input) < 3:
            return AethelListResponse(
                error=AethelListError.WORD_TOO_SHORT
            ).json_response()

        response_object = AethelListResponse(sort=sort, skip=skip, limit=limit)

        try:
            parsed_type = parse_prefix(type_input) if type_input else None
        except Exception:
            response_object.error = AethelListError.CANNOT_PARSE_TYPE
            return response_object.json_response()

        for sample in dataset.samples:
            for phrase in sample.lexical_phrases:
                word_match = word_input and match_word_with_phrase(phrase, word_input)
                type_match = parsed_type and match_type_with_phrase(phrase, parsed_type)
                if not (word_match or type_match):
                    continue

                result = response_object.get_or_create_result(
                    phrase=phrase,
                    type=phrase.type,
                )

                result._sample_names.add(sample.name)

        return response_object.json_response()
