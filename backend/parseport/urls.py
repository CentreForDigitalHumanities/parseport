"""parseport URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/3.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.conf.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""

from django.urls import path, include
from django.contrib import admin
from django.views.generic import RedirectView

from rest_framework import routers

from spindle.views import SpindleView
from .views import StatusView


api_router = routers.DefaultRouter()  # register viewsets with this router


urlpatterns = [
    path("admin", RedirectView.as_view(url="/admin/", permanent=True)),
    path("api", RedirectView.as_view(url="/api/", permanent=True)),
    path("api-auth", RedirectView.as_view(url="/api-auth/", permanent=True)),
    path("admin/", admin.site.urls),
    path("api/", include(api_router.urls)),
    path("api/status/", StatusView.as_view(), name="status"),
    path("api/spindle/<str:mode>", SpindleView.as_view(), name="spindle"),
    path("api/aethel/", include("aethel_db.urls")),
    path("api/mp/", include("minimalist_parser.urls")),
    path(
        "api-auth/",
        include(
            "rest_framework.urls",
            namespace="rest_framework",
        ),
    ),
    path("vulcan/", include("vulcan.urls")),
]
