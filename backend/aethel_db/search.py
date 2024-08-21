from __future__ import annotations
from aethel.frontend import LexicalPhrase, LexicalItem
from aethel.mill.types import type_repr


def match_type_with_phrase(phrase: LexicalPhrase, type_input: str) -> bool:
    return type_input == type_repr(phrase.type)


def match_word_with_phrase(phrase: LexicalPhrase, word_input: str) -> bool:
    return any(match_word_with_item(item, word_input) for item in phrase.items)


def match_word_with_item(item: LexicalItem, word_input: str) -> bool:
    return (
        word_input.lower() in item.lemma.lower()
        or word_input.lower() in item.word.lower()
    )


def match_word_with_phrase_exact(phrase: LexicalPhrase, word_input: str) -> bool:
    return any(item.word == word_input for item in phrase.items)
