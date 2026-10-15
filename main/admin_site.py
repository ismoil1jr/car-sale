from django.contrib import admin
from django.http import JsonResponse
from django.template.loader import render_to_string
from django.urls import path

from . import dashboard


class InomarkaAdminSite(admin.AdminSite):
    site_header = "Inomarka Bor — boshqaruv paneli"
    site_title = "Inomarka Bor"
    index_title = "Dashboard"
    index_template = "admin/dashboard.html"

    def index(self, request, extra_context=None):
        return super().index(request, {**dashboard.context(), **(extra_context or {})})

    def get_urls(self):
        return [
            path("dashboard/live/", self.admin_view(self.dashboard_live), name="dashboard_live"),
        ] + super().get_urls()

    def dashboard_live(self, request):
        """Dashboard maʼlumotlari sahifani qayta yuklamasdan (JS har 30 s soʻraydi). admin_view: login + keshsiz."""
        ctx = dashboard.context()
        return JsonResponse({
            "html": render_to_string("admin/includes/dashboard_body.html", ctx, request),
            "chart": ctx["dash"]["chart"],
            "pending": ctx["dash"]["pending_count"] + ctx["dash"]["contact_new"],
        })
