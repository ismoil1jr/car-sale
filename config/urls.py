from django.conf import settings
from django.contrib import admin
from django.urls import include, path, re_path
from django.views.static import serve

from main.media import media_serve

urlpatterns = [
    path("admin/", admin.site.urls),
    path("", include("main.urls")),
    # Rasmlar (media) va DEBUG o'chiq bo'lganda statik fayllar (collectstatic natijasi).
    # Katta trafikda bularni web-server (PythonAnywhere "Static files") bergani yaxshiroq.
    re_path(r"^media/(?P<path>.*)$", media_serve),
]
if not settings.DEBUG:
    urlpatterns.append(
        re_path(r"^assets/(?P<path>.*)$", serve, {"document_root": settings.STATIC_ROOT})
    )

handler404 = "main.views.not_found"
