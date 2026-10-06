# Inomarka Bor — premium avto savdo sayti (frontend demo)

[@_inomarka_bor_](https://www.instagram.com/_inomarka_bor_/) Instagram sahifasi uchun tayyorlangan taklif (demo) sayt.
Faqat HTML + CSS + JavaScript — build kerak emas, istalgan statik hostingda ishlaydi.

> **Holati:** demo. Mashinalar roʻyxati, narxlar va matnlar namunaviy; rasmlar Wikimedia Commons'dan
> (mualliflari — [CREDITS.md](CREDITS.md)). Mijoz rozi boʻlgach, real maʼlumot va rasmlar bilan almashtiriladi,
> backend ulanadi (reja — [docs/FRAPPE-OQUV-REJA.md](docs/FRAPPE-OQUV-REJA.md)).

## Nima muammoni hal qiladi

Hozir mashina tafsilotlari Instagram izohiga "pin" qilinadi — mijoz qidirib topishi qiyin, bir xil savollar
("narxi qancha?", "probegi?") qayta-qayta beriladi. Saytda **har bir mashina — alohida havola**: rasmlar, narx,
yil, probeg, kraska holati, qulayliklar va bir bosishda qoʻngʻiroq / Telegram. Bu havolani post, izoh, story yoki
bio'ga qoʻyish kifoya.

## Sahifalar

| Fayl | Sahifa | Asosiy imkoniyatlar |
|---|---|---|
| `index.html` | Bosh sahifa | Hero, tezkor qidiruv, TOP takliflar, "Baraka boʻldi" slayderi, FAQ |
| `catalog.html` | Katalog | Filtrlar (marka, kuzov, yoqilgʻi, narx, yil, probeg, "tozza"), saralash, URL orqali ulashish, mobil filtr oynasi |
| `car.html?id=...` | Mashina sahifasi | Galereya + toʻliq ekran, xususiyatlar, Telegram'ga tayyor xabar, ulashish, oʻxshash mashinalar, schema.org |
| `sold.html` | Baraka boʻldi 🤝 | Sotilgan mashinalar (ishonch uchun), marka boʻyicha filtr |
| `sell.html` | Mashinangizni soting | Ariza: mashina, rasmlar, aloqa; telefon maskasi, tekshiruv |
| `contact.html` | Aloqa | Kontaktlar, murojaat shakli, xarita |
| `about.html` | Biz haqimizda | Tarix, xizmatlar, qadriyatlar |
| `favorites.html` | Saqlanganlar | ♥ bilan saqlanganlar + taqqoslash jadvali |
| `admin.html` | Boshqaruv paneli (demo) | Eʼlon qoʻshish/tahrirlash, status ("Baraka boʻldi" bir bosishda), Instagram uchun tayyor matn, arizalar |
| `404.html` | Topilmadi | — |

Hamma sahifa **UZ / RU** tillarida, mobilga moslangan (320 px dan boshlab).

## Ishga tushirish

Oddiy usul — `index.html` ni brauzerda oching. Yaxshiroq usul (lokal server):

```bash
npx serve .          # yoki: python -m http.server 8080
```

Admin panel: `admin.html`, demo parol — `demo` (`assets/js/config.js` da oʻzgartiriladi).
Admin'dagi oʻzgarishlar faqat **shu brauzerda** (localStorage) saqlanadi — bu backend'siz demo.

## Tuzilma

```
assets/
  css/style.css          dizayn tizimi (ranglar, komponentlar, responsive)
  js/config.js           brend, telefonlar, Telegram/Instagram, valyuta kursi  ← boshqa mijozga moslash shu yerda
  js/cars.js             mashinalar bazasi (backend ulanganda API'dan keladi)
  js/i18n.js             tarjimalar (uz / ru)
  js/core.js             umumiy yadro: header/footer, kartochka, sevimlilar, toast, modal
  js/pages/*.js          sahifaga xos skriptlar
  img/brand/             logotip, favicon, og-image
  img/cars/              mashina rasmlari (WebP, katta + "-sm" kichik)
```

### Mashina qoʻshish (backend'gacha)

`assets/js/cars.js` ga yangi obyekt qoʻshing. Rasmlarni `assets/img/cars/<id>-1.webp`, `<id>-1-sm.webp`
koʻrinishida saqlang (katta: 1600 px, kichik: 720 px kenglik, 3:2 nisbat).

### Boshqa avto-bloger uchun moslash

1. `config.js` — nom, telefon, Telegram, Instagram.
2. `assets/img/brand/` — logotip va ikonkalar.
3. `cars.js` — mashinalar.
4. `style.css` boshidagi `:root` ranglari (masalan, `--gold`).

## Deploy (Netlify)

[app.netlify.com/drop](https://app.netlify.com/drop) ga papkani tashlang — tayyor. `netlify.toml` kesh va xavfsizlik
sarlavhalarini sozlaydi.

Demo davrida sayt **qidiruv tizimlaridan yashirilgan** (`<meta name="robots" content="noindex">`, `robots.txt`,
`X-Robots-Tag`). Mijoz rozi boʻlgach: shu uchtasini olib tashlang, `config.js` da `siteUrl` ni yozing,
`demo.enabled = false` qiling.

> `404.html` yoʻllari `/` dan boshlanadi (`<base href="/">`) — sayt domen ildizida (Netlify) turishi kerak.

## Keyingi qadam — backend

Hozir arizalar Telegram orqali yuboriladi, eʼlonlar `cars.js` da. Backend (Frappe) ulanganda:
eʼlonlar Desk'da boshqariladi, arizalar bazaga tushadi va Telegram bot orqali xabar keladi.
Batafsil reja: [docs/FRAPPE-OQUV-REJA.md](docs/FRAPPE-OQUV-REJA.md).
