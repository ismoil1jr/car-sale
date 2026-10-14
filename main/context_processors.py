from django.conf import settings
from django.db.models import Count

from .models import Car


def site(request):
    brands = (
        Car.objects.exclude(status=Car.Status.SOLD)
        .values("brand__name").annotate(n=Count("id")).order_by("-n", "brand__name")[:6]
    )
    match = getattr(request, "resolver_match", None)
    return {
        "SITE": settings.SITE,
        "FOOTER_BRANDS": [b["brand__name"] for b in brands],
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
