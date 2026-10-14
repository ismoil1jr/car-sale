from django import template
from django.conf import settings
from django.utils.html import format_html
from django.utils.safestring import mark_safe

register = template.Library()

UZ_MONTHS = ["yanvar", "fevral", "mart", "aprel", "may", "iyun",
             "iyul", "avgust", "sentabr", "oktabr", "noyabr", "dekabr"]


def _spaced(n):
    return f"{int(n or 0):,}".replace(",", " ")


@register.filter
def spaced(value):
    """48000 -> '48 000'"""
    try:
        return _spaced(value)
    except (TypeError, ValueError):
        return value


@register.filter
def usd(value):
    return f"${spaced(value)}"


@register.simple_tag
def uzs(price):
    """Narxning so'mdagi taxminiy ko'rinishi (til almashganda birlik ham almashadi)."""
    v = (price or 0) * settings.SITE["usd_to_uzs"]
    if v >= 1e9:
        num = f"{v / 1e9:.2f}".rstrip("0").rstrip(".")
        unit = "bln"
    else:
        num = _spaced(round(v / 1e6))
        unit = "mln"
    label = "mlrd soʻm" if unit == "bln" else "mln soʻm"
    return format_html('≈ {} <span data-unit="{}">{}</span>', num, unit, label)


@register.simple_tag
def uzdate(d):
    if not d:
        return ""
    return format_html('<time datetime="{}" data-fmt="date">{} {} {}</time>',
                       d.isoformat(), d.day, UZ_MONTHS[d.month - 1], d.year)


@register.simple_tag
def choice(obj, field):
    """Tanlov maydonining uz nomi + data-i18n kaliti: <span data-i18n="fuel.petrol">Benzin</span>"""
    return format_html('<span data-i18n="{}.{}">{}</span>', field, getattr(obj, field),
                       getattr(obj, f"get_{field}_display")())


@register.simple_tag
def condition_short(obj):
    label = "Tozza" if obj.condition == "clean" else "Qisman kraska"
    return format_html('<span data-i18n="cond.{}Short">{}</span>', obj.condition, label)


@register.filter
def getitem(mapping, key):
    try:
        return mapping.get(key)
    except AttributeError:
        return None


@register.filter
def telnum(value):
    return str(value).replace(" ", "")
