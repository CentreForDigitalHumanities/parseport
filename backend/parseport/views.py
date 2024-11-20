from typing import Literal
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response

from parseport.http_client import http_client
from aethel_db.views.status import aethel_status

SERVICE_URL_MAPPING = {
    "spindle": settings.SPINDLE_URL,
    "minimalist_parser": settings.MINIMALIST_PARSER_URL,
    "vulcan": settings.VULCAN_URL,
}


def status_check(service: Literal["spindle", "minimalist_parser", "vulcan"]) -> bool:
    try:
        r = http_client.request(
            method="GET",
            url=SERVICE_URL_MAPPING[service] + "/status/",
            headers={"Content-Type": "application/json"},
            timeout=1,
            retries=False,
        )
        return r.status < 400
    except Exception:
        return False


class StatusView(APIView):
    def get(self, request):
        return Response(
            dict(
                aethel=aethel_status(),
                spindle=status_check('spindle'),
                mp=status_check('minimalist_parser'),
                vulcan=status_check('vulcan'),
            )
        )
