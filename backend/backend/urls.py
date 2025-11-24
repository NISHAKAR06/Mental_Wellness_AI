from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse

def root_view(request):
    return JsonResponse({
        "status": "online",
        "message": "Mental Wellness AI Backend is running",
        "version": "1.0.0"
    })

urlpatterns = [
    path("", root_view, name="root"),
    path("admin/", admin.site.urls),
    path("api/", include("api.urls")),
]
