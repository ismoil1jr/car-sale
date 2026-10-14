"""Admin dashboard statistikasi: oylik baraka (sotuvlar), reklama tushumi, arizalar."""
from datetime import date

from django.db.models import Count, Sum
from django.db.models.functions import TruncMonth
from django.utils import timezone

from .models import Car, Lead

UZ_MONTHS = ["Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun",
             "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr"]
UZ_MONTHS_SHORT = ["Yan", "Fev", "Mar", "Apr", "May", "Iyn", "Iyl", "Avg", "Sen", "Okt", "Noy", "Dek"]


def add_months(d, n):
    m = d.month - 1 + n
    return date(d.year + m // 12, m % 12 + 1, 1)


def period(start, end):
    """[start, end) oralig'idagi ko'rsatkichlar."""
    sold = Car.objects.filter(status=Car.Status.SOLD, sold_at__gte=start, sold_at__lt=end)
    ads = Car.objects.filter(source=Car.Source.CLIENT, posted_at__gte=start, posted_at__lt=end)
    leads = Lead.objects.filter(created_at__date__gte=start, created_at__date__lt=end)
    s = sold.aggregate(n=Count("id"), total=Sum("price"))
    a = ads.aggregate(n=Count("id"), total=Sum("ad_fee"))
    return {
        "sold": s["n"],
        "sold_sum": s["total"] or 0,
        "ads": a["n"],
        "ad_income": a["total"] or 0,
        "leads": leads.count(),
        "sell_leads": leads.filter(kind=Lead.Kind.SELL).count(),
        "accepted": leads.filter(state=Lead.State.ACCEPTED).count(),
        "rejected": leads.filter(state=Lead.State.REJECTED).count(),
    }


def change(current, previous):
    """O'zgarish: foiz va yo'nalish (o'sish / pasayish / teng)."""
    if previous == 0:
        return {"pct": None, "dir": "up" if current > 0 else "flat"}
    pct = round((current - previous) * 100 / previous)
    return {"pct": abs(pct), "dir": "up" if pct > 0 else "down" if pct < 0 else "flat"}


KPIS = [
    ("sold", "Baraka boʻldi", "ta mashina sotildi"),
    ("sold_sum", "Sotuvlar summasi", "$"),
    ("ads", "Reklama eʼlonlari", "ta mijoz mashinasi"),
    ("ad_income", "Reklama tushumi", "soʻm"),
    ("leads", "Kelgan arizalar", "ta ariza"),
]


def monthly_series(months=12):
    today = timezone.localdate()
    first = add_months(today.replace(day=1), -(months - 1))
    sold = dict(
        Car.objects.filter(status=Car.Status.SOLD, sold_at__gte=first)
        .annotate(m=TruncMonth("sold_at")).values("m").annotate(n=Count("id")).values_list("m", "n")
    )
    ads = dict(
        Car.objects.filter(source=Car.Source.CLIENT, posted_at__gte=first)
        .annotate(m=TruncMonth("posted_at")).values("m").annotate(s=Sum("ad_fee")).values_list("m", "s")
    )
    rows = []
    for i in range(months):
        m = add_months(first, i)
        rows.append({"month": m, "label": f"{UZ_MONTHS_SHORT[m.month - 1]}",
                     "title": f"{UZ_MONTHS[m.month - 1]} {m.year}",
                     "sold": sold.get(m, 0), "ad_income": ads.get(m, 0) or 0,
                     "current": i == months - 1})
    for key in ("sold", "ad_income"):
        top = max((r[key] for r in rows), default=0) or 1
        for r in rows:
            r[f"{key}_h"] = round(r[key] * 100 / top, 1)
    return rows


def context():
    today = timezone.localdate()
    this_m = today.replace(day=1)
    next_m = add_months(this_m, 1)
    prev_m = add_months(this_m, -1)
    ly_m = date(this_m.year - 1, this_m.month, 1)
    ly_next = add_months(ly_m, 1)

    cur, prev, ly = period(this_m, next_m), period(prev_m, this_m), period(ly_m, ly_next)
    year_cur = period(date(today.year, 1, 1), next_m)
    year_prev = period(date(today.year - 1, 1, 1), date(today.year - 1, next_m.month, 1)
                       if next_m.year == today.year else date(today.year, 1, 1))

    kpis = []
    for key, title, unit in KPIS:
        kpis.append({
            "key": key, "title": title, "unit": unit, "value": cur[key],
            "prev": prev[key], "vs_prev": change(cur[key], prev[key]),
            "ly": ly[key], "vs_ly": change(cur[key], ly[key]),
            "money": key in ("sold_sum", "ad_income"),
        })

    year_rows = []
    for key, title, unit in KPIS:
        year_rows.append({"title": title, "unit": unit, "cur": year_cur[key], "prev": year_prev[key],
                          "change": change(year_cur[key], year_prev[key]),
                          "money": key in ("sold_sum", "ad_income")})

    return {
        "dash": {
            "month_name": f"{UZ_MONTHS[today.month - 1]} {today.year}",
            "prev_name": f"{UZ_MONTHS[prev_m.month - 1]} {prev_m.year}",
            "ly_name": f"{UZ_MONTHS[ly_m.month - 1]} {ly_m.year}",
            "year": today.year,
            "kpis": kpis,
            "year_rows": year_rows,
            "series": monthly_series(),
            "pending": Lead.objects.filter(kind=Lead.Kind.SELL, state=Lead.State.NEW)
                       .prefetch_related("photos")[:6],
            "pending_count": Lead.objects.filter(kind=Lead.Kind.SELL, state=Lead.State.NEW).count(),
            "contact_new": Lead.objects.exclude(kind=Lead.Kind.SELL).filter(state=Lead.State.NEW).count(),
            "for_sale": Car.objects.filter(status=Car.Status.AVAILABLE).count(),
            "reserved": Car.objects.filter(status=Car.Status.RESERVED).count(),
            "recent_sold": Car.objects.filter(status=Car.Status.SOLD).select_related("brand")
                           .order_by("-sold_at", "-id")[:5],
        }
    }
