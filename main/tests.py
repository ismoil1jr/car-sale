from django.test import TestCase
from django.urls import reverse

from .models import Brand, Car, Lead


def make_car(**kw):
    brand, _ = Brand.objects.get_or_create(name=kw.pop("brand", "Lexus"))
    defaults = dict(brand=brand, model="LX 600", year=2023, price=100000, mileage=1000)
    defaults.update(kw)
    return Car.objects.create(**defaults)


class CatalogTests(TestCase):
    def setUp(self):
        self.a = make_car(model="LX 600", price=100000)
        self.b = make_car(brand="BMW", model="X7", price=80000, year=2021, fuel="diesel")
        self.sold = make_car(brand="BMW", model="M5", status="sold")

    def test_slug_generated(self):
        self.assertEqual(self.a.slug, "lexus-lx-600-2023")

    def test_hides_sold_by_default(self):
        r = self.client.get(reverse("catalog"))
        self.assertEqual({c.pk for c in r.context["cars"]}, {self.a.pk, self.b.pk})

    def test_filters_and_sort(self):
        r = self.client.get(reverse("catalog"), {"sold": "1", "brand": "BMW", "sort": "priceAsc"})
        self.assertEqual([c.model for c in r.context["cars"]][0], "X7")  # sotilgani oxirida
        r = self.client.get(reverse("catalog"), {"fuel": "diesel"})
        self.assertEqual([c.pk for c in r.context["cars"]], [self.b.pk])
        r = self.client.get(reverse("catalog"), {"q": "lx 600", "priceMax": "90000"})
        self.assertEqual(r.context["count"], 0)

    def test_pages_render(self):
        for name in ("home", "sold", "favorites", "sell", "contact", "about"):
            self.assertEqual(self.client.get(reverse(name)).status_code, 200, name)
        self.assertEqual(self.client.get(self.a.get_absolute_url()).status_code, 200)
        self.assertEqual(self.client.get("/car/yoq/").status_code, 404)

    def test_favorites_fragment(self):
        r = self.client.get(reverse("favorites_cards"), {"ids": f"{self.b.slug},{self.a.slug},zzz"})
        data = r.json()
        self.assertEqual(data["ids"], [self.b.slug, self.a.slug])
        self.assertIn("compare", data["compare"])


class LeadTests(TestCase):
    def test_contact_saves_lead(self):
        r = self.client.post(reverse("contact"), {
            "kind": "find", "name": "Ali", "phone": "+998 (90) 123-45-67", "message": "Tahoe kerak"})
        self.assertRedirects(r, reverse("contact"))
        lead = Lead.objects.get()
        self.assertEqual(lead.phone, "+998901234567")
        self.assertEqual(lead.kind, "find")

    def test_contact_rejects_bad_phone(self):
        r = self.client.post(reverse("contact"), {"kind": "buy", "name": "A", "phone": "123", "message": "x"})
        self.assertEqual(r.status_code, 200)
        self.assertFalse(Lead.objects.exists())

    def test_sell_saves_lead(self):
        r = self.client.post(reverse("sell"), {
            "name": "Vali", "phone": "998901234567", "brand": "Kia", "model": "K5",
            "year": "2020", "mileage": "50000", "paint": "clean"})
        self.assertRedirects(r, reverse("sell"))
        self.assertEqual(Lead.objects.get().kind, "sell")


class ElectricTests(TestCase):
    def test_electric_link_and_filter(self):
        ev = make_car(brand="Zeekr", model="001", fuel="electric")
        make_car(brand="BYD", model="Song", fuel="electric")
        make_car(brand="BMW", model="X7", fuel="petrol")
        home = self.client.get(reverse("home")).content.decode()
        self.assertIn("?fuel=electric", home)
        r = self.client.get(reverse("catalog"), {"fuel": "electric"})
        self.assertEqual({c.brand.name for c in r.context["cars"]}, {"Zeekr", "BYD"})
        self.assertEqual(r.context["count"], 2)
        self.assertIn(ev, r.context["cars"])


class CategoryTests(TestCase):
    def test_category_strip(self):
        make_car(model="LX", body="suv")
        make_car(brand="Kia", model="K5", body="sedan")
        make_car(brand="BYD", model="Seal", body="sedan", fuel="electric")
        home = self.client.get(reverse("home"))
        keys = [c["key"] for c in home.context["categories"]]
        self.assertEqual(keys, ["suv", "sedan", "electric"])  # bo'sh kategoriyalar yashiriladi
        r = self.client.get(reverse("catalog"), {"body": "sedan"})
        active = [c["key"] for c in r.context["categories"] if c["active"]]
        self.assertEqual(active, ["sedan"])
        self.assertEqual(r.context["count"], 2)


class CarUrlTests(TestCase):
    def test_same_car_twice_gets_unique_urls(self):
        a = make_car(model="LX 600", year=2023)
        b = make_car(model="LX 600", year=2023)
        self.assertNotEqual(a.get_absolute_url(), b.get_absolute_url())
        self.assertEqual(a.get_absolute_url(), f"/car/{a.pk}/lexus-lx-600-2023/")
        for car in (a, b):
            r = self.client.get(car.get_absolute_url())
            self.assertEqual(r.status_code, 200)
            self.assertEqual(r.context["car"], car)

    def test_redirects_to_canonical_url(self):
        car = make_car()
        self.assertRedirects(self.client.get(f"/car/{car.pk}/"), car.get_absolute_url(), status_code=301)
        self.assertRedirects(self.client.get(f"/car/{car.pk}/eski-nom/"), car.get_absolute_url(), status_code=301)
        self.assertRedirects(self.client.get(f"/car/{car.slug}/"), car.get_absolute_url(), status_code=301)
        self.assertEqual(self.client.get("/car/999999/").status_code, 404)


class FooterTests(TestCase):
    def test_footer_shows_categories_not_brands(self):
        make_car(brand="Lexus", body="suv")
        make_car(brand="Kia", model="K5", body="sedan")
        html = self.client.get(reverse("home")).content.decode()
        footer = html[html.index('<footer'):]
        self.assertIn("Kategoriyalar", footer)
        self.assertIn("?body=sedan", footer)
        self.assertIn("?fuel=electric", footer)
        self.assertNotIn("?brand=", footer)


class AdminReviewTests(TestCase):
    def setUp(self):
        from django.contrib.auth.models import User
        self.admin = User.objects.create_superuser("boss", "b@x.uz", "pass12345")
        self.client.force_login(self.admin)
        self.lead = Lead.objects.create(kind="sell", name="Vali", phone="+998901234567", brand="Kia",
                                        model="K5", year=2021, mileage=40000, budget=21000, paint="clean",
                                        message="Bitta egasi")

    def test_accept_creates_car_on_site(self):
        url = reverse("admin:main_selllead_accept", args=[self.lead.pk])
        page = self.client.get(url)
        self.assertEqual(page.status_code, 200)
        self.assertEqual(page.context["form"].initial["brand_name"], "Kia")
        data = {"brand_name": "Kia", "model": "K5", "trim": "", "year": 2021, "mileage": 40000, "price": 21000,
                "negotiable": "on", "body": "sedan", "fuel": "petrol", "transmission": "automatic", "drive": "fwd",
                "engine": "", "power": "", "color": "white", "condition": "clean", "seats": 5,
                "description_uz": "Bitta egasi", "description_ru": "", "ad_fee": 300000}
        r = self.client.post(url, data)
        self.assertRedirects(r, reverse("admin:main_selllead_changelist"))
        self.lead.refresh_from_db()
        self.assertEqual(self.lead.state, "accepted")
        car = self.lead.car
        self.assertEqual((car.source, car.ad_fee, car.status), ("client", 300000, "available"))
        self.assertIn(car, self.client.get(reverse("catalog")).context["cars"])

    def test_reject(self):
        r = self.client.post(reverse("admin:main_selllead_reject", args=[self.lead.pk]), {"reason": "Narx baland"})
        self.assertRedirects(r, reverse("admin:main_selllead_changelist"))
        self.lead.refresh_from_db()
        self.assertEqual((self.lead.state, self.lead.reject_reason), ("rejected", "Narx baland"))
        self.assertFalse(Car.objects.exists())
        rejected = self.client.get(reverse("admin:main_selllead_changelist") + "?state__exact=rejected")
        self.assertContains(rejected, "Vali")

    def test_dashboard(self):
        from datetime import date
        from django.utils import timezone
        today = timezone.localdate()
        make_car(model="A", status="sold", sold_at=today)
        make_car(model="B", status="sold", sold_at=date(today.year - 1, today.month, 1))
        make_car(model="C", source="client", ad_fee=300000)
        r = self.client.get(reverse("admin:index"))
        self.assertEqual(r.status_code, 200)
        kpis = {k["key"]: k for k in r.context["dash"]["kpis"]}
        self.assertEqual(kpis["sold"]["value"], 1)
        self.assertEqual(kpis["sold"]["ly"], 1)
        self.assertEqual(kpis["ad_income"]["value"], 300000)
        self.assertEqual(r.context["dash"]["pending_count"], 1)
        self.assertContains(r, "Reklama tushumi")
        for name in ("main_car", "main_selllead", "main_contactlead"):
            self.assertEqual(self.client.get(reverse(f"admin:{name}_changelist")).status_code, 200, name)
