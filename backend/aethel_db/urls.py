from django.urls import path
from aethel_db.views.AethelDetailView import AethelDetailView
from aethel_db.views.AethelListView import AethelListView
from aethel_db.views.AethelSampleDataView import AethelSampleDataView

urlpatterns = [
    path("", AethelListView.as_view(), name="aethel-list"),
    path("sample", AethelDetailView.as_view(), name="aethel-detail"),
    path("sample-data", AethelSampleDataView.as_view(), name="aethel-sample-data"),
]
