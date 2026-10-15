from django.conf import settings
from django.contrib import admin, messages
from django.shortcuts import get_object_or_404, redirect, render
from django.urls import path, reverse
from django.utils import timezone
from django.utils.html import format_html

from .forms import AcceptLeadForm, RejectLeadForm
from .models import Ad, Brand, Car, CarImage, ContactLead, Feature, Lead, LeadPhoto, SellLead


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
    # allaqachon sotilganlarning sanasi o'zgarmasin
    queryset.exclude(status=Car.Status.SOLD).update(status=Car.Status.SOLD, sold_at=timezone.localdate())


@admin.action(description="Tanlanganlarni «Bron qilingan» qilish")
def make_reserved(modeladmin, request, queryset):
    queryset.update(status=Car.Status.RESERVED, sold_at=None)


@admin.register(Car)
class CarAdmin(admin.ModelAdmin):
    list_display = ("thumb", "title_col", "year", "price", "mileage", "source", "status", "featured", "has_video",
                    "posted_at", "site_link")
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
    readonly_fields = ("video_preview",)
    actions = [make_available, make_reserved, make_sold]
    fieldsets = (
        ("Asosiy", {"fields": ("brand", "model", "trim", "slug", ("year", "reg_year"),
                               ("price", "negotiable"), "mileage", "video_url", "video_preview")}),
        ("Texnik xususiyatlari", {"fields": (("body", "fuel"), ("transmission", "drive"),
                                             ("engine", "power"), ("color", "condition"), "seats")}),
        ("Tavsif", {"fields": ("description_uz", "description_ru", "features")}),
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

    @admin.display(description="Video koʻrinishi")
    def video_preview(self, obj):
        if obj.youtube_embed:
            return format_html('<div class="ib-video" style="max-width:480px"><iframe src="{}" allowfullscreen>'
                               '</iframe></div>', obj.youtube_embed)
        if obj.video_url:
            return format_html('<a href="{0}" target="_blank" rel="noopener">{0} ↗</a>', obj.video_url)
        return "Havola kiritilsa, saytda «Toʻliq video» tugmasi chiqadi"

    @admin.display(description="Video", boolean=True)
    def has_video(self, obj):
        return bool(obj.video_url)

    @admin.display(description="Sayt")
    def site_link(self, obj):
        return format_html('<a class="btn btn-sm btn-outline-secondary" href="{}" target="_blank">'
                           '<i class="fas fa-up-right-from-square"></i></a>', obj.get_absolute_url())


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


STATE_BADGES = {
    Lead.State.NEW: "text-bg-warning", Lead.State.PROGRESS: "text-bg-info", Lead.State.ACCEPTED: "text-bg-success",
    Lead.State.REJECTED: "text-bg-danger", Lead.State.DONE: "text-bg-secondary",
}


class ReviewStateFilter(admin.SimpleListFilter):
    """Standart holatda faqat ko'rib chiqilmagan arizalar; qabul qilingan/rad etilganlar — arxivda."""

    title = "Holati"
    parameter_name = "holat"
    PENDING, ALL = "pending", "all"

    def lookups(self, request, model_admin):
        return [(self.PENDING, "Koʻrib chiqilmagan"), *Lead.State.choices, (self.ALL, "Hammasi (arxiv bilan)")]

    def choices(self, changelist):
        current = self.value() or self.PENDING
        for value, label in self.lookup_choices:
            yield {"selected": current == value, "display": label,
                   "query_string": changelist.get_query_string({self.parameter_name: value})}

    def queryset(self, request, queryset):
        value = self.value() or self.PENDING
        if value == self.PENDING:
            return queryset.filter(state__in=Lead.PENDING_STATES)
        if value == self.ALL:
            return queryset
        return queryset.filter(state=value)


def state_badge(obj):
    return format_html('<span class="badge rounded-pill {}">{}</span>',
                       STATE_BADGES.get(obj.state, "text-bg-secondary"), obj.get_state_display())


@admin.register(SellLead)
class SellLeadAdmin(admin.ModelAdmin):
    """Mashina sotish arizalari: ko'rib chiqish → qabul qilish (saytga chiqadi) yoki rad etish."""

    list_display = ("created_at", "car_col", "name", "phone", "budget", "photo_count", "state_col", "buttons")
    list_filter = (ReviewStateFilter, "created_at")
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

    def save_model(self, request, obj, form, change):
        if "state" in form.changed_data:
            obj.decided_at = None if obj.state in Lead.PENDING_STATES else timezone.now()
        super().save_model(request, obj, form, change)

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
        if obj.state not in Lead.PENDING_STATES:
            if obj.car_id:
                return format_html('<a class="btn btn-sm btn-outline-secondary" href="{}" target="_blank">'
                                   '<i class="fas fa-up-right-from-square"></i> Saytda</a>', obj.car.get_absolute_url())
            return "—"
        return format_html(
            '<span class="text-nowrap"><a class="btn btn-sm btn-success" href="{}"><i class="fas fa-check"></i> Qabul</a> '
            '<a class="btn btn-sm btn-outline-danger" href="{}"><i class="fas fa-xmark"></i> Rad</a></span>',
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
        if lead.state not in Lead.PENDING_STATES:
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
        if lead.state not in Lead.PENDING_STATES:
            messages.warning(request, "Bu ariza allaqachon koʻrib chiqilgan.")
            return redirect("admin:main_selllead_changelist")
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


def _set_state(queryset, state):
    closed = state not in Lead.PENDING_STATES
    return queryset.update(state=state, decided_at=timezone.now() if closed else None)


@admin.action(description="✓ Yakunlangan deb belgilash (roʻyxatdan ketadi)")
def mark_done(modeladmin, request, queryset):
    n = _set_state(queryset, Lead.State.DONE)
    messages.success(request, f"{n} ta murojaat yakunlandi va arxivga oʻtdi.")


@admin.action(description="Jarayonda deb belgilash")
def mark_progress(modeladmin, request, queryset):
    _set_state(queryset, Lead.State.PROGRESS)


@admin.action(description="✗ Rad etish (roʻyxatdan ketadi)")
def mark_rejected(modeladmin, request, queryset):
    n = _set_state(queryset, Lead.State.REJECTED)
    messages.info(request, f"{n} ta murojaat rad etildi va arxivga oʻtdi.")


@admin.register(ContactLead)
class ContactLeadAdmin(admin.ModelAdmin):
    """Aloqa sahifasidan kelgan murojaatlar. Yakunlangan/rad etilganlar standart roʻyxatda koʻrinmaydi."""

    list_display = ("created_at", "kind", "name", "phone", "summary", "car", "state")
    list_filter = (ReviewStateFilter, "kind", "created_at")
    list_editable = ("state",)
    list_select_related = ("car__brand",)
    search_fields = ("name", "phone", "message")
    date_hierarchy = "created_at"
    actions = [mark_done, mark_progress, mark_rejected]
    readonly_fields = ("created_at", "decided_at")
    fields = ("kind", "state", "name", "phone", "budget", "message", "car", "created_at", "decided_at")

    @admin.display(description="Xabar")
    def summary(self, obj):
        return (obj.message or "")[:80]

    def save_model(self, request, obj, form, change):
        if "state" in form.changed_data:
            obj.decided_at = None if obj.state in Lead.PENDING_STATES else timezone.now()
        super().save_model(request, obj, form, change)


@admin.register(Ad)
class AdAdmin(admin.ModelAdmin):
    list_display = ("preview", "title", "advertiser", "is_active", "period", "price", "views", "clicks", "ctr_col",
                    "skips", "order")
    list_display_links = ("preview", "title")
    list_editable = ("is_active", "order")
    list_filter = ("is_active", "starts_on")
    search_fields = ("title", "advertiser", "link")
    readonly_fields = ("player", "views", "clicks", "skips", "ctr_col", "created_at")
    fieldsets = (
        ("Reklama", {"fields": ("title", "advertiser", "video", "image", "player", "link"),
                     "description": "Video <b>yoki</b> rasm yuklang (ikkalasi emas)."}),
        ("Koʻrsatish", {"fields": ("is_active", ("starts_on", "ends_on"), "order", "price")}),
        ("Statistika", {"fields": (("views", "clicks", "ctr_col", "skips"), "created_at")}),
    )

    @admin.display(description="Media")
    def preview(self, obj):
        if obj.image:
            return format_html('<img src="{}" style="height:54px;width:96px;object-fit:cover;border-radius:6px">',
                               obj.image.url)
        if not obj.video:
            return "—"
        return format_html('<video src="{}" muted playsinline preload="metadata" '
                           'style="height:54px;width:96px;object-fit:cover;border-radius:6px;background:#000"></video>',
                           obj.video.url)

    @admin.display(description="Koʻrinish")
    def player(self, obj):
        if obj.pk and obj.image:
            return format_html('<img src="{}" style="max-height:320px;max-width:100%;border-radius:8px">',
                               obj.image.url)
        if not obj.pk or not obj.video:
            return "Saqlangandan keyin shu yerda koʻrinadi"
        return format_html('<video src="{}" controls muted playsinline style="max-height:320px;max-width:100%;'
                           'border-radius:8px;background:#000"></video>', obj.video.url)

    @admin.display(description="Muddat")
    def period(self, obj):
        end = obj.ends_on.strftime("%d.%m.%Y") if obj.ends_on else "muddatsiz"
        return f"{obj.starts_on:%d.%m.%Y} — {end}"

    @admin.display(description="CTR")
    def ctr_col(self, obj):
        return f"{obj.ctr}%"
