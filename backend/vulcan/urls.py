from django.urls import path, re_path

from vulcan.views import VulcanView

urlpatterns = [
    re_path(r'^(?P<id>\w+)?$', VulcanView.as_view(), name='vulcan'),
]
