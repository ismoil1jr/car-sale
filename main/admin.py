from django.contrib import admin
from django.utils.html import format_html

from .models import Brand, Car, CarImage, Feature, Lead, LeadPhoto

admin.site.site_header = "Inomarka Bor — boshqaruv paneli"
admin.site.site_title = "Inomarka Bor"
admin.site.index_title = "Avtomobillar va arizalar"


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
    from django.utils import timezone
    queryset.update(status=Car.Status.SOLD, sold_at=timezone.localdate())


@admin.action(description="Tanlanganlarni «Bron qilingan» qilish")
def make_reserved(modeladmin, request, queryset):
    queryset.update(status=Car.Status.RESERVED)


@admin.register(Car)
class CarAdmin(admin.ModelAdmin):
    list_display = ("thumb", "title_col", "year", "price", "mileage", "status", "featured", "posted_at")
    list_display_links = ("thumb", "title_col")
    list_editable = ("status", "featured")
    list_filter = ("status", "featured", "brand", "body", "fuel", "condition", "year")
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


@admin.register(Lead)
class LeadAdmin(admin.ModelAdmin):
    list_display = ("created_at", "kind", "name", "phone", "summary", "state")
    list_filter = ("state", "kind", "created_at")
    list_editable = ("state",)
    search_fields = ("name", "phone", "message", "brand", "model")
    date_hierarchy = "created_at"
    readonly_fields = ("created_at",)
    inlines = [LeadPhotoInline]

    @admin.display(description="Qisqacha")
    def summary(self, obj):
        if obj.kind == Lead.Kind.SELL:
            return " ".join(str(x) for x in (obj.brand, obj.model, obj.year) if x)
        return (obj.message or "")[:70]
