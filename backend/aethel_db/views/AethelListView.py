from dataclasses import dataclass, field

from django.http import HttpRequest, JsonResponse
from rest_framework import status
from rest_framework.views import APIView

from aethel_db.search import match_type_with_phrase, match_word_with_phrase
from aethel_db.models import dataset


@dataclass
class AethelListItem:
    lemma: str
    word: str
    type: str
    sampleCount: int = 0
    # Counter for the number of samples that contain this item.
    # Not meant to be serialized / sent to the frontend.
    _sample_names: set[str] = field(default_factory=set)

    def serialize(self):
        out = {
            "lemma": self.lemma,
            "word": self.word,
            "type": self.type,
            "sampleCount": len(self._sample_names),
        }
        return out


@dataclass
class AethelListResponse:
    """
    Response object for Aethel query view.
    """

    results: dict[tuple[str, str, str], AethelListItem] = field(default_factory=dict)
    error: str | None = None

    def get_or_create_result(self, lemma: str, word: str, type: str) -> AethelListItem:
        """
        Return an existing result with the same lemma, word, and type, or create a new one if it doesn't exist.
        """
        key = (lemma, word, type)
        new_result = AethelListItem(lemma=lemma, word=word, type=type, sampleCount=0)
        return self.results.setdefault(key, new_result)

    def json_response(self) -> JsonResponse:
        results = [result.serialize() for result in self.results.values()]

        return JsonResponse(
            {
                "results": results,
                "error": self.error,
            },
            status=status.HTTP_200_OK,
        )


class AethelListView(APIView):
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

                result._sample_names.add(sample.name)

        return response_object.json_response()
