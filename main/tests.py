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
                "description_uz": "Bitta egasi", "description_ru": "", "ad_fee": 300000,
                "video_url": "https://youtu.be/dQw4w9WgXcQ"}
        r = self.client.post(url, data)
        self.assertRedirects(r, reverse("admin:main_selllead_changelist"))
        self.lead.refresh_from_db()
        self.assertEqual(self.lead.state, "accepted")
        car = self.lead.car
        self.assertEqual((car.source, car.ad_fee, car.status), ("client", 300000, "available"))
        self.assertIn(car, self.client.get(reverse("catalog")).context["cars"])
        self.assertEqual(car.video_url, "https://youtu.be/dQw4w9WgXcQ")
        # qabul qilingan ariza ro'yxatdan ketadi, arxiv filtrida qoladi
        pending = self.client.get(reverse("admin:main_selllead_changelist"))
        self.assertEqual(list(pending.context["cl"].result_list), [])
        archive = self.client.get(reverse("admin:main_selllead_changelist") + "?holat=all")
        self.assertEqual(list(archive.context["cl"].result_list), [self.lead])
        dash = self.client.get(reverse("admin:index")).context["dash"]
        self.assertEqual((dash["pending_count"], dash["leads_month"]["accepted"]), (0, 1))

    def test_reject(self):
        r = self.client.post(reverse("admin:main_selllead_reject", args=[self.lead.pk]), {"reason": "Narx baland"})
        self.assertRedirects(r, reverse("admin:main_selllead_changelist"))
        self.lead.refresh_from_db()
        self.assertEqual((self.lead.state, self.lead.reject_reason), ("rejected", "Narx baland"))
        self.assertFalse(Car.objects.exists())
        rejected = self.client.get(reverse("admin:main_selllead_changelist") + "?holat=rejected")
        self.assertContains(rejected, "Vali")
        # qayta rad etib/qabul qilib bo'lmaydi
        again = self.client.post(reverse("admin:main_selllead_accept", args=[self.lead.pk]), {})
        self.assertRedirects(again, reverse("admin:main_selllead_changelist"))
        self.assertFalse(Car.objects.exists())

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


class VideoAdTests(TestCase):
    def make_ad(self, **kw):
        from datetime import timedelta
        from django.core.files.uploadedfile import SimpleUploadedFile
        from django.utils import timezone
        from .models import Ad
        defaults = dict(title="Shina markazi", link="https://example.uz", price=500000,
                        video=SimpleUploadedFile("a.mp4", b"\x00\x00", content_type="video/mp4"))
        defaults.update(kw)
        if defaults.pop("expired", False):
            defaults["ends_on"] = timezone.localdate() - timedelta(days=1)
        return Ad.objects.create(**defaults)

    def tearDown(self):
        from .models import Ad
        for ad in Ad.objects.all():
            ad.video.delete(save=False)

    def test_running_ads_in_page(self):
        ad = self.make_ad()
        self.make_ad(title="Eski", expired=True)
        self.make_ad(title="Ochiq emas", is_active=False)
        html = self.client.get(reverse("home")).content.decode()
        self.assertIn('id="ib-ads"', html)
        self.assertIn("Shina markazi", html)
        self.assertNotIn("Eski", html)
        self.assertNotIn("Ochiq emas", html)
        self.assertIn("js/ads.js", html)

    def test_no_ads_no_script(self):
        self.assertNotIn("js/ads.js", self.client.get(reverse("home")).content.decode())

    def test_event_counters(self):
        ad = self.make_ad()
        for ev in ("view", "view", "click", "skip"):
            self.assertEqual(self.client.post(f"/ads/{ad.pk}/{ev}/").status_code, 204)
        self.assertEqual(self.client.post(f"/ads/{ad.pk}/hack/").status_code, 404)
        self.assertEqual(self.client.get(f"/ads/{ad.pk}/view/").status_code, 405)
        ad.refresh_from_db()
        self.assertEqual((ad.views, ad.clicks, ad.skips, ad.ctr), (2, 1, 1, 50.0))

    def test_ad_price_in_dashboard(self):
        from django.contrib.auth.models import User
        self.client.force_login(User.objects.create_superuser("a", "a@a.uz", "p"))
        self.make_ad(price=700000)
        r = self.client.get(reverse("admin:index"))
        kpis = {k["key"]: k for k in r.context["dash"]["kpis"]}
        self.assertEqual(kpis["ad_income"]["value"], 700000)
        self.assertEqual(self.client.get(reverse("admin:main_ad_add")).status_code, 200)


class MediaRangeTests(TestCase):
    def test_range_request(self):
        import os
        from django.conf import settings
        path = os.path.join(settings.MEDIA_ROOT, "_range_test.bin")
        with open(path, "wb") as f:
            f.write(bytes(range(100)))
        try:
            r = self.client.get("/media/_range_test.bin", HTTP_RANGE="bytes=10-19")
            self.assertEqual(r.status_code, 206)
            self.assertEqual(r["Content-Range"], "bytes 10-19/100")
            self.assertEqual(b"".join(r.streaming_content), bytes(range(10, 20)))
            self.assertEqual(self.client.get("/media/_range_test.bin").status_code, 200)
            self.assertEqual(self.client.get("/media/_range_test.bin", HTTP_RANGE="bytes=500-").status_code, 416)
            self.assertEqual(self.client.get("/media/../config/settings.py").status_code, 404)
        finally:
            os.remove(path)


class ImageAdTests(TestCase):
    def test_image_ad_and_validation(self):
        import io
        from django.core.exceptions import ValidationError
        from django.core.files.uploadedfile import SimpleUploadedFile
        from PIL import Image
        from .models import Ad
        buf = io.BytesIO()
        Image.new("RGB", (8, 8), "red").save(buf, "PNG")
        png = SimpleUploadedFile("ad.png", buf.getvalue(), content_type="image/png")
        ad = Ad(title="Rasmli", link="https://example.uz", image=png)
        ad.full_clean()
        ad.save()
        try:
            self.assertEqual(ad.kind, "image")
            html = self.client.get(reverse("home")).content.decode()
            self.assertIn('"kind": "image"', html)
            with self.assertRaises(ValidationError):
                Ad(title="Bo'sh", link="https://example.uz").full_clean()
        finally:
            ad.image.delete(save=False)


class ContactLeadReviewTests(TestCase):
    def setUp(self):
        from django.contrib.auth.models import User
        self.client.force_login(User.objects.create_superuser("boss", "b@x.uz", "pass12345"))
        self.a = Lead.objects.create(kind="find", name="Ali", phone="+998901112233", message="Tahoe kerak")
        self.b = Lead.objects.create(kind="buy", name="Sardor", phone="+998901112244", message="LX narxi?")
        self.url = reverse("admin:main_contactlead_changelist")

    def listed(self, query=""):
        return set(self.client.get(self.url + query).context["cl"].result_list)

    def test_done_action_removes_from_list(self):
        self.assertEqual(self.listed(), {self.a, self.b})
        r = self.client.post(self.url, {"action": "mark_done", "_selected_action": [self.a.pk]})
        self.assertEqual(r.status_code, 302)
        self.a.refresh_from_db()
        self.assertEqual(self.a.state, "done")
        self.assertIsNotNone(self.a.decided_at)
        self.assertEqual(self.listed(), {self.b})
        self.assertEqual(self.listed("?holat=done"), {self.a})
        self.assertEqual(self.listed("?holat=all"), {self.a, self.b})
        self.assertEqual(self.client.get(reverse("admin:index")).context["dash"]["contact_new"], 1)

    def test_sell_leads_not_in_contacts(self):
        Lead.objects.create(kind="sell", name="Vali", phone="+998901234567", brand="Kia", model="K5")
        self.assertEqual(self.listed("?holat=all"), {self.a, self.b})


class DashboardLiveTests(TestCase):
    def test_live_endpoint(self):
        from django.contrib.auth.models import User
        url = reverse("admin:dashboard_live")
        self.assertEqual(self.client.get(url).status_code, 302)  # login talab qilinadi
        self.client.force_login(User.objects.create_superuser("boss", "b@x.uz", "pass12345"))
        Lead.objects.create(kind="sell", name="Vali", phone="+998901234567", brand="Kia", model="K5")
        data = self.client.get(url).json()
        self.assertEqual(data["pending"], 1)
        self.assertIn("Kia K5", data["html"])
        self.assertEqual(len(data["chart"]["sold"]), 12)
        self.assertContains(self.client.get(reverse("admin:index")), 'data-ib-live="/admin/dashboard/live/"')


class CarVideoTests(TestCase):
    def test_youtube_embed_and_button(self):
        car = make_car(video_url="https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=10")
        self.assertEqual(car.youtube_embed, "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ")
        html = self.client.get(car.get_absolute_url()).content.decode()
        self.assertIn("youtube-nocookie.com/embed/dQw4w9WgXcQ", html)
        self.assertIn("Toʻliq video", html)

    def test_instagram_link_without_player(self):
        car = make_car(video_url="https://www.instagram.com/reel/ABC123/")
        self.assertEqual(car.youtube_embed, "")
        html = self.client.get(car.get_absolute_url()).content.decode()
        self.assertIn('href="https://www.instagram.com/reel/ABC123/"', html)
        self.assertNotIn("<iframe", html)

    def test_admin_add_form_has_video_field(self):
        from django.contrib.auth.models import User
        self.client.force_login(User.objects.create_superuser("boss", "b@x.uz", "pass12345"))
        self.assertContains(self.client.get(reverse("admin:main_car_add")), 'name="video_url"')
