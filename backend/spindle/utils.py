from aethel.frontend import LexicalPhrase
from aethel.mill.types import type_prefix, type_repr


def serialize_phrases_with_infix_notation(
    lexical_phrases: list[LexicalPhrase],
) -> list[dict[str, str]]:
    """
    Serializes a list of LexicalPhrases in a human-readable infix notation that is already available in Æthel in Type.__repr__ or type_repr(). This is used to display the types in the frontend.

    The standard JSON serialization of phrases uses a prefix notation for types, which is good for data-exchange purposes (easier parsing) but less ideal for human consumption. This notation will be used to query.
    """
    return [
        dict(
            phrase.json(),
            display_type=type_repr(phrase.type),
            type=type_prefix(phrase.type),
        )
        for phrase in lexical_phrases
    ]
