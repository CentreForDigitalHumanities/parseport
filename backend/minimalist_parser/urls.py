from django.urls import path

from minimalist_parser.views.parse import MGParserView

urlpatterns = [path("parse", MGParserView.as_view(), name="mp-parse")]
