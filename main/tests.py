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
