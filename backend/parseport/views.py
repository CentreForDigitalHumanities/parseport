from rest_framework.views import APIView
from rest_framework.response import Response

from aethel_db.views.status import aethel_status
from spindle.views import spindle_status


class StatusView(APIView):
    def get(self, request):
        return Response(dict(
            aethel=aethel_status(),
            spindle=spindle_status()
        ))
