from collections import defaultdict
from dataclasses import dataclass
from parseport.logger import logger

from django.conf import settings

from aethel import ProofBank
from aethel.frontend import Sample


@dataclass(frozen=True)
class IndexedProofBank(ProofBank):
    type_index: dict[str, list[int]]
    word_index: dict[str, list[int]]

    def __post_init__(self):
        logger.info("Dataset loaded.")

    def by_type(self, type: str) -> list[Sample]:
        return [self.samples[i] for i in self.type_index.get(type, [])]

    def by_word(self, word: str) -> list[Sample]:
        return [self.samples[i] for i in self.word_index.get(word, [])]

    def by_words(self, words: list[str]) -> list[Sample]:
        candidates = set(self.word_index.get(words[0], []))

        for word in words[1:]:
            candidates = candidates.intersection(set(self.word_index.get(word, [])))

        return [self.samples[i] for i in candidates]


dataset: IndexedProofBank | None = None


def load_dataset():
    global dataset
    proofbank = ProofBank.load_data(settings.DATASET_PATH)
    type_index = defaultdict(list)
    word_index = defaultdict(list)

    if settings.DEBUG:
        total_length = len(proofbank.samples)
        n = 1
        print("Indexing dataset...")

    for sample_index, sample in enumerate(proofbank.samples):
        for phrase in sample.lexical_phrases:
            type_index[str(phrase.type)].append(sample_index)
            for item in phrase.items:
                word_index[item.word].append(sample_index)

        if settings.DEBUG:
            progress(n, total_length)
            n += 1

    dataset = IndexedProofBank(
        samples=proofbank.samples,
        type_index=dict(type_index),
        word_index=dict(word_index),
        version=proofbank.version,
    )


def progress(iteration, total, width=80, start="\r", newline_on_complete=True):
    """
    Prints a progress bar to the console in the form of: |█████████-----| 5/10.

    Only if we're in DEBUG mode.

    Parameters:
    - iteration (int): The current iteration.
    - total (int): The total number of iterations.
    - width (int, optional): The width of the progress bar. Defaults to 80.
    - start (str, optional): The character(s) to display at the start of the progress bar. Defaults to "\r".
    - newline_on_complete (bool, optional): Whether to print a new line when the iteration is complete. Defaults to True.
    """
    width = width - 2
    tally = f" {iteration}/{total}"
    width -= len(tally)
    filled_length = int(width * iteration // total)
    bar = "█" * filled_length + "-" * (width - filled_length)
    print(f"{start}|{bar}|{tally}", end="")
    # Print New Line on Complete
    if newline_on_complete and iteration == total:
        print()
