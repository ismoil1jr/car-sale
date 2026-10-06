# Frappe / ERPNext oʻquv rejasi — shu saytning backendini oʻzingiz qurasiz

Bu reja ikki maqsadga xizmat qiladi:

1. **Ish uchun** — ERPNext Frappe Framework ustida qurilgan. Bu yerda oʻrgangan har bir narsa (DocType,
   controller, hooks, API, report) ishxonadagi loyihalarda ham aynan shunday ishlaydi.
2. **Shu loyiha uchun** — `car-sale` frontendi tayyor. Backend'ni Frappe'da qilsangiz, **admin panel (Desk) bepul
   keladi**: eʼlon qoʻshish, rasmlar, statuslar, foydalanuvchi huquqlari, arizalar roʻyxati — hammasi tayyor UI bilan.

## Qanday ishlaymiz

- **Kodni siz yozasiz.** Men (Claude) tushuntiraman, savol beraman, xatoni qayerdan qidirishni koʻrsataman va
  yozganingizni review qilaman. Tayyor yechim bermayman — aks holda ishda katta loyihani yolgʻiz qila olmaysiz.
- Har bosqich: **oʻqish → amaliyot → oʻzini tekshirish savollari → "tayyor" mezoni**.
  Mezon bajarilmaguncha keyingisiga oʻtmang.
- Kodni alohida repo/branch'ga push qiling va "review qil" deb yozing — men diff'ni koʻrib chiqaman.
- Tiqilib qolsangiz: xatoning toʻliq matni + nima qilganingiz + nima kutganingizni yozing.

## Umumiy arxitektura

```
 Mijoz brauzeri (shu frontend)             Alisher (admin)
        │  fetch("/api/method/car_sale.api.get_listings")      │  /app/car-listing
        ▼                                                      ▼
 ┌──────────────────────── Frappe (Python, bench) ───────────────────────┐
 │  car_sale app:  DocType'lar  →  controller (.py)  →  whitelisted API   │
 │                 hooks.py (doc_events, scheduler) → background jobs     │
 └───────────────┬───────────────────────────────┬───────────────────────┘
                 ▼                               ▼
              MariaDB                     Redis (kesh, navbat)  →  Telegram bot
```

---

## Bosqich 0 — Muhit (1–2 kun)

Bench Windows'da toʻgʻridan-toʻgʻri ishlamaydi — **WSL2 + Ubuntu** kerak.

> Avval ishxonadagi versiyani bilib oling (`bench version`) va oʻsha versiyani oʻrnating.
> Quyida `version-15` misol sifatida.

```bash
# Windows PowerShell (admin):
wsl --install -d Ubuntu-22.04

# Ubuntu ichida:
sudo apt update && sudo apt install -y git python3-dev python3-venv python3-pip pipx \
  redis-server mariadb-server mariadb-client libmysqlclient-dev pkg-config xvfb libfontconfig wkhtmltopdf
sudo mysql_secure_installation          # root parol qoʻying

# Node (nvm orqali) va yarn
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
source ~/.bashrc && nvm install 18 && npm install -g yarn

pipx install frappe-bench && pipx ensurepath && source ~/.bashrc
bench init frappe-bench --frappe-branch version-15
cd frappe-bench
bench new-site inomarka.localhost        # MariaDB root parolini soʻraydi
bench --site inomarka.localhost set-config developer_mode 1
bench new-app car_sale
bench --site inomarka.localhost install-app car_sale
bench start                               # → http://inomarka.localhost:8000
```

MariaDB `utf8mb4` sozlamasi kerak (`/etc/mysql/my.cnf`), aks holda oʻzbekcha/ruscha matnlarda muammo boʻladi —
rasmiy oʻrnatish qoʻllanmasidagi `[mysqld]` blokini qoʻying.

**Tayyor mezoni:** `http://inomarka.localhost:8000/app` ochiladi, `Administrator` bilan kirasiz, `car_sale` app
*Installed Applications* roʻyxatida bor.

---

## Bosqich 1 — Frappe qanday tuzilgan (2–3 kun)

**Oʻqing:** Frappe docs → *Basics*: bench, sites, apps, DocType, Desk.

**Amaliyot:**
- [ ] Desk'da (developer mode) `Car Brand` DocType yarating, `brand_name` maydoni bilan, `Module = Car Sale`.
- [ ] `apps/car_sale/car_sale/car_sale/doctype/car_brand/` papkasini oching: `.json`, `.py`, `.js` fayllarni oʻqing.
      Qaysi biri UI'dagi oʻzgarishdan keyin oʻzgardi?
- [ ] `bench --site inomarka.localhost mariadb` → `SHOW TABLES LIKE 'tabCar%';` → `DESCRIBE \`tabCar Brand\`;`
- [ ] `bench --site inomarka.localhost console` → `frappe.get_doc({"doctype": "Car Brand", "brand_name": "Lexus"}).insert()`
      → `frappe.db.commit()` → Desk'da paydo boʻldimi?

**Oʻzini tekshiring:**
1. Bench, site va app — uchalasining farqi nima? Bitta bench'da nechta site boʻlishi mumkin?
2. DocType yaratilganda bazada nima paydo boʻladi? `name`, `owner`, `creation`, `modified` qayerdan keladi?
3. Nega developer mode yoqilmasa DocType JSON fayllari app ichiga yozilmaydi va bu nima uchun muhim?

---

## Bosqich 2 — DocType'larni loyihalash (3–4 kun)

Frontend qaysi maʼlumotni kutishini `assets/js/cars.js` dagi izohlar va obyektlardan koʻrasiz.
Sizning vazifangiz — shuni Frappe DocType'lariga aylantirish.

| Frontend (`cars.js`) | Sizning qaroringiz |
|---|---|
| `brand` | Link → `Car Brand`? yoki Data? |
| `model`, `trim`, `engine` | Data |
| `year`, `regYear`, `mileage`, `power`, `seats` | Int |
| `price` | Currency (valyuta?) |
| `body`, `fuel`, `transmission`, `drive`, `color`, `condition`, `status` | Select — variantlari qanday? |
| `negotiable`, `featured` | Check |
| `images[]` | ? (bitta mashinada koʻp rasm) |
| `features[]` | ? (koʻp tanlov) |
| `description.uz / .ru` | ? |
| `postedAt`, `soldAt` | Date |

**Amaliyot:**
- [ ] `Car Listing`, `Car Image` (child table), `Car Feature` va kerak boʻlsa yana bittasini yarating.
- [ ] Naming qoidasini tanlang: `id` URL'da ishlatiladi (`car.html?id=lexus-lx570-2020`). Autoname qanday boʻladi?
- [ ] `cars.js` dagi 3 ta mashinani Desk orqali qoʻlda kiriting.

**Oʻzini tekshiring:**
1. Link va Select'ning farqi? Qachon Select yetarli, qachon alohida DocType kerak?
2. Child table (`istable`) oddiy DocType'dan nimasi bilan farq qiladi? Uning `parent`, `parentfield` ustunlari nima?
3. Rasm uchun `Attach Image` + `is_private` — mehmon (Guest) foydalanuvchi private faylni koʻra oladimi?

**Tayyor mezoni:** 3 ta mashina Desk'da, rasmlari bilan, list view'da marka/narx/status koʻrinadi.

---

## Bosqich 3 — Controller: biznes qoidalar Python'da (3–4 kun)

**Oʻqing:** *Controllers* — `validate`, `before_save`, `on_update`, `after_insert`, `on_trash` va ularning
ketma-ketligi; `frappe.throw`, `frappe.utils` (`today`, `getdate`, `flt`, `cint`).

**Amaliyot (`car_listing.py` da oʻzingiz yozasiz):**
- [ ] Status `Sold` ga oʻtganda `sold_on` boʻsh boʻlsa — bugungi sana qoʻyilsin; `Sold` dan qaytsa — tozalansin.
- [ ] `price <= 0`, `year` 1980 dan kichik yoki kelasi yildan katta boʻlsa — tushunarli xato.
- [ ] `featured` belgilangan mashinalar soni 6 tadan oshsa — ogohlantirish (`frappe.msgprint`), saqlashni toʻxtatmasin.
- [ ] Har bir qoidaga `test_car_listing.py` da test: `bench --site inomarka.localhost run-tests --app car_sale`.

**Oʻzini tekshiring:**
1. Qoidani `validate` ga yozish bilan `before_save` ga yozishning farqi qachon seziladi?
2. Nega `self.status == "Sold"` tekshiruvini client script'da emas, controller'da qilish kerak?
3. Sizning `sold_on` qoidangiz bulk update (list view'dan bir nechtasini oʻzgartirish) paytida ham ishlaydimi?

---

## Bosqich 4 — API va frontendni ulash (4–5 kun)

**Mexanizm (bu shunchaki misol, vazifa emas):**

```python
# car_sale/api.py
import frappe

@frappe.whitelist(allow_guest=True)
def ping():
    return {"ok": True, "now": frappe.utils.now()}
# GET /api/method/car_sale.api.ping  →  {"message": {"ok": true, "now": "..."}}
```

**Amaliyot:**
- [ ] `get_listings(filters)` — `cars.js` dagi obyektlar bilan **bir xil shakl**da roʻyxat qaytarsin
      (`frappe.get_all` + child table'lar). Faqat ommaga ochiq maydonlar!
- [ ] `get_listing(name)` — bitta mashina; topilmasa 404 mantiqli xato.
- [ ] `create_lead(...)` — sell/contact shakllaridan keladigan ariza; telefon formatini serverda tekshiring,
      spam'ga qarshi `frappe.rate_limiter.rate_limit` dekoratorini qoʻying.
- [ ] Frontend: `assets/js/core.js` dagi `IB.cars.all()` hozir sinxron. API asinxron — sahifalar qanday oʻzgaradi?
      (Bu dizayn savoli: yechimni avval soʻz bilan yozing, keyin kod.)

**Hal qilinadigan qaror — frontend qayerda turadi?**

| Variant | Afzallik | Kamchilik |
|---|---|---|
| A. Frappe ichida (`car_sale/www/`, `public/`) | Bitta domen, CORS yoʻq, cookie bilan auth oson | Frontend deploy'i backend bilan bogʻlanadi |
| B. Alohida (Netlify) + Frappe API | Frontend tez, mustaqil | `allow_cors` sozlash, ikki domen |

**Oʻzini tekshiring:**
1. `allow_guest=True` nimani ochadi va nimani ochmaydi? Guest `frappe.get_all("Car Lead")` chaqira oladimi?
2. `frappe.get_all` va `frappe.get_list` farqi (permission jihatidan)?
3. REST'ning `/api/resource/Car Listing` yoʻlidan foydalanish oʻrniga oʻz metodingizni yozish nega xavfsizroq?

---

## Bosqich 5 — Desk'ni qulay qilish (2–3 kun)

- [ ] **Client Script** (`car_listing.js`): formada "Instagram matni" tugmasi → `frappe.call` → serverdagi metod
      matnni qaytaradi → dialog'da koʻrsatish va nusxalash. (Matn shablonini `assets/js/pages/admin.js` dagi
      `caption()` dan Python'ga koʻchiring.)
- [ ] List view: status rangli indikator (`get_indicator`), standart filtrlar, rasm ustuni.
- [ ] `Car Lead` uchun Kanban (status: New → Contacted → Closed).
- [ ] Workspace: "Sotuvda", "Bron", "Bu oy sotildi" Number Card'lari.

**Savol:** nega bu tugma uchun matnni JS'da emas, serverda yasash yaxshiroq (keyin Telegram bot ham ishlatadi)?

---

## Bosqich 6 — Arizalar va Telegram xabarnoma (3–4 kun)

- [ ] `Car Sale Settings` — **Single** DocType: `telegram_bot_token` (Password), `telegram_chat_id`.
- [ ] `hooks.py`:
      ```python
      doc_events = {"Car Lead": {"after_insert": "car_sale.notifications.lead_created"}}
      ```
- [ ] `lead_created` Telegram'ga **toʻgʻridan-toʻgʻri soʻrov yubormasin** — `frappe.enqueue(...)` bilan fon
      vazifasiga bersin. Xato boʻlsa `frappe.log_error` (Error Log'da koʻrinadi).
- [ ] Har kuni 09:00 da "kecha N ta ariza, M ta mashina sotildi" hisoboti — `scheduler_events`.

**Oʻzini tekshiring:** Telegram 10 soniya javob bermasa, enqueue'siz variantda mijoz shaklni yuborganda nima koʻradi?

---

## Bosqich 7 — Hisobotlar va chop etish (2–3 kun)

- [ ] **Script Report** "Oylik sotuvlar": oy, sotilgan soni, umumiy summa, oʻrtacha sotilish muddati (kun).
- [ ] **Query Report** "Markalar boʻyicha qoldiq".
- [ ] **Print Format** (Jinja): mashina uchun 1 sahifali "spec sheet" PDF — rasm, narx, xususiyatlar, QR (sayt havolasi).

---

## Bosqich 8 — ERPNext bilan bogʻlash (ish uchun eng muhimi, 1–2 hafta)

Avval ERPNext'ni **UI orqali** oʻrganing (kodsiz): `bench get-app erpnext --branch version-15`,
`bench --site inomarka.localhost install-app erpnext`, Setup Wizard.

- [ ] Selling oqimi: Customer → Quotation → Sales Order → Sales Invoice → Payment Entry. Har birini qoʻlda bajaring.
- [ ] Stock: Item, Warehouse, Stock Entry; Accounts: Chart of Accounts, General Ledger — Sales Invoice qaysi
      yozuvlarni yaratdi?
- [ ] Integratsiya qarorlari (avval yozma javob bering):
  - Mashina — ERPNext `Item` boʻladimi (har mashina — alohida item yoki serial raqam)?
  - Oʻzingizning `Car Lead` oʻrniga ERPNext CRM'dagi tayyor `Lead` ishlatilsa-chi?
  - Status `Sold` boʻlganda `Sales Invoice` avtomatik yaratilsinmi yoki aksincha — invoice submit boʻlganda status oʻzgarsinmi?
- [ ] Standart DocType'ga maydon kerak boʻlsa — **core'ni tahrirlamang**: Custom Field + `fixtures` (hooks.py) orqali
      app'ga eksport qiling.

**Oʻzini tekshiring:**
1. `on_submit` / `on_cancel` / `docstatus` (0, 1, 2) nima? Qaysi DocType'lar submittable va nega?
2. Nega ERPNext fayllarini toʻgʻridan-toʻgʻri tahrirlash ishxonada katta muammo keltiradi (`bench update` dan keyin nima boʻladi)?
3. Ishxonangizdagi bitta custom app'ni oching: `hooks.py` da nimalar bor? Har birini tushuntirib bera olasizmi?

---

## Bosqich 9 — Production (3–4 kun)

- [ ] App'ni alohida git repo qiling; `bench get-app <repo-url>` bilan boshqa bench'ga oʻrnatib koʻring.
- [ ] Patch yozing (`patches.txt`): eski maʼlumotni yangi maydonga koʻchiradigan; `bench --site ... migrate`.
- [ ] `bench --site ... backup --with-files` va boshqa site'ga restore.
- [ ] Deploy: Frappe Cloud (oson) yoki VPS'da `bench setup production` (nginx + supervisor), SSL.

---

## Ishxonada tezroq oʻsish uchun odatlar

- **Kodni oʻqing.** Savol tugʻilsa, ERPNext'dan oʻxshash joyni toping: masalan, `erpnext/selling/doctype/sales_order/sales_order.py`.
  Frappe'ning oʻzini ham (`frappe/model/document.py`) — "magic" deb oʻylagan narsangiz u yerda yozilgan.
- **`bench console`** — har qanday gʻoyani 30 soniyada sinab koʻrish joyi.
- **Network tab** — Desk'dagi har bir tugma qaysi `/api/method/...` ni chaqirayotganini koʻring.
- **Error Log** va `bench start` chiqishi — xatoning birinchi qatori emas, oxirgi `Traceback` qatori muhim.
- Har kuni bitta kichik narsa (fix, report, client script) — bir oyda ishxonadagi kodni oʻqiy boshlaysiz.

## Manbalar

- Frappe Framework hujjatlari — https://docs.frappe.io/framework
- ERPNext hujjatlari — https://docs.frappe.io/erpnext
- Frappe School (bepul videokurslar) — https://school.frappe.io
- Forum — https://discuss.frappe.io
- Manba kod — https://github.com/frappe/frappe , https://github.com/frappe/erpnext

## Lugʻat

| Atama | Maʼnosi |
|---|---|
| bench | Frappe loyihalarini boshqaradigan CLI va papka (apps + sites) |
| site | Alohida maʼlumotlar bazasi + sozlamalar; bitta bench'da bir nechta |
| app | Python paketi: DocType'lar, kod, hooks (`frappe`, `erpnext`, `car_sale`) |
| DocType | Jadval + forma + ruxsatlar + API — hammasi bitta taʼrifda |
| Document | DocType'ning bitta yozuvi (`frappe.get_doc`) |
| Child table | Boshqa hujjat ichidagi qatorlar (rasmlar, buyurtma qatorlari) |
| Single | Bitta nusxali DocType — sozlamalar uchun |
| Controller | DocType'ning `.py` klassi — biznes qoidalar |
| Client Script | Formadagi JS (`frappe.ui.form.on`) |
| hooks.py | App'ning boshqa qismlarga "ulanish" nuqtalari (doc_events, scheduler, fixtures) |
| whitelist | Python funksiyasini HTTP orqali chaqiriladigan qilish |
| docstatus | 0 — qoralama, 1 — tasdiqlangan (submit), 2 — bekor qilingan |
