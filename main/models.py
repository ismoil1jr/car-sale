import re

from django.core.validators import FileExtensionValidator, MinValueValidator
from django.db import models
from django.urls import reverse
from django.utils import timezone
from django.utils.text import slugify

YOUTUBE_RE = re.compile(r"(?:youtube\.com/(?:watch\?(?:.*&)?v=|shorts/|embed/|live/)|youtu\.be/)([\w-]{11})")


class Brand(models.Model):
    name = models.CharField("Nomi", max_length=60, unique=True)
    slug = models.SlugField(max_length=70, unique=True, blank=True)

    class Meta:
        ordering = ["name"]
        verbose_name = "Marka"
        verbose_name_plural = "Markalar"

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)


class Feature(models.Model):
    """Qulaylik / opsiya (charm salon, 360° kamera va h.k.)."""

    key = models.SlugField("Kalit", max_length=40, unique=True, help_text="Masalan: camera360")
    name_uz = models.CharField("Nomi (uz)", max_length=100)
    name_ru = models.CharField("Nomi (ru)", max_length=100, blank=True)

    class Meta:
        ordering = ["name_uz"]
        verbose_name = "Qulaylik"
        verbose_name_plural = "Qulayliklar"

    def __str__(self):
        return self.name_uz


class Car(models.Model):
    class Status(models.TextChoices):
        AVAILABLE = "available", "Sotuvda"
        RESERVED = "reserved", "Bron qilingan"
        SOLD = "sold", "Baraka boʻldi"

    class Body(models.TextChoices):
        SUV = "suv", "SUV / Yoʻltanlamas"
        SEDAN = "sedan", "Sedan"
        PICKUP = "pickup", "Pikap"
        LIFTBACK = "liftback", "Liftbek"
        HATCHBACK = "hatchback", "Hetchbek"
        MINIVAN = "minivan", "Miniven"
        COUPE = "coupe", "Kupe"

    class Fuel(models.TextChoices):
        PETROL = "petrol", "Benzin"
        DIESEL = "diesel", "Dizel"
        HYBRID = "hybrid", "Gibrid"
        ELECTRIC = "electric", "Elektr"

    class Transmission(models.TextChoices):
        AUTOMATIC = "automatic", "Avtomat"
        MANUAL = "manual", "Mexanika"

    class Drive(models.TextChoices):
        AWD = "awd", "Toʻliq (AWD)"
        FOURWD = "4wd", "Toʻliq (4×4)"
        RWD = "rwd", "Orqa"
        FWD = "fwd", "Old"

    class Color(models.TextChoices):
        BLACK = "black", "Qora"
        WHITE = "white", "Oq"
        SILVER = "silver", "Kumushrang"
        GREY = "grey", "Kulrang"
        BLUE = "blue", "Koʻk"
        GREEN = "green", "Yashil"
        BEIGE = "beige", "Bej"
        RED = "red", "Qizil"

    class Condition(models.TextChoices):
        CLEAN = "clean", "Tozza — kraska yoʻq"
        PARTIAL = "partial", "Qisman kraska bor"

    brand = models.ForeignKey(Brand, verbose_name="Marka", on_delete=models.PROTECT, related_name="cars")
    model = models.CharField("Model", max_length=80)
    trim = models.CharField("Komplektatsiya", max_length=80, blank=True)
    slug = models.SlugField("URL", max_length=120, unique=True, blank=True,
                            help_text="Boʻsh qoldirilsa avtomatik yaratiladi")

    year = models.PositiveSmallIntegerField("Ishlab chiqarilgan yili")
    reg_year = models.PositiveSmallIntegerField("Roʻyxatdan oʻtgan yili", null=True, blank=True)
    price = models.PositiveIntegerField("Narx, $", validators=[MinValueValidator(1)])
    negotiable = models.BooleanField("Narx kelishiladi", default=True)
    mileage = models.PositiveIntegerField("Probeg, km")

    body = models.CharField("Kuzov", max_length=12, choices=Body.choices, default=Body.SUV)
    fuel = models.CharField("Yoqilgʻi", max_length=12, choices=Fuel.choices, default=Fuel.PETROL)
    transmission = models.CharField("Uzatma", max_length=12, choices=Transmission.choices,
                                    default=Transmission.AUTOMATIC)
    drive = models.CharField("Privod", max_length=8, choices=Drive.choices, default=Drive.AWD)
    engine = models.CharField("Dvigatel", max_length=80, blank=True, help_text="Masalan: 3.5 V6 twin-turbo")
    power = models.PositiveSmallIntegerField("Quvvat, o.k.", null=True, blank=True)
    color = models.CharField("Rang", max_length=10, choices=Color.choices, default=Color.BLACK)
    condition = models.CharField("Kraska holati", max_length=10, choices=Condition.choices,
                                 default=Condition.CLEAN)
    seats = models.PositiveSmallIntegerField("Oʻrinlar soni", default=5)

    description_uz = models.TextField("Tavsif (uz)", blank=True)
    description_ru = models.TextField("Tavsif (ru)", blank=True)
    features = models.ManyToManyField(Feature, verbose_name="Qulayliklar", blank=True, related_name="cars")
    video_url = models.URLField("Toʻliq video (havola)", max_length=500, blank=True,
                                help_text="YouTube, Instagram yoki Telegram'dagi toʻliq videosharh havolasi. "
                                          "YouTube boʻlsa — mashina sahifasida pleyer ochiladi.")

    class Source(models.TextChoices):
        OWN = "own", "Oʻzimizniki"
        CLIENT = "client", "Mijoz arizasi (reklama)"

    status = models.CharField("Holati", max_length=10, choices=Status.choices, default=Status.AVAILABLE,
                              db_index=True)
    source = models.CharField("Manba", max_length=10, choices=Source.choices, default=Source.OWN,
                              help_text="Mijoz arizasidan qoʻshilgan eʼlon — reklama hisoblanadi")
    ad_fee = models.PositiveIntegerField("Reklama toʻlovi, soʻm", default=0)
    featured = models.BooleanField("TOP eʼlon", default=False)
    posted_at = models.DateField("Eʼlon sanasi", default=timezone.localdate)
    sold_at = models.DateField("Sotilgan sana", null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-posted_at", "-id"]
        verbose_name = "Avtomobil"
        verbose_name_plural = "Avtomobillar"
        indexes = [models.Index(fields=["status", "-posted_at"])]

    def __str__(self):
        return f"{self.title} {self.year}"

    @property
    def title(self):
        return " ".join(p for p in (self.brand.name, self.model, self.trim) if p)

    @property
    def short_title(self):
        return " ".join(p for p in (self.model, self.trim) if p)

    @property
    def is_sold(self):
        return self.status == self.Status.SOLD

    @property
    def is_new(self):
        return (not self.is_sold) and (timezone.localdate() - self.posted_at).days <= 7

    def get_absolute_url(self):
        return reverse("car_detail", args=[self.pk, self.slug])

    def _make_slug(self):
        base = slugify(f"{self.brand.name} {self.model} {self.trim} {self.year}")[:110] or "car"
        slug, n = base, 2
        while Car.objects.filter(slug=slug).exclude(pk=self.pk).exists():
            slug = f"{base}-{n}"
            n += 1
        return slug

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = self._make_slug()
        if self.status == self.Status.SOLD and not self.sold_at:
            self.sold_at = timezone.localdate()
        super().save(*args, **kwargs)

    @property
    def youtube_embed(self):
        """YouTube havolasidan pleyer (embed) manzili; boshqa saytlar uchun bo'sh."""
        m = YOUTUBE_RE.search(self.video_url or "")
        return f"https://www.youtube-nocookie.com/embed/{m.group(1)}" if m else ""

    @property
    def cover(self):
        """Birinchi rasm (prefetch qilingan bo'lsa qo'shimcha so'rov ketmaydi)."""
        images = list(self.images.all())
        return images[0] if images else None


class CarImage(models.Model):
    car = models.ForeignKey(Car, verbose_name="Avtomobil", on_delete=models.CASCADE, related_name="images")
    image = models.ImageField("Rasm", upload_to="cars/")
    thumbnail = models.ImageField("Kichik rasm (ixtiyoriy)", upload_to="cars/", blank=True)
    order = models.PositiveSmallIntegerField("Tartib", default=0)
    credit_author = models.CharField("Muallif", max_length=120, blank=True)
    credit_license = models.CharField("Litsenziya", max_length=60, blank=True)
    credit_source = models.URLField("Manba", max_length=300, blank=True)

    class Meta:
        ordering = ["order", "id"]
        verbose_name = "Rasm"
        verbose_name_plural = "Rasmlar"

    def __str__(self):
        return f"{self.car} — {self.order}"

    @property
    def thumb_url(self):
        return (self.thumbnail or self.image).url


class Lead(models.Model):
    """Saytdagi formalar orqali kelgan arizalar (sotish / aloqa)."""

    class Kind(models.TextChoices):
        SELL = "sell", "Mashina sotish"
        BUY = "buy", "Mashina sotib olish"
        FIND = "find", "Mashina topib berish"
        ADS = "ads", "Reklama / hamkorlik"
        OTHER = "other", "Boshqa savol"

    class State(models.TextChoices):
        NEW = "new", "Yangi"
        PROGRESS = "progress", "Jarayonda"
        ACCEPTED = "accepted", "Qabul qilingan"
        REJECTED = "rejected", "Rad etilgan"
        DONE = "done", "Yakunlangan"

    # Hali ko'rib chiqilmagan (ro'yxatda turadigan) holatlar; qolganlari — arxiv
    PENDING_STATES = (State.NEW, State.PROGRESS)

    kind = models.CharField("Turi", max_length=10, choices=Kind.choices, default=Kind.OTHER)
    state = models.CharField("Holati", max_length=10, choices=State.choices, default=State.NEW, db_index=True)
    name = models.CharField("Ism", max_length=100)
    phone = models.CharField("Telefon", max_length=30)
    message = models.TextField("Xabar", blank=True)
    budget = models.PositiveIntegerField("Byudjet / kutilayotgan narx, $", null=True, blank=True)

    # Sotish arizasi uchun
    brand = models.CharField("Marka", max_length=60, blank=True)
    model = models.CharField("Model", max_length=80, blank=True)
    year = models.PositiveSmallIntegerField("Yili", null=True, blank=True)
    mileage = models.PositiveIntegerField("Probeg, km", null=True, blank=True)
    color = models.CharField("Rang", max_length=10, blank=True, choices=Car.Color.choices)
    paint = models.CharField("Kraska holati", max_length=10, blank=True,
                             choices=[("clean", "Tozza"), ("partial", "Qisman kraska"), ("repair", "Taʼmir talab")])

    car = models.ForeignKey(Car, verbose_name="Bogʻliq avtomobil", null=True, blank=True,
                            on_delete=models.SET_NULL, related_name="leads")
    created_at = models.DateTimeField("Kelgan vaqt", auto_now_add=True, db_index=True)
    decided_at = models.DateTimeField("Koʻrib chiqilgan vaqt", null=True, blank=True)
    reject_reason = models.TextField("Rad etish sababi", blank=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Ariza"
        verbose_name_plural = "Arizalar"

    def __str__(self):
        return f"{self.get_kind_display()} — {self.name} ({self.phone})"


class LeadPhoto(models.Model):
    lead = models.ForeignKey(Lead, on_delete=models.CASCADE, related_name="photos")
    image = models.ImageField(upload_to="leads/%Y/%m/")

    class Meta:
        verbose_name = "Ariza rasmi"
        verbose_name_plural = "Ariza rasmlari"


class SellLeadManager(models.Manager):
    def get_queryset(self):
        return super().get_queryset().filter(kind=Lead.Kind.SELL)


class ContactLeadManager(models.Manager):
    def get_queryset(self):
        return super().get_queryset().exclude(kind=Lead.Kind.SELL)


class SellLead(Lead):
    """Admin uchun: "Mashinangizni soting" arizalari (qabul qilish / rad etish)."""

    objects = SellLeadManager()

    class Meta:
        proxy = True
        verbose_name = "Sotish arizasi"
        verbose_name_plural = "Sotish arizalari"


class ContactLead(Lead):
    """Admin uchun: aloqa sahifasidan kelgan murojaatlar."""

    objects = ContactLeadManager()

    class Meta:
        proxy = True
        verbose_name = "Murojaat"
        verbose_name_plural = "Murojaatlar"


class AdQuerySet(models.QuerySet):
    def running(self):
        today = timezone.localdate()
        return self.filter(is_active=True, starts_on__lte=today).filter(
            models.Q(ends_on__isnull=True) | models.Q(ends_on__gte=today))


class Ad(models.Model):
    """Video reklama: foydalanuvchi mashinani bosganda ko'rsatiladi (bir tashrifda har biri bir marta)."""

    title = models.CharField("Nomi", max_length=120)
    advertiser = models.CharField("Reklama beruvchi", max_length=120, blank=True)
    video = models.FileField("Video (mp4/webm)", upload_to="ads/%Y/%m/", blank=True,
                             validators=[FileExtensionValidator(["mp4", "webm", "mov", "m4v"])],
                             help_text="Tavsiya: mp4 (H.264), 15–30 soniya, 10 MB gacha")
    image = models.ImageField("Rasm (png/jpg/webp/gif)", upload_to="ads/%Y/%m/", blank=True,
                              validators=[FileExtensionValidator(["png", "jpg", "jpeg", "webp", "gif"])],
                              help_text="Video oʻrniga rasm ham boʻladi. Tavsiya: 1280×720 yoki 1080×1920, 1 MB gacha")
    link = models.URLField("Havola", max_length=500, help_text="Reklama bosilganda ochiladigan sahifa")
    price = models.PositiveIntegerField("Reklama narxi, soʻm", default=0)
    is_active = models.BooleanField("Faol", default=True)
    starts_on = models.DateField("Boshlanish sanasi", default=timezone.localdate)
    ends_on = models.DateField("Tugash sanasi", null=True, blank=True, help_text="Boʻsh boʻlsa — muddatsiz")
    order = models.PositiveSmallIntegerField("Tartib", default=0, help_text="Kichik raqam birinchi chiqadi")
    views = models.PositiveIntegerField("Koʻrishlar", default=0, editable=False)
    clicks = models.PositiveIntegerField("Bosishlar", default=0, editable=False)
    skips = models.PositiveIntegerField("Oʻtkazib yuborilgan", default=0, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)

    objects = AdQuerySet.as_manager()

    class Meta:
        ordering = ["order", "-created_at"]
        verbose_name = "Video reklama"
        verbose_name_plural = "Video reklamalar"

    def __str__(self):
        return self.title

    MAX_VIDEO_MB = 25
    MAX_IMAGE_MB = 5

    def clean(self):
        from django.core.exceptions import ValidationError
        if not self.video and not self.image:
            raise ValidationError("Video yoki rasm yuklang.")
        if self.video and self.image:
            raise ValidationError("Bitta reklamaga yo video, yo rasm yuklang — ikkalasini emas.")
        if self.video and getattr(self.video, "size", 0) > self.MAX_VIDEO_MB * 1024 * 1024:
            raise ValidationError({"video": f"Video {self.MAX_VIDEO_MB} MB dan oshmasin (telefonlarda sekin ochiladi)."})
        if self.image and getattr(self.image, "size", 0) > self.MAX_IMAGE_MB * 1024 * 1024:
            raise ValidationError({"image": f"Rasm {self.MAX_IMAGE_MB} MB dan oshmasin."})

    @property
    def kind(self):
        return "video" if self.video else "image"

    @property
    def media_url(self):
        return (self.video or self.image).url if (self.video or self.image) else ""

    @property
    def ctr(self):
        return round(self.clicks * 100 / self.views, 1) if self.views else 0
