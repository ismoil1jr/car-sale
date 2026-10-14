from django.conf import settings

from .models import Ad, Car
from .views import category_links


def site(request):
    match = getattr(request, "resolver_match", None)
    return {
        "SITE": settings.SITE,
        "ADS": [{"id": a.id, "title": a.title, "video": a.video.url, "link": a.link}
                for a in Ad.objects.running() if a.video],
        "FOOTER_CATEGORIES": category_links(Car.objects.exclude(status=Car.Status.SOLD)),
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
