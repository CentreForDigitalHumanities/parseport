from collections import defaultdict
from dataclasses import dataclass
from typing import Optional

from aethel.frontend import Sample
from django.conf import settings

from aethel import ProofBank


@dataclass(frozen=True)
class IndexedProofBank(ProofBank):
    type_index: dict[str, list[int]]
    word_index: dict[str, list[int]]

    def by_type(self, typ: str) -> list[Sample]:
        return [self.samples[i] for i in self.type_index.get(typ, [])]

    def by_word(self, word: str) -> list[Sample]:
        return [self.samples[i] for i in self.word_index.get(word, [])]

dataset: Optional[IndexedProofBank] = None

def load_dataset():
    global dataset
    proofbank = ProofBank.load_data(settings.DATASET_PATH)
    type_index = defaultdict(list)
    word_index = defaultdict(list)

    for sample_index, sample in enumerate(proofbank.samples):
        for phrase in sample.lexical_phrases:
            type_index[str(phrase.type)].append(sample_index)
            for item in phrase.items:
                word_index[item.word].append(sample_index)

    dataset = IndexedProofBank(samples=proofbank.samples,
                               type_index=dict(type_index),
                               word_index=dict(word_index),
                               version=proofbank.version)
