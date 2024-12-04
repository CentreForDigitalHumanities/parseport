from django.shortcuts import render
from django.views import View

# Create your views here.
class VulcanView(View):
    def get(self, request, *args, **kwargs):
        route_param = kwargs.get('id' , None)

        print("Route param:", route_param)

        context = {'hello': 'Hello, Vulcan!'}
        return render(request, 'vulcan/index.html', context)
