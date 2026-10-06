/*
 * Sayt sozlamalari — brend, kontaktlar, valyuta.
 * Boshqa avto-bloger uchun moslash: faqat shu faylni va cars.js ni o'zgartirish kifoya.
 */
window.IB_CONFIG = {
  brand: "Inomarka Bor",
  owner: "Alisher",
  logo: "assets/img/brand/logo.png",
  logoSmall: "assets/img/brand/logo-sm.png",
  tagline: {
    uz: "Auto blog | Premium avtomobillar",
    ru: "Авто блог | Премиум автомобили",
  },
  city: { uz: "Toshkent", ru: "Ташкент" },
  experienceYears: 16,
  followers: "22.3K",
  posts: "120+",

  phones: [
    { number: "+998957022222", display: "+998 95 702 22 22", label: { uz: "Asosiy raqam", ru: "Основной номер" } },
    { number: "+998974555255", display: "+998 97 455 52 55", label: { uz: "Sotuv boʻlimi", ru: "Отдел продаж" } },
  ],
  telegram: {
    personal: "Alisher_ilhomovich_702", // shaxsiy — xabar yozish uchun
    channel: "inomarka_bor_1", // kanal — yangi e'lonlar
  },
  instagram: "_inomarka_bor_",
  workHours: { uz: "Har kuni 09:00 – 21:00", ru: "Ежедневно 09:00 – 21:00" },
  mapQuery: "Tashkent, Uzbekistan",

  currency: {
    usdToUzs: 12100, // kursni yangilab turing
    showUzs: true,
  },

  // Demo rejim: footerda "demo" belgisi va admin panel paroli.
  demo: {
    enabled: true,
    adminPassword: "demo",
  },

  // Deploy qilingandan keyin to'liq manzilni yozing (masalan, https://inomarkabor.uz)
  siteUrl: "",
};
