from django.contrib import admin

from . import dashboard


class InomarkaAdminSite(admin.AdminSite):
    site_header = "Inomarka Bor — boshqaruv paneli"
    site_title = "Inomarka Bor"
    index_title = "Dashboard"
    index_template = "admin/dashboard.html"

    def index(self, request, extra_context=None):
        return super().index(request, {**dashboard.context(), **(extra_context or {})})
