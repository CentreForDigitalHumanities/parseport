from aethel_db.models import dataset


def aethel_status() -> bool:
    return dataset is not None
