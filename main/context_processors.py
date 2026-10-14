from django.conf import settings
from django.db.models import Count

from .models import Car


def site(request):
    for_sale = Car.objects.exclude(status=Car.Status.SOLD)
    brands = for_sale.values("brand__name").annotate(n=Count("id")).order_by("-n", "brand__name")
    match = getattr(request, "resolver_match", None)
    return {
        "SITE": settings.SITE,
        "FOOTER_BRANDS": [b["brand__name"] for b in brands],
        "ELECTRIC_COUNT": for_sale.filter(fuel=Car.Fuel.ELECTRIC).count(),
        "current_page": match.url_name if match else "",
        "NAV": [
            ("home", "/", "nav.home", "Bosh sahifa"),
            ("catalog", "/catalog/", "nav.catalog", "Avtomobillar"),
            ("sold", "/sold/", "nav.sold", "Baraka boʻldi"),
            ("sell", "/sell/", "nav.sell", "Mashinangizni soting"),
            ("about", "/about/", "nav.about", "Biz haqimizda"),
            ("contact", "/contact/", "nav.contact", "Aloqa"),
        ],
    }
