from dataclasses import asdict, dataclass, field

from django.http import HttpRequest, JsonResponse
from rest_framework import status
from rest_framework.views import APIView

from aethel_db.search import match_type_with_phrase, match_word_with_phrase
from aethel_db.models import dataset


@dataclass
class AethelListSamplePhrase:
    display: str
    highlight: bool


@dataclass
class AethelListSample:
    name: str
    phrases: list[AethelListSamplePhrase] = field(default_factory=list)


@dataclass
class AethelListItem:
    lemma: str
    word: str
    type: str
    samples: list[AethelListSample] = field(default_factory=list)

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

    results: dict[tuple[str, str, str], AethelListItem] = field(default_factory=dict)
    error: str | None = None

    def get_or_create_result(self, lemma: str, word: str, type: str) -> AethelListItem:
        """
        Return an existing result with the same lemma, word, and type, or create a new one if it doesn't exist.
        """
        key = (lemma, word, type)
        new_result = AethelListItem(lemma=lemma, word=word, type=type, samples=[])
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
                        new_phrase = AethelListSamplePhrase(
                            display=sample_phrase.string,
                            highlight=highlighted,
                        )
                        new_sample.phrases.append(new_phrase)
                    result.samples.append(new_sample)

        return response_object.json_response()
