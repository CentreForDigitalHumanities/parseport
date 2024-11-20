from django.http import HttpRequest, HttpResponse, JsonResponse
from django.views import View


# Create your views here.
class MPParseView(View):
    def post(self, request: HttpRequest) -> HttpResponse:
        return JsonResponse({"message": "MP Parser is connected!"})
