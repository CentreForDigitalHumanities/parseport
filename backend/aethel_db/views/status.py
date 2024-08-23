from aethel_db.models import dataset


def aethel_status():
    return dataset is not None
