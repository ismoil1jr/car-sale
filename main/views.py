from django.contrib import messages
from django.db.models import Count, Max, Min, Q
from django.http import Http404, HttpResponse, JsonResponse
from django.template.loader import render_to_string
from django.shortcuts import get_object_or_404, redirect, render
from django.utils import timezone
from django.db.models import F
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET, require_POST

from .forms import ContactForm, SellForm
from .models import Ad, Brand, Car, Lead, LeadPhoto

MAX_PHOTOS = 15
MAX_PHOTO_SIZE = 8 * 1024 * 1024


def cars_qs():
    return Car.objects.select_related("brand").prefetch_related("images")


def for_sale():
    return cars_qs().exclude(status=Car.Status.SOLD)


def brand_counts(qs):
    """[(Brand nomi, soni)] — soni bo'yicha kamayish tartibida."""
    rows = qs.values("brand__name").annotate(n=Count("id")).order_by("-n", "brand__name")
    return [{"name": r["brand__name"], "count": r["n"]} for r in rows]


def present_choices(qs, field, choices):
    used = set(qs.values_list(field, flat=True))
    return [(value, label) for value, label in choices if value in used]


# --------------------------------------------------------------------------- #
# Kategoriyalar (Avtoelon/OLX kabi: kuzov turi va yoqilg'i bo'yicha)
# --------------------------------------------------------------------------- #
CATEGORIES = [
    # (kalit, GET parametri, qiymati, uz nomi, i18n kaliti, ikon (core.js ICONS), doim ko'rsatilsinmi)
    ("suv", "body", "suv", "SUV / Yoʻltanlamas", "body.suv", "carSuv", False),
    ("sedan", "body", "sedan", "Sedan", "body.sedan", "carSedan", False),
    ("pickup", "body", "pickup", "Pikap", "body.pickup", "carPickup", False),
    ("liftback", "body", "liftback", "Liftbek", "body.liftback", "carLiftback", False),
    ("hatchback", "body", "hatchback", "Hetchbek", "body.hatchback", "carHatch", False),
    ("minivan", "body", "minivan", "Miniven", "body.minivan", "carVan", False),
    ("coupe", "body", "coupe", "Kupe", "body.coupe", "carCoupe", False),
    ("electric", "fuel", "electric", "Elektromobillar", "brand.electric", "bolt", True),
    ("hybrid", "fuel", "hybrid", "Gibridlar", "cat.hybrid", "leaf", False),
]


def category_links(sale_qs, f=None):
    """Kategoriya "pill"lari: soni, havolasi va faolligi bilan."""
    body_counts = dict(sale_qs.values_list("body").annotate(n=Count("id")))
    fuel_counts = dict(sale_qs.values_list("fuel").annotate(n=Count("id")))
    active_body = f["body"] if f else []
    active_fuel = f["fuel"] if f else []
    only_one = f is not None and len(active_body) + len(active_fuel) == 1
    items = []
    for key, param, value, label, i18n, icon, always in CATEGORIES:
        count = (body_counts if param == "body" else fuel_counts).get(value, 0)
        if not count and not always:
            continue
        active = only_one and value in (active_body if param == "body" else active_fuel)
        items.append({"key": key, "url": f"/catalog/?{param}={value}", "label": label, "i18n": i18n,
                      "icon": icon, "count": count, "active": active})
    return items


# --------------------------------------------------------------------------- #
# Bosh sahifa
# --------------------------------------------------------------------------- #
def home(request):
    sale = for_sale()
    sold = cars_qs().filter(status=Car.Status.SOLD).order_by("-sold_at", "-id")
    featured = (
        sale.filter(status=Car.Status.AVAILABLE).order_by("-featured", "-posted_at", "-id")[:6]
    )
    return render(request, "index.html", {
        "featured": featured,
        "sold_cars": sold[:12],
        "brands": brand_counts(sale),
        "categories": category_links(sale),
        "body_options": present_choices(sale, "body", Car.Body.choices),
        "price_options": [40000, 60000, 80000, 100000, 150000, 200000],
        "stat_sale": sale.count(),
        "stat_sold": sold.count(),
        "reels": cars_qs()[:6],
    })


# --------------------------------------------------------------------------- #
# Katalog (server tomonda filtrlash va saralash)
# --------------------------------------------------------------------------- #
SORTS = {
    "new": ("-posted_at", "-id"),
    "priceAsc": ("price", "-posted_at"),
    "priceDesc": ("-price", "-posted_at"),
    "yearDesc": ("-year", "mileage"),
    "kmAsc": ("mileage", "-posted_at"),
}
SORT_LABELS = [
    ("new", "Avval yangilari"), ("priceAsc", "Avval arzonlari"), ("priceDesc", "Avval qimmatlari"),
    ("yearDesc", "Yili boʻyicha (yangi)"), ("kmAsc", "Probegi kam"),
]


def _int(value):
    try:
        return int(value)
    except (TypeError, ValueError):
        return None


def parse_filters(params):
    f = {
        "q": params.get("q", "").strip(),
        "brand": [b for b in params.getlist("brand") if b],
        "body": [b for b in params.getlist("body") if b],
        "fuel": [b for b in params.getlist("fuel") if b],
        "priceMin": _int(params.get("priceMin")),
        "priceMax": _int(params.get("priceMax")),
        "yearMin": _int(params.get("yearMin")),
        "yearMax": _int(params.get("yearMax")),
        "kmMax": _int(params.get("kmMax")),
        "clean": params.get("clean") == "1",
        "sold": params.get("sold") == "1",
        "sort": params.get("sort") if params.get("sort") in SORTS else "new",
    }
    return f


def apply_filters(qs, f, skip_brand=False):
    if not f["sold"]:
        qs = qs.exclude(status=Car.Status.SOLD)
    for word in f["q"].split():
        cond = (Q(brand__name__icontains=word) | Q(model__icontains=word) |
                Q(trim__icontains=word) | Q(engine__icontains=word))
        if word.isdigit():
            cond |= Q(year=int(word))
        qs = qs.filter(cond)
    if f["brand"] and not skip_brand:
        qs = qs.filter(brand__name__in=f["brand"])
    if f["body"]:
        qs = qs.filter(body__in=f["body"])
    if f["fuel"]:
        qs = qs.filter(fuel__in=f["fuel"])
    if f["priceMin"] is not None:
        qs = qs.filter(price__gte=f["priceMin"])
    if f["priceMax"] is not None:
        qs = qs.filter(price__lte=f["priceMax"])
    if f["yearMin"] is not None:
        qs = qs.filter(year__gte=f["yearMin"])
    if f["yearMax"] is not None:
        qs = qs.filter(year__lte=f["yearMax"])
    if f["kmMax"] is not None:
        qs = qs.filter(mileage__lte=f["kmMax"])
    if f["clean"]:
        qs = qs.filter(condition=Car.Condition.CLEAN)
    return qs


def active_filter_chips(request, f):
    """Faol filtrlar + har birini olib tashlaydigan havola."""
    chips = []

    def without(key, value=None):
        params = request.GET.copy()
        if value is None:
            params.pop(key, None)
        else:
            vals = [v for v in params.getlist(key) if v != value]
            params.setlist(key, vals)
        qs = params.urlencode()
        return request.path + (f"?{qs}" if qs else "")

    labels = {"body": dict(Car.Body.choices), "fuel": dict(Car.Fuel.choices)}
    for b in f["brand"]:
        chips.append({"label": b, "url": without("brand", b)})
    for key in ("body", "fuel"):
        for v in f[key]:
            chips.append({"label": labels[key].get(v, v), "i18n": f"{key}.{v}", "url": without(key, v)})
    if f["q"]:
        chips.append({"label": f"“{f['q']}”", "url": without("q")})
    def money(n):
        return f"${n:,}".replace(",", " ")

    if f["priceMin"] is not None:
        chips.append({"label": f"{money(f['priceMin'])} dan", "i18n": "chip.priceMin",
                      "vars": {"v": money(f["priceMin"])}, "url": without("priceMin")})
    if f["priceMax"] is not None:
        chips.append({"label": f"{money(f['priceMax'])} gacha", "i18n": "filter.upTo",
                      "vars": {"price": money(f["priceMax"])}, "url": without("priceMax")})
    if f["yearMin"] is not None:
        chips.append({"label": f"{f['yearMin']} yildan", "i18n": "chip.yearMin",
                      "vars": {"v": f["yearMin"]}, "url": without("yearMin")})
    if f["yearMax"] is not None:
        chips.append({"label": f"{f['yearMax']} yilgacha", "i18n": "chip.yearMax",
                      "vars": {"v": f["yearMax"]}, "url": without("yearMax")})
    if f["kmMax"] is not None:
        km = f"{f['kmMax']:,} km".replace(",", " ")
        chips.append({"label": f"{km} gacha", "i18n": "filter.kmUpTo", "vars": {"km": km}, "url": without("kmMax")})
    if f["clean"]:
        chips.append({"label": "Faqat tozza (kraskasiz)", "i18n": "filter.clean", "url": without("clean")})
    if f["sold"]:
        chips.append({"label": "Sotilganlarni ham koʻrsatish", "i18n": "filter.showSold", "url": without("sold")})
    return chips


def catalog(request):
    f = parse_filters(request.GET)
    everything = cars_qs()
    pool = apply_filters(everything, f, skip_brand=True)
    cars = apply_filters(everything, f).order_by(*SORTS[f["sort"]])
    # Sotilganlar (agar ko'rsatilsa) ro'yxat oxirida
    cars = sorted(cars, key=lambda c: c.is_sold)

    year_range = everything.aggregate(lo=Min("year"), hi=Max("year"))
    years = list(range(year_range["hi"], year_range["lo"] - 1, -1)) if year_range["hi"] else []
    brand_totals = {b["name"]: b["count"] for b in brand_counts(pool)}
    brands = [{"name": name, "count": brand_totals.get(name, 0)}
              for name in Brand.objects.filter(cars__isnull=False).distinct().values_list("name", flat=True)]

    return render(request, "catalog.html", {
        "cars": cars,
        "count": len(cars),
        "f": f,
        "brands": brands,
        "body_options": present_choices(everything, "body", Car.Body.choices),
        "fuel_options": present_choices(everything, "fuel", Car.Fuel.choices),
        "years": years,
        "km_options": [10000, 30000, 50000, 100000],
        "sorts": SORT_LABELS,
        "chips": active_filter_chips(request, f),
        "has_filters": bool(request.GET.keys() - {"sort"}),
        "categories": category_links(everything.exclude(status=Car.Status.SOLD), f),
        "total_for_sale": everything.exclude(status=Car.Status.SOLD).count(),
    })


# --------------------------------------------------------------------------- #
# Mashina sahifasi
# --------------------------------------------------------------------------- #
def car_by_slug(request, slug):
    """Eski /car/<slug>/ havolalarini yangi /car/<id>/<slug>/ manziliga yo'naltiradi."""
    car = get_object_or_404(Car, slug=slug)
    return redirect(car, permanent=True)


def car_detail(request, pk, slug=None):
    car = get_object_or_404(cars_qs().prefetch_related("features"), pk=pk)
    if slug != car.slug:
        return redirect(car, permanent=True)

    def score(c):
        s = 0
        if c.body == car.body:
            s += 2
        if c.brand_id == car.brand_id:
            s += 2
        return s + max(0.0, 3 - abs(c.price - car.price) / (car.price * 0.2))

    similar = sorted(for_sale().exclude(pk=car.pk), key=score, reverse=True)[:3]
    images = list(car.images.all())
    return render(request, "car.html", {
        "car": car,
        "images": images,
        "similar": similar,
        "features": list(car.features.all()),
        "sold": car.is_sold,
        "desc_first_line": (car.description_uz.split("\n")[0] if car.description_uz else ""),
    })


# --------------------------------------------------------------------------- #
# Sotilgan mashinalar
# --------------------------------------------------------------------------- #
def sold(request):
    base = cars_qs().filter(status=Car.Status.SOLD).order_by("-sold_at", "-id")
    active = request.GET.get("brand", "")
    cars = base.filter(brand__name=active) if active else base
    return render(request, "sold.html", {
        "cars": cars,
        "total": base.count(),
        "brands": brand_counts(base),
        "active": active,
    })


# --------------------------------------------------------------------------- #
# Saqlanganlar (ID'lar brauzerda; kartochkalarni server chizadi)
# --------------------------------------------------------------------------- #
def favorites(request):
    return render(request, "favorites.html")


@require_GET
def favorites_cards(request):
    """Brauzerdagi saqlangan ID'lar bo'yicha kartochkalar va taqqoslash jadvali (JSON ichida HTML)."""
    slugs = [s for s in request.GET.get("ids", "").split(",") if s][:50]
    found = {c.slug: c for c in cars_qs().filter(slug__in=slugs)}
    cars = [found[s] for s in slugs if s in found]
    compare = cars[:4]

    def best(values, pick):
        values = [v for v in values if v]
        # hamma qiymat bir xil bo'lsa — "eng yaxshi" belgilanmaydi
        return pick(values) if len(set(values)) > 1 else None

    best_values = {
        "price": best([c.price for c in compare], min),
        "year": best([c.year for c in compare], max),
        "mileage": best([c.mileage for c in compare], min),
        "power": best([c.power for c in compare], max),
    }
    return JsonResponse({
        "ids": [c.slug for c in cars],
        "cards": render_to_string("partials/favorites_cards.html", {"cars": cars}, request),
        "compare": render_to_string("partials/compare_table.html", {"compare": compare, "best": best_values}, request)
        if len(compare) > 1 else "",
    })


# --------------------------------------------------------------------------- #
# Formalar: aloqa va sotish arizasi
# --------------------------------------------------------------------------- #
def _save_photos(request, lead):
    files = [f for f in request.FILES.getlist("photos") if f.content_type.startswith("image/")]
    for f in files[:MAX_PHOTOS]:
        if f.size <= MAX_PHOTO_SIZE:
            LeadPhoto.objects.create(lead=lead, image=f)


def contact(request):
    initial = {"kind": request.GET.get("type", Lead.Kind.BUY)}
    prefill_car = Car.objects.select_related("brand").filter(slug=request.GET.get("car", "")).first()
    if request.method == "POST":
        form = ContactForm(request.POST)
        if form.is_valid():
            lead = form.save(commit=False)
            lead.car = Car.objects.filter(slug=request.POST.get("car", "")).first()
            lead.save()
            messages.success(request, "sent")
            return redirect("contact")
    else:
        form = ContactForm(initial=initial)
    return render(request, "contact.html", {
        "form": form,
        "kinds": [c for c in Lead.Kind.choices if c[0] != Lead.Kind.SELL],
        "prefill_car": prefill_car,
        "selected_kind": form["kind"].value() or Lead.Kind.BUY,
    })


def sell(request):
    if request.method == "POST":
        form = SellForm(request.POST)
        if form.is_valid():
            lead = form.save()
            _save_photos(request, lead)
            messages.success(request, "sent")
            return redirect("sell")
    else:
        form = SellForm(initial={"paint": "clean"})
    this_year = timezone.localdate().year
    common = ["Audi", "BMW", "BYD", "Cadillac", "Chevrolet", "Chery", "Haval", "Hyundai", "Kia", "Land Rover",
              "Lexus", "Li Auto", "Mercedes-Benz", "Nissan", "Porsche", "Toyota", "Volkswagen", "Zeekr"]
    names = sorted(set(common) | set(Brand.objects.values_list("name", flat=True)))
    return render(request, "sell.html", {
        "form": form,
        "years": range(this_year, 1994, -1),
        "brand_names": names,
        "colors": Car.Color.choices,
        "selected_paint": form["paint"].value() or "clean",
    })


# --------------------------------------------------------------------------- #
def about(request):
    return render(request, "about.html", {
        "stat_sold": Car.objects.filter(status=Car.Status.SOLD).count(),
    })


AD_EVENTS = {"view": "views", "click": "clicks", "skip": "skips"}


@csrf_exempt  # navigator.sendBeacon CSRF token yubora olmaydi; faqat hisoblagich oshiriladi
@require_POST
def ad_event(request, pk, event):
    field = AD_EVENTS.get(event)
    if not field:
        raise Http404
    Ad.objects.filter(pk=pk).update(**{field: F(field) + 1})
    return HttpResponse(status=204)


def not_found(request, exception=None):
    return render(request, "404.html", status=404)
