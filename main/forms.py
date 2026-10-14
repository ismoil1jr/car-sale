import re

from django import forms

from .models import Car, Lead


def clean_uz_phone(value):
    digits = re.sub(r"\D", "", value or "")
    if not re.fullmatch(r"998\d{9}", digits):
        raise forms.ValidationError("Raqamni toʻliq kiriting")
    return f"+{digits}"


class ContactForm(forms.ModelForm):
    class Meta:
        model = Lead
        fields = ["kind", "name", "phone", "budget", "message"]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields["kind"].choices = [c for c in Lead.Kind.choices if c[0] != Lead.Kind.SELL]
        self.fields["message"].required = True

    def clean_phone(self):
        return clean_uz_phone(self.cleaned_data["phone"])


class SellForm(forms.ModelForm):
    class Meta:
        model = Lead
        fields = ["name", "phone", "brand", "model", "year", "mileage", "budget", "color", "paint", "message"]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        for f in ("brand", "model", "year", "mileage"):
            self.fields[f].required = True

    def clean_phone(self):
        return clean_uz_phone(self.cleaned_data["phone"])

    def save(self, commit=True):
        lead = super().save(commit=False)
        lead.kind = Lead.Kind.SELL
        if commit:
            lead.save()
        return lead


class MultipleFileInput(forms.ClearableFileInput):
    allow_multiple_selected = True


class AcceptLeadForm(forms.ModelForm):
    """Sotish arizasini qabul qilish: ariza ma'lumotlari bilan to'ldirilgan mashina formasi."""

    brand_name = forms.CharField(label="Marka", max_length=60)

    class Meta:
        model = Car
        fields = ["model", "trim", "year", "mileage", "price", "negotiable", "body", "fuel", "transmission",
                  "drive", "engine", "power", "color", "condition", "seats", "description_uz", "description_ru",
                  "featured", "ad_fee"]
        widgets = {
            "description_uz": forms.Textarea(attrs={"rows": 4}),
            "description_ru": forms.Textarea(attrs={"rows": 4}),
        }

    field_order = ["brand_name"]

    @classmethod
    def initial_from(cls, lead, ad_fee):
        return {
            "brand_name": lead.brand, "model": lead.model, "year": lead.year, "mileage": lead.mileage,
            "price": lead.budget, "color": lead.color or Car.Color.BLACK,
            "condition": Car.Condition.CLEAN if lead.paint in ("", "clean") else Car.Condition.PARTIAL,
            "description_uz": lead.message, "ad_fee": ad_fee, "negotiable": True,
        }

    def save_for(self, lead):
        from .models import Brand, CarImage

        car = super().save(commit=False)
        car.brand, _ = Brand.objects.get_or_create(name=self.cleaned_data["brand_name"].strip())
        car.source = Car.Source.CLIENT
        car.status = Car.Status.AVAILABLE
        car.save()
        for i, photo in enumerate(lead.photos.all()):
            CarImage.objects.create(car=car, image=photo.image.name, order=i)
        return car


class RejectLeadForm(forms.Form):
    reason = forms.CharField(label="Rad etish sababi (ixtiyoriy)", required=False,
                             widget=forms.Textarea(attrs={"rows": 3}))
