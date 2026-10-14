import json
from datetime import date
from pathlib import Path

from django.conf import settings
from django.core.management.base import BaseCommand
from django.db import transaction

from main.models import Brand, Car, CarImage, Feature

DATA = Path(__file__).resolve().parents[2] / "data" / "cars.json"


class Command(BaseCommand):
    help = "Demo avtomobillarni (main/data/cars.json) bazaga yuklaydi. Qayta ishga tushirsa ham dublikat yaratmaydi."

    @transaction.atomic
    def handle(self, *args, **options):
        data = json.loads(DATA.read_text(encoding="utf-8"))
        credits = data["credits"]

        features = {}
        for f in data["features"]:
            obj, _ = Feature.objects.update_or_create(key=f["key"], defaults={"name_uz": f["uz"], "name_ru": f["ru"]})
            features[f["key"]] = obj

        created = 0
        for c in data["cars"]:
            brand, _ = Brand.objects.get_or_create(name=c["brand"])
            car, was_created = Car.objects.update_or_create(
                slug=c["id"],
                defaults={
                    "brand": brand,
                    "model": c["model"],
                    "trim": c.get("trim", ""),
                    "year": c["year"],
                    "reg_year": c.get("regYear"),
                    "price": c["price"],
                    "negotiable": c.get("negotiable", False),
                    "mileage": c["mileage"],
                    "body": c["body"],
                    "fuel": c["fuel"],
                    "transmission": c["transmission"],
                    "drive": c["drive"],
                    "engine": c.get("engine", ""),
                    "power": c.get("power"),
                    "color": c["color"],
                    "condition": c["condition"],
                    "seats": c.get("seats", 5),
                    "description_uz": c["description"].get("uz", ""),
                    "description_ru": c["description"].get("ru", ""),
                    "video_url": c.get("video", ""),
                    "status": c["status"],
                    "featured": c.get("featured", False),
                    "posted_at": date.fromisoformat(c["postedAt"]),
                    "sold_at": date.fromisoformat(c["soldAt"]) if c.get("soldAt") else None,
                },
            )
            car.features.set([features[k] for k in c.get("features", []) if k in features])

            car.images.all().delete()
            for i, path in enumerate(c["images"]):
                name = path.rsplit("/", 1)[-1]
                thumb_name = name.replace(".webp", "-sm.webp")
                has_thumb = (Path(settings.MEDIA_ROOT) / "cars" / thumb_name).exists()
                credit = credits.get(name, {})
                CarImage.objects.create(
                    car=car,
                    image=f"cars/{name}",
                    thumbnail=f"cars/{thumb_name}" if has_thumb else "",
                    order=i,
                    credit_author=credit.get("author", ""),
                    credit_license=credit.get("license", ""),
                    credit_source=credit.get("source", ""),
                )
            created += was_created

        self.stdout.write(self.style.SUCCESS(
            f"Tayyor: {len(data['cars'])} ta mashina ({created} ta yangi), {len(features)} ta qulaylik."))
