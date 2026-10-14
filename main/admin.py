from django.conf import settings
from django.contrib import admin, messages
from django.shortcuts import get_object_or_404, redirect, render
from django.urls import path, reverse
from django.utils import timezone
from django.utils.html import format_html

from .forms import AcceptLeadForm, RejectLeadForm
from .models import Brand, Car, CarImage, ContactLead, Feature, Lead, LeadPhoto, SellLead


@admin.register(Brand)
class BrandAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "car_count")
    search_fields = ("name",)
    prepopulated_fields = {"slug": ("name",)}

    @admin.display(description="Mashinalar")
    def car_count(self, obj):
        return obj.cars.count()


@admin.register(Feature)
class FeatureAdmin(admin.ModelAdmin):
    list_display = ("name_uz", "name_ru", "key")
    search_fields = ("name_uz", "name_ru", "key")


class CarImageInline(admin.TabularInline):
    model = CarImage
    extra = 1
    fields = ("preview", "image", "thumbnail", "order", "credit_author", "credit_license", "credit_source")
    readonly_fields = ("preview",)

    @admin.display(description="Koʻrinish")
    def preview(self, obj):
        if obj.pk and obj.image:
            return format_html('<img src="{}" style="height:56px;border-radius:6px">', obj.thumb_url)
        return "—"


@admin.action(description="Tanlanganlarni «Sotuvda» qilish")
def make_available(modeladmin, request, queryset):
    queryset.update(status=Car.Status.AVAILABLE, sold_at=None)


@admin.action(description="Tanlanganlarni «Baraka boʻldi» (sotilgan) qilish")
def make_sold(modeladmin, request, queryset):
    queryset.update(status=Car.Status.SOLD, sold_at=timezone.localdate())


@admin.action(description="Tanlanganlarni «Bron qilingan» qilish")
def make_reserved(modeladmin, request, queryset):
    queryset.update(status=Car.Status.RESERVED)


@admin.register(Car)
class CarAdmin(admin.ModelAdmin):
    list_display = ("thumb", "title_col", "year", "price", "mileage", "source", "status", "featured", "posted_at",
                    "site_link")
    list_display_links = ("thumb", "title_col")
    list_editable = ("status", "featured")
    list_filter = ("status", "source", "featured", "brand", "body", "fuel", "condition", "year")
    search_fields = ("brand__name", "model", "trim", "slug", "engine")
    date_hierarchy = "posted_at"
    list_select_related = ("brand",)
    prepopulated_fields = {"slug": ("model", "trim", "year")}
    filter_horizontal = ("features",)
    autocomplete_fields = ("brand",)
    inlines = [CarImageInline]
    actions = [make_available, make_reserved, make_sold]
    fieldsets = (
        ("Asosiy", {"fields": ("brand", "model", "trim", "slug", ("year", "reg_year"),
                               ("price", "negotiable"), "mileage")}),
        ("Texnik xususiyatlari", {"fields": (("body", "fuel"), ("transmission", "drive"),
                                             ("engine", "power"), ("color", "condition"), "seats")}),
        ("Tavsif", {"fields": ("description_uz", "description_ru", "features", "video_url")}),
        ("Eʼlon holati", {"fields": ("status", "featured", ("posted_at", "sold_at"))}),
        ("Reklama", {"fields": (("source", "ad_fee"),)}),
    )

    def get_queryset(self, request):
        return super().get_queryset(request).prefetch_related("images")

    @admin.display(description="Rasm")
    def thumb(self, obj):
        cover = obj.cover
        if cover:
            return format_html('<img src="{}" style="height:44px;width:66px;object-fit:cover;border-radius:6px">',
                               cover.thumb_url)
        return "—"

    @admin.display(description="Avtomobil", ordering="model")
    def title_col(self, obj):
        return obj.title

    @admin.display(description="Sayt")
    def site_link(self, obj):
        return format_html('<a href="{}" target="_blank">Koʻrish ↗</a>', obj.get_absolute_url())


class LeadPhotoInline(admin.TabularInline):
    model = LeadPhoto
    extra = 0
    readonly_fields = ("preview",)
    fields = ("preview", "image")

    @admin.display(description="Koʻrinish")
    def preview(self, obj):
        if obj.pk and obj.image:
            return format_html('<a href="{0}" target="_blank"><img src="{0}" style="height:64px"></a>', obj.image.url)
        return "—"


STATE_COLORS = {
    Lead.State.NEW: "#d4a017", Lead.State.PROGRESS: "#3b82f6", Lead.State.ACCEPTED: "#16a34a",
    Lead.State.REJECTED: "#dc2626", Lead.State.DONE: "#6b7280",
}


def state_badge(obj):
    return format_html('<span class="ib-badge" style="--c:{}">{}</span>',
                       STATE_COLORS.get(obj.state, "#6b7280"), obj.get_state_display())


@admin.register(SellLead)
class SellLeadAdmin(admin.ModelAdmin):
    """Mashina sotish arizalari: ko'rib chiqish → qabul qilish (saytga chiqadi) yoki rad etish."""

    list_display = ("created_at", "car_col", "name", "phone", "budget", "photo_count", "state_col", "buttons")
    list_filter = ("state", "created_at")
    search_fields = ("name", "phone", "brand", "model", "message")
    date_hierarchy = "created_at"
    readonly_fields = ("created_at", "decided_at", "car_link", "buttons")
    inlines = [LeadPhotoInline]
    fieldsets = (
        ("Mashina", {"fields": ("brand", "model", "year", "mileage", "budget", "color", "paint", "message")}),
        ("Mijoz", {"fields": ("name", "phone")}),
        ("Holat", {"fields": ("state", "buttons", "car_link", "reject_reason", "created_at", "decided_at")}),
    )

    def get_queryset(self, request):
        return super().get_queryset(request).prefetch_related("photos").select_related("car")

    def get_urls(self):
        return [
            path("<int:pk>/accept/", self.admin_site.admin_view(self.accept_view), name="main_selllead_accept"),
            path("<int:pk>/reject/", self.admin_site.admin_view(self.reject_view), name="main_selllead_reject"),
        ] + super().get_urls()

    # --- ustunlar ---
    @admin.display(description="Mashina")
    def car_col(self, obj):
        return " ".join(str(x) for x in (obj.brand, obj.model, obj.year) if x) or "—"

    @admin.display(description="Rasmlar")
    def photo_count(self, obj):
        return len(obj.photos.all())

    @admin.display(description="Holati", ordering="state")
    def state_col(self, obj):
        return state_badge(obj)

    @admin.display(description="Amallar")
    def buttons(self, obj):
        if obj.state in (Lead.State.ACCEPTED, Lead.State.REJECTED):
            if obj.car_id:
                return format_html('<a class="ib-btn" href="{}" target="_blank">Saytda koʻrish ↗</a>',
                                   obj.car.get_absolute_url())
            return "—"
        return format_html(
            '<a class="ib-btn ib-btn--ok" href="{}">✓ Qabul qilish</a> '
            '<a class="ib-btn ib-btn--no" href="{}">✕ Rad etish</a>',
            reverse("admin:main_selllead_accept", args=[obj.pk]),
            reverse("admin:main_selllead_reject", args=[obj.pk]),
        )

    @admin.display(description="Yaratilgan eʼlon")
    def car_link(self, obj):
        if not obj.car_id:
            return "—"
        return format_html('<a href="{}">{}</a> · <a href="{}" target="_blank">saytda ↗</a>',
                           reverse("admin:main_car_change", args=[obj.car_id]), obj.car,
                           obj.car.get_absolute_url())

    # --- qabul qilish / rad etish ---
    def accept_view(self, request, pk):
        lead = get_object_or_404(SellLead, pk=pk)
        if lead.state in (Lead.State.ACCEPTED, Lead.State.REJECTED):
            messages.warning(request, "Bu ariza allaqachon koʻrib chiqilgan.")
            return redirect("admin:main_selllead_changelist")
        if request.method == "POST":
            form = AcceptLeadForm(request.POST)
            if form.is_valid():
                car = form.save_for(lead)
                lead.state, lead.car, lead.decided_at = Lead.State.ACCEPTED, car, timezone.now()
                lead.save(update_fields=["state", "car", "decided_at"])
                messages.success(request, format_html(
                    "Ariza qabul qilindi — «{}» saytga chiqdi. <a href='{}' target='_blank'>Koʻrish ↗</a>",
                    car, car.get_absolute_url()))
                return redirect("admin:main_selllead_changelist")
        else:
            form = AcceptLeadForm(initial=AcceptLeadForm.initial_from(lead, settings.SITE["ad_fee_default"]))
        return render(request, "admin/main/lead_accept.html", {
            **self.admin_site.each_context(request), "lead": lead, "form": form,
            "opts": self.model._meta, "title": "Arizani qabul qilish",
        })

    def reject_view(self, request, pk):
        lead = get_object_or_404(SellLead, pk=pk)
        if request.method == "POST":
            form = RejectLeadForm(request.POST)
            if form.is_valid():
                lead.state, lead.decided_at = Lead.State.REJECTED, timezone.now()
                lead.reject_reason = form.cleaned_data["reason"]
                lead.save(update_fields=["state", "decided_at", "reject_reason"])
                messages.info(request, f"Ariza rad etildi: {lead}")
                return redirect("admin:main_selllead_changelist")
        else:
            form = RejectLeadForm()
        return render(request, "admin/main/lead_reject.html", {
            **self.admin_site.each_context(request), "lead": lead, "form": form,
            "opts": self.model._meta, "title": "Arizani rad etish",
        })


@admin.register(ContactLead)
class ContactLeadAdmin(admin.ModelAdmin):
    list_display = ("created_at", "kind", "name", "phone", "summary", "car", "state")
    list_filter = ("state", "kind", "created_at")
    list_editable = ("state",)
    search_fields = ("name", "phone", "message")
    date_hierarchy = "created_at"
    readonly_fields = ("created_at",)
    fields = ("kind", "state", "name", "phone", "budget", "message", "car", "created_at")

    @admin.display(description="Xabar")
    def summary(self, obj):
        return (obj.message or "")[:80]
