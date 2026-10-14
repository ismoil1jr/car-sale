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
