"""Admin dashboard statistikasi: oylik baraka (sotuvlar), reklama tushumi, arizalar."""
from datetime import date

from django.db.models import Count, Sum
from django.db.models.functions import TruncMonth
from django.utils import timezone

from .models import Ad, Car, Lead

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
    video = Ad.objects.filter(starts_on__gte=start, starts_on__lt=end).aggregate(n=Count("id"), total=Sum("price"))
    leads = Lead.objects.filter(created_at__date__gte=start, created_at__date__lt=end)
    decided = Lead.objects.filter(decided_at__date__gte=start, decided_at__date__lt=end)
    s = sold.aggregate(n=Count("id"), total=Sum("price"))
    a = ads.aggregate(n=Count("id"), total=Sum("ad_fee"))
    return {
        "sold": s["n"],
        "sold_sum": s["total"] or 0,
        "ads": a["n"] + video["n"],
        "ad_income": (a["total"] or 0) + (video["total"] or 0),
        "leads": leads.count(),
        "sell_leads": leads.filter(kind=Lead.Kind.SELL).count(),
        "accepted": decided.filter(state=Lead.State.ACCEPTED).count(),
        "rejected": decided.filter(state=Lead.State.REJECTED).count(),
        "done": decided.filter(state=Lead.State.DONE).count(),
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
    ("ads", "Reklamalar", "ta (mijoz eʼloni + video)"),
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
    video = dict(
        Ad.objects.filter(starts_on__gte=first)
        .annotate(m=TruncMonth("starts_on")).values("m").annotate(s=Sum("price")).values_list("m", "s")
    )
    rows = []
    for i in range(months):
        m = add_months(first, i)
        rows.append({"month": m, "label": f"{UZ_MONTHS_SHORT[m.month - 1]}",
                     "title": f"{UZ_MONTHS[m.month - 1]} {m.year}",
                     "sold": sold.get(m, 0), "ad_income": (ads.get(m, 0) or 0) + (video.get(m, 0) or 0),
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
            "cmp": [("Oʻtgan oy", prev[key], change(cur[key], prev[key])),
                    ("Oʻtgan yil", ly[key], change(cur[key], ly[key]))],
        })

    year_rows = []
    for key, title, unit in KPIS:
        year_rows.append({"title": title, "unit": unit, "cur": year_cur[key], "prev": year_prev[key],
                          "change": change(year_cur[key], year_prev[key]),
                          "money": key in ("sold_sum", "ad_income")})

    series = monthly_series()
    pending = Lead.objects.filter(state__in=Lead.PENDING_STATES)
    pending_sell = pending.filter(kind=Lead.Kind.SELL)
    pending_contact = pending.exclude(kind=Lead.Kind.SELL)
    return {
        "dash": {
            "chart": {
                "labels": [f"{r['label']} {str(r['month'].year)[2:]}" for r in series],
                "titles": [r["title"] for r in series],
                "sold": [r["sold"] for r in series],
                "ad_income": [r["ad_income"] for r in series],
            },
            "month_name": f"{UZ_MONTHS[today.month - 1]} {today.year}",
            "updated_at": timezone.localtime(),
            "prev_name": f"{UZ_MONTHS[prev_m.month - 1]} {prev_m.year}",
            "ly_name": f"{UZ_MONTHS[ly_m.month - 1]} {ly_m.year}",
            "year": today.year,
            "kpis": kpis,
            "year_rows": year_rows,
            "series": series,
            "pending": pending_sell.prefetch_related("photos")[:6],
            "pending_count": pending_sell.count(),
            "contacts": pending_contact.select_related("car__brand")[:5],
            "contact_new": pending_contact.count(),
            "leads_month": {"in": cur["leads"], "accepted": cur["accepted"], "rejected": cur["rejected"],
                            "done": cur["done"]},
            "for_sale": Car.objects.filter(status=Car.Status.AVAILABLE).count(),
            "reserved": Car.objects.filter(status=Car.Status.RESERVED).count(),
            "total_cars": Car.objects.count(),
            "video_ads": Ad.objects.all()[:8],
            "recent_sold": Car.objects.filter(status=Car.Status.SOLD).select_related("brand")
                           .order_by("-sold_at", "-id")[:5],
        }
    }
