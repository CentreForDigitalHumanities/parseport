from django.urls import path

from minimalist_parser.views.parse import MPParseView

urlpatterns = [path("parse", MPParseView.as_view(), name="mp-parse")]
