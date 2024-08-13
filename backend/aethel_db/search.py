from __future__ import annotations
from typing import Iterable, Callable, Iterator
from aethel.frontend import Sample, LexicalPhrase, LexicalItem
from aethel.mill.types import type_repr

# The following methods and classes have been extracted from aethel.scripts.search (not part of the published library), with some minor customisations / simplifications.


def search(bank: Iterable[Sample], query: Callable[[Sample], bool]) -> Iterator[Sample]:
    return filter(query, bank)


def get_query(word_input: str | None = None, type_input: str | None = None) -> Query:
    def f(sample: Sample) -> bool:
        return any(
            match_word_with_phrase(phrase, word_input) or match_type(phrase, type_input)
            for phrase in sample.lexical_phrases
        )

    return Query(f)


def match_type(phrase: LexicalPhrase, type_input: str | None) -> bool:
    if type_input is None:
        return False
    return type_input == type_repr(phrase.type)


def match_word_with_phrase(phrase: LexicalPhrase, word_input: str | None) -> bool:
    if word_input is None:
        return False
    return any(match_word_with_item(item, word_input) for item in phrase.items)


def match_word_with_item(item: LexicalItem, word_input: str) -> bool:
    return (
        word_input.lower() in item.lemma.lower()
        or word_input.lower() in item.word.lower()
    )


class Query:
    def __init__(self, fn: Callable[[Sample], bool]):
        self.fn = fn

    def __and__(self, other: Query) -> Query:
        def f(sample: Sample) -> bool:
            return self.fn(sample) and other.fn(sample)

        return Query(f)

    def __or__(self, other) -> Query:
        def f(sample: Sample) -> bool:
            return self.fn(sample) or other.fn(sample)

        return Query(f)

    def __invert__(self) -> Query:
        def f(sample: Sample) -> bool:
            return not self.fn(sample)

        return Query(f)

    def __xor__(self, other) -> Query:
        def f(sample: Sample) -> bool:
            return self.fn(sample) ^ other.fn(sample)

        return Query(f)

    def __call__(self, sample: Sample) -> bool:
        return self.fn(sample)
