# Inomarka Bor — avtomobil savdo sayti (Django)

Mashinalar, rasmlar, qulayliklar va arizalar bazada saqlanadi; sayt sahifalari Django shablonlarida (`{% for %}`) chiziladi.

## Ishga tushirish

```bash
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py load_cars          # demo mashinalarni bazaga yuklaydi (qayta ishlatsa ham dublikat qilmaydi)
python manage.py createsuperuser    # admin uchun login/parol
python manage.py runserver
```

Sayt: http://127.0.0.1:8000/ · Boshqaruv paneli: http://127.0.0.1:8000/admin/

## Tuzilma

| Papka / fayl | Vazifasi |
| --- | --- |
| `main/models.py` | `Brand`, `Feature`, `Car`, `CarImage`, `Lead`, `LeadPhoto` |
| `main/admin.py` | Admin: mashina (rasmlar inline), tezkor status amallari, arizalar |
| `main/views.py` | Bosh sahifa, katalog (server filtri/saralash), mashina, sold, saqlanganlar, formalar |
| `main/forms.py` | Aloqa va sotish formalari (telefon tekshiruvi) |
| `main/data/cars.json` | Demo ma'lumotlar (`load_cars` buyrug'i uchun) |
| `templates/` | HTML shablonlar (`base.html`, `partials/`) |
| `static/` | CSS, JS, logotip/ikonlar (`/assets/...` orqali beriladi) |
| `media/` | Mashina rasmlari va foydalanuvchi yuklagan fayllar |
| `config/settings.py` | Sozlamalar; `SITE` — telefon, Telegram, Instagram, ish vaqti, dollar kursi |

Saqlanganlar (♥) brauzerning `localStorage`ida turadi, kartochkalarni server chizadi.
