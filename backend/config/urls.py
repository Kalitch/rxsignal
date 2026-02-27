from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/", include("apps.core.urls")),
    path("api/fda/", include("apps.fda.urls")),
    path("api/ai/", include("apps.intelligence.urls")),
]
