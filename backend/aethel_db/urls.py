from django.urls import path
from aethel_db.views.detail import AethelDetailView
from aethel_db.views.list import AethelListView
from aethel_db.views.sample_data import AethelSampleDataView

urlpatterns = [
    path("", AethelListView.as_view(), name="aethel-list"),
    path("sample", AethelDetailView.as_view(), name="aethel-detail"),
    path("sample-data", AethelSampleDataView.as_view(), name="aethel-sample-data"),
]
