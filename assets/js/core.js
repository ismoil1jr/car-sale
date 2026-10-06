/*
 * Umumiy yadro: til, saqlash, formatlash, ikonlar, header/footer,
 * mashina kartochkasi, sevimlilar, toast, modal, ulashish.
 * Barcha sahifalar shu fayldan foydalanadi (window.IB).
 */
(function () {
  "use strict";

  var C = window.IB_CONFIG;
  var IB = (window.IB = window.IB || {});
  IB.config = C;

  /* ------------------------------------------------------------------ */
  /* Saqlash (localStorage — xatolarga chidamli)                         */
  /* ------------------------------------------------------------------ */
  IB.store = {
    get: function (key, fallback) {
      try {
        var v = localStorage.getItem("ib:" + key);
        return v == null ? fallback : JSON.parse(v);
      } catch (e) {
        return fallback;
      }
    },
    set: function (key, value) {
      try {
        localStorage.setItem("ib:" + key, JSON.stringify(value));
        return true;
      } catch (e) {
        return false;
      }
    },
    remove: function (key) {
      try {
        localStorage.removeItem("ib:" + key);
      } catch (e) {}
    },
  };

  /* ------------------------------------------------------------------ */
  /* Til (uz / ru)                                                        */
  /* ------------------------------------------------------------------ */
  var LANGS = ["uz", "ru"];
  var urlLang = new URLSearchParams(location.search).get("lang");
  if (LANGS.indexOf(urlLang) > -1) IB.store.set("lang", urlLang);
  var savedLang = IB.store.get("lang", "uz");
  IB.lang = LANGS.indexOf(savedLang) > -1 ? savedLang : "uz";
  document.documentElement.lang = IB.lang;

  IB.t = function (key, vars) {
    var all = window.IB_I18N || {};
    var dict = all[IB.lang] || {};
    var s = dict[key];
    if (s == null) s = (all.uz || {})[key];
    if (s == null) s = key;
    if (vars) {
      s = s.replace(/\{(\w+)\}/g, function (m, k) {
        return vars[k] != null ? vars[k] : m;
      });
    }
    return s;
  };

  // {uz: "...", ru: "..."} yoki oddiy satr
  IB.L = function (value) {
    if (value == null) return "";
    if (typeof value === "string") return value;
    return value[IB.lang] || value.uz || "";
  };

  // HTML ichidagi statik matnlar o'zbekcha yozilgan; boshqa til tanlansa almashtiramiz.
  IB.applyI18n = function (root) {
    if (IB.lang === "uz") return;
    var dict = (window.IB_I18N || {})[IB.lang] || {};
    var scope = root || document;
    function each(attr, fn) {
      scope.querySelectorAll("[" + attr + "]").forEach(function (el) {
        var v = dict[el.getAttribute(attr)];
        if (v != null) fn(el, v);
      });
    }
    each("data-i18n", function (el, v) { el.textContent = v; });
    each("data-i18n-html", function (el, v) { el.innerHTML = v; });
    each("data-i18n-placeholder", function (el, v) { el.setAttribute("placeholder", v); });
    each("data-i18n-aria", function (el, v) { el.setAttribute("aria-label", v); });
    each("data-i18n-content", function (el, v) { el.setAttribute("content", v); });
  };

  /* ------------------------------------------------------------------ */
  /* Yordamchilar                                                         */
  /* ------------------------------------------------------------------ */
  IB.esc = function (s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  };

  // Faqat xavfsiz rasm/havola manzillarini o'tkazamiz (admin kiritgan ma'lumotlar uchun).
  IB.safeUrl = function (u) {
    u = String(u || "").trim();
    if (/^(https?:\/\/|assets\/|\.\/)/i.test(u)) return u;
    if (/^data:image\/(png|jpe?g|webp|gif|avif);base64,/i.test(u)) return u;
    return "";
  };

  IB.qs = function (sel, root) { return (root || document).querySelector(sel); };
  IB.qsa = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  IB.param = function (name) { return new URLSearchParams(location.search).get(name); };

  IB.fmt = {
    num: function (n) {
      return String(Math.round(Number(n) || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    },
    price: function (usd) {
      return "$" + IB.fmt.num(usd);
    },
    uzs: function (usd) {
      var v = (Number(usd) || 0) * C.currency.usdToUzs;
      if (v >= 1e9) return "≈ " + (v / 1e9).toFixed(2).replace(/\.?0+$/, "") + " " + IB.t("unit.bln");
      return "≈ " + IB.fmt.num(v / 1e6) + " " + IB.t("unit.mln");
    },
    km: function (n) {
      return IB.fmt.num(n) + " km";
    },
    date: function (iso) {
      if (!iso) return "";
      var d = new Date(iso + "T00:00:00");
      if (isNaN(d)) return iso;
      var months = IB.t("months").split(",");
      return d.getDate() + " " + months[d.getMonth()] + " " + d.getFullYear();
    },
  };

  /* ------------------------------------------------------------------ */
  /* Ikonlar (inline SVG)                                                 */
  /* ------------------------------------------------------------------ */
  var ICONS = {
    phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.9.6 2.8.7a2 2 0 0 1 1.7 2z"/>',
    telegram: '<path fill="currentColor" stroke="none" d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71L12.6 16.3l-1.99 1.93c-.23.23-.42.42-.83.42z"/>',
    instagram: '<rect x="2.5" y="2.5" width="19" height="19" rx="5.5"/><circle cx="12" cy="12" r="4.2"/><circle cx="17.6" cy="6.4" r="1" fill="currentColor" stroke="none"/>',
    heart: '<path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7z"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h10"/>',
    chevL: '<path d="m15 18-6-6 6-6"/>',
    chevR: '<path d="m9 18 6-6-6-6"/>',
    arrowR: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    arrowUR: '<path d="M7 17 17 7M8 7h9v9"/>',
    gauge: '<path d="m12 14 4-4"/><path d="M3.3 19a10 10 0 1 1 17.4 0"/>',
    calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
    fuel: '<path d="M3 22h12M4 9h10M14 22V4a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v18"/><path d="M14 13h2a2 2 0 0 1 2 2v2a2 2 0 0 0 4 0V9.8a2 2 0 0 0-.6-1.4L18 5"/>',
    gearbox: '<circle cx="5" cy="6" r="2"/><circle cx="12" cy="6" r="2"/><circle cx="19" cy="6" r="2"/><circle cx="5" cy="18" r="2"/><circle cx="12" cy="18" r="2"/><path d="M5 8v8M12 8v8M19 8v3a1 1 0 0 1-1 1H5"/>',
    drive: '<circle cx="6" cy="19" r="3"/><circle cx="18" cy="5" r="3"/><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"/>',
    engine: '<path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/>',
    palette: '<circle cx="13.5" cy="6.5" r="1.2"/><circle cx="17.5" cy="10.5" r="1.2"/><circle cx="8.5" cy="7.5" r="1.2"/><circle cx="6.5" cy="12.5" r="1.2"/><path d="M12 2a10 10 0 0 0 0 20c.9 0 1.5-.8 1.5-1.5 0-.4-.2-.7-.4-1a1.5 1.5 0 0 1 1.1-2.5H16a6 6 0 0 0 6-6c0-5-4.5-9-10-9z"/>',
    car: '<path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/>',
    seat: '<path d="M7 18v3M17 18v3M5 11V6a3 3 0 0 1 3-3h1a3 3 0 0 1 3 3v6h5a3 3 0 0 1 3 3v3H8a3 3 0 0 1-3-3z"/>',
    pin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/>',
    share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    checkCircle: '<circle cx="12" cy="12" r="10"/><path d="m8.5 12 2.5 2.5 4.5-5"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>',
    file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>',
    handshake: '<path d="m11 17 2 2a1 1 0 1 0 3-3"/><path d="m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.9-3.9a3 3 0 0 0-4.2 0l-.9.9a1 1 0 1 1-3-3l2.8-2.8a5.8 5.8 0 0 1 7.1-.9l.5.3a2 2 0 0 0 1.4.3L21 4"/><path d="m21 3 1 11h-2M3 3 2 14l6.5 6.5a1 1 0 1 0 3-3M3 4h8"/>',
    star: '<path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8-6.2-3.2-6.2 3.2L7 14.2 2 9.3l6.9-1z"/>',
    clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
    play: '<path d="M7 4.5v15l12-7.5z" fill="currentColor" stroke="none"/>',
    grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
    list: '<path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01"/>',
    sliders: '<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/>',
    trash: '<path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
    edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    copy: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
    camera: '<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3z"/><circle cx="12" cy="13" r="3"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
    award: '<circle cx="12" cy="8" r="6"/><path d="M15.5 12.9 17 22l-5-3-5 3 1.5-9.1"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>',
    verified: '<path fill="currentColor" stroke="none" d="M12 1.5l2.6 1.9 3.2-.2 1 3 2.7 1.8-.9 3.1.9 3.1-2.7 1.8-1 3-3.2-.2L12 22.5l-2.6-1.9-3.2.2-1-3-2.7-1.8.9-3.1-.9-3.1 2.7-1.8 1-3 3.2.2z"/><path d="m8.5 12 2.5 2.5 4.5-5" stroke="#fff" stroke-width="2.2"/>',
    tag: '<path d="M12.6 2.6A2 2 0 0 0 11.2 2H4a2 2 0 0 0-2 2v7.2a2 2 0 0 0 .6 1.4l8.8 8.8a2 2 0 0 0 2.8 0l7.2-7.2a2 2 0 0 0 0-2.8z"/><circle cx="7.5" cy="7.5" r="1.5"/>',
    message: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
    info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
    wrench: '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.8-3.8a6 6 0 0 1-7.9 7.9l-6.9 6.9a2.1 2.1 0 0 1-3-3l6.9-6.9a6 6 0 0 1 7.9-7.9z"/>',
    megaphone: '<path d="m3 11 18-5v12L3 14z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/>',
    key: '<circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 2-9.6 9.6M15.5 7.5l3 3L22 7l-3-3"/>',
    lock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>',
    refresh: '<path d="M3 12a9 9 0 0 1 15-6.7L21 8M21 3v5h-5M21 12a9 9 0 0 1-15 6.7L3 16M3 21v-5h5"/>',
    external: '<path d="M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
    columns: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M12 3v18"/>',
    sparkle: '<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"/><path d="M19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9z"/>',
    eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    zoom: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5M11 8v6M8 11h6"/>',
    route: '<circle cx="6" cy="19" r="3"/><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"/><circle cx="18" cy="5" r="3"/>',
  };

  IB.icon = function (name, extraClass) {
    return (
      '<svg' + (extraClass ? ' class="' + extraClass + '"' : "") +
      ' viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      (ICONS[name] || "") + "</svg>"
    );
  };

  // HTML ichida <i data-icon="phone"></i> bo'lsa — SVG ga almashtiramiz.
  IB.hydrateIcons = function (root) {
    IB.qsa("[data-icon]", root).forEach(function (el) {
      el.outerHTML = IB.icon(el.getAttribute("data-icon"), el.getAttribute("class"));
    });
  };

  /* ------------------------------------------------------------------ */
  /* Sozlamalar va ro'yxatlar                                             */
  /* ------------------------------------------------------------------ */
  IB.OPTIONS = {
    body: ["suv", "sedan", "pickup", "liftback"],
    fuel: ["petrol", "diesel", "hybrid", "electric"],
    transmission: ["automatic", "manual"],
    drive: ["awd", "4wd", "rwd", "fwd"],
    color: ["black", "white", "silver", "grey", "blue", "green", "beige", "red"],
    condition: ["clean", "partial"],
    status: ["available", "reserved", "sold"],
    features: [
      "leather", "panorama", "sunroof", "massage", "ventSeats", "heatedSeats", "hud", "camera360",
      "adaptiveCruise", "autopilot", "laneAssist", "blindSpot", "keyless", "airSuspension", "premiumAudio",
      "rearScreens", "softClose", "ambient", "matrixLed", "nightVision", "wirelessCharge", "carplay",
      "powerTailgate", "thirdRow", "fridge", "towHitch", "offroad", "carbon", "sportExhaust",
    ],
  };

  /* ------------------------------------------------------------------ */
  /* Mashinalar ma'lumotlari                                              */
  /* ------------------------------------------------------------------ */
  IB.cars = {
    // Demo baza + admin paneldan qo'shilgan/o'zgartirilganlar (localStorage).
    all: function () {
      var map = {};
      var order = [];
      (window.IB_CARS || []).forEach(function (c) {
        map[c.id] = c;
        order.push(c.id);
      });
      IB.store.get("admin:cars", []).forEach(function (c) {
        if (!c || !c.id) return;
        if (!map[c.id]) order.push(c.id);
        map[c.id] = Object.assign({}, c, { _local: true });
      });
      var deleted = IB.store.get("admin:deleted", []);
      return order
        .filter(function (id) { return deleted.indexOf(id) === -1; })
        .map(function (id) { return map[id]; })
        .sort(function (a, b) { return String(b.postedAt || "").localeCompare(String(a.postedAt || "")); });
    },
    get: function (id) {
      return IB.cars.all().filter(function (c) { return c.id === id; })[0] || null;
    },
    forSale: function () {
      return IB.cars.all().filter(function (c) { return c.status !== "sold"; });
    },
    sold: function () {
      return IB.cars
        .all()
        .filter(function (c) { return c.status === "sold"; })
        .sort(function (a, b) { return String(b.soldAt || "").localeCompare(String(a.soldAt || "")); });
    },
    title: function (c) {
      return [c.brand, c.model, c.trim].filter(Boolean).join(" ");
    },
    name: function (c) {
      return [c.model, c.trim].filter(Boolean).join(" ");
    },
    image: function (c, i, small) {
      var src = IB.safeUrl((c.images || [])[i || 0]);
      if (!src) return "assets/img/brand/og-image.jpg";
      if (small && /^assets\/img\/cars\/.+\.webp$/.test(src)) return src.replace(/\.webp$/, "-sm.webp");
      return src;
    },
    url: function (c) {
      return "car.html?id=" + encodeURIComponent(c.id);
    },
    absUrl: function (c) {
      var base = C.siteUrl ? C.siteUrl.replace(/\/$/, "") + "/" : location.href.replace(/[^/]*([?#].*)?$/, "");
      return base + IB.cars.url(c);
    },
    brands: function (list) {
      var counts = {};
      (list || IB.cars.forSale()).forEach(function (c) {
        counts[c.brand] = (counts[c.brand] || 0) + 1;
      });
      return Object.keys(counts)
        .sort(function (a, b) { return counts[b] - counts[a] || a.localeCompare(b); })
        .map(function (b) { return { name: b, count: counts[b] }; });
    },
  };

  /* ------------------------------------------------------------------ */
  /* Sevimlilar                                                           */
  /* ------------------------------------------------------------------ */
  IB.favs = {
    list: function () {
      return IB.store.get("favs", []);
    },
    has: function (id) {
      return IB.favs.list().indexOf(id) > -1;
    },
    toggle: function (id) {
      var list = IB.favs.list();
      var i = list.indexOf(id);
      if (i > -1) list.splice(i, 1);
      else list.unshift(id);
      IB.store.set("favs", list);
      IB.favs.sync();
      document.dispatchEvent(new CustomEvent("ib:favs", { detail: { id: id, active: i === -1 } }));
      return i === -1;
    },
    sync: function () {
      var count = IB.favs.list().filter(function (id) { return IB.cars.get(id); }).length;
      IB.qsa("[data-fav-count]").forEach(function (el) {
        el.textContent = count;
        el.hidden = count === 0;
      });
      IB.qsa("[data-fav]").forEach(function (btn) {
        var on = IB.favs.has(btn.getAttribute("data-fav"));
        btn.classList.toggle("is-active", on);
        btn.setAttribute("aria-pressed", on ? "true" : "false");
        btn.setAttribute("aria-label", IB.t(on ? "fav.remove" : "fav.add"));
      });
    },
  };

  // Har qanday sahifada [data-fav] tugmasi bosilganda ishlaydi.
  document.addEventListener("click", function (e) {
    var btn = e.target.closest && e.target.closest("[data-fav]");
    if (!btn) return;
    e.preventDefault();
    e.stopPropagation();
    var on = IB.favs.toggle(btn.getAttribute("data-fav"));
    btn.classList.remove("pop");
    void btn.offsetWidth;
    btn.classList.add("pop");
    IB.toast(IB.t(on ? "toast.favAdded" : "toast.favRemoved"), "heart");
  });

  /* ------------------------------------------------------------------ */
  /* Aloqa havolalari                                                     */
  /* ------------------------------------------------------------------ */
  IB.links = {
    tel: function (i) {
      return "tel:" + C.phones[i || 0].number;
    },
    tg: function (text) {
      return "https://t.me/" + C.telegram.personal + (text ? "?text=" + encodeURIComponent(text) : "");
    },
    tgChannel: function () {
      return "https://t.me/" + C.telegram.channel;
    },
    ig: function () {
      return "https://www.instagram.com/" + C.instagram + "/";
    },
  };

  IB.copy = function (text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text).then(function () { return true; }, function () { return fallback(); });
    }
    return Promise.resolve(fallback());
    function fallback() {
      try {
        var ta = document.createElement("textarea");
        ta.value = text;
        ta.setAttribute("readonly", "");
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        var ok = document.execCommand("copy");
        ta.remove();
        return ok;
      } catch (e) {
        return false;
      }
    }
  };

  // Telegram'ni tayyor matn bilan ochadi (matn nusxalanadi ham — eski ilovalar uchun).
  IB.openTelegram = function (text) {
    IB.copy(text).then(function (ok) {
      if (ok) IB.toast(IB.t("toast.copiedTg"), "telegram");
    });
    window.open(IB.links.tg(text), "_blank", "noopener");
  };

  IB.carMessage = function (car) {
    return IB.t("msg.car", {
      title: IB.cars.title(car),
      year: car.year,
      price: IB.fmt.price(car.price),
      url: IB.cars.absUrl(car),
    });
  };

  IB.share = function (data) {
    if (navigator.share) {
      navigator.share(data).catch(function () {});
      return;
    }
    IB.copy(data.url).then(function (ok) {
      IB.toast(IB.t(ok ? "toast.linkCopied" : "toast.copyFailed"), "share");
    });
  };

  /* ------------------------------------------------------------------ */
  /* Toast va modal                                                       */
  /* ------------------------------------------------------------------ */
  IB.toast = function (text, icon) {
    var box = IB.qs(".toasts");
    if (!box) {
      box = document.createElement("div");
      box.className = "toasts";
      box.setAttribute("role", "status");
      box.setAttribute("aria-live", "polite");
      document.body.appendChild(box);
    }
    var el = document.createElement("div");
    el.className = "toast";
    el.innerHTML = IB.icon(icon || "checkCircle") + "<span>" + IB.esc(text) + "</span>";
    box.appendChild(el);
    while (box.children.length > 3) box.firstChild.remove();
    setTimeout(function () {
      el.classList.add("is-out");
      setTimeout(function () { el.remove(); }, 320);
    }, 2800);
  };

  var lastFocus = null;
  IB.modal = function (opts) {
    var m = document.createElement("div");
    m.className = "modal";
    m.setAttribute("role", "dialog");
    m.setAttribute("aria-modal", "true");
    m.innerHTML =
      '<div class="modal__box' + (opts.wide ? " modal__box--wide" : "") + '">' +
      '<button class="icon-btn modal__close" type="button" aria-label="' + IB.esc(IB.t("common.close")) + '">' + IB.icon("x") + "</button>" +
      (opts.icon ? '<div class="modal__icon">' + IB.icon(opts.icon) + "</div>" : "") +
      (opts.title ? "<h3>" + IB.esc(opts.title) + "</h3>" : "") +
      (opts.html || "") +
      "</div>";
    document.body.appendChild(m);
    lastFocus = document.activeElement;
    document.body.classList.add("is-locked");
    requestAnimationFrame(function () {
      m.classList.add("is-open");
      var f = m.querySelector("input, select, textarea, .btn, button");
      if (f) f.focus();
    });
    function close() {
      m.classList.remove("is-open");
      document.body.classList.remove("is-locked");
      document.removeEventListener("keydown", onKey);
      setTimeout(function () { m.remove(); }, 260);
      if (lastFocus && lastFocus.focus) lastFocus.focus();
      if (opts.onClose) opts.onClose();
    }
    function onKey(e) {
      if (e.key === "Escape") close();
    }
    m.addEventListener("click", function (e) {
      if (e.target === m || e.target.closest(".modal__close") || e.target.closest("[data-close]")) close();
    });
    document.addEventListener("keydown", onKey);
    return { el: m, close: close };
  };

  /* ------------------------------------------------------------------ */
  /* Mashina kartochkasi                                                  */
  /* ------------------------------------------------------------------ */
  IB.statusBadge = function (status) {
    return '<span class="badge badge--' + IB.esc(status) + '">' + IB.esc(IB.t("status." + status)) + "</span>";
  };

  IB.stamp = function () {
    return '<div class="stamp"><span>' + IB.esc(IB.t("sold.stamp")) + "</span> 🤝</div>";
  };

  IB.carCard = function (car, opts) {
    opts = opts || {};
    var sold = car.status === "sold";
    var isNew = !sold && car.postedAt && (Date.now() - new Date(car.postedAt).getTime()) / 864e5 <= 7;
    var badges = IB.statusBadge(car.status);
    if (car.featured && !sold) badges += '<span class="badge badge--featured">' + IB.esc(IB.t("badge.top")) + "</span>";
    else if (isNew) badges += '<span class="badge badge--new">' + IB.esc(IB.t("badge.new")) + "</span>";
    var sub = sold
      ? IB.t("sold.on", { date: IB.fmt.date(car.soldAt) })
      : car.negotiable
      ? IB.t("price.negotiable")
      : C.currency.showUzs
      ? IB.fmt.uzs(car.price)
      : "";
    return (
      '<article class="card' + (sold ? " is-sold" : "") + (opts.reveal === false ? "" : " reveal") + '">' +
      '<div class="card__media">' +
      '<img src="' + IB.esc(IB.cars.image(car, 0, true)) + '" alt="' + IB.esc(IB.cars.title(car)) + '" loading="lazy" decoding="async" width="720" height="480">' +
      '<div class="card__badges">' + badges + "</div>" +
      (sold ? IB.stamp() : "") +
      '<span class="card__photos">' + IB.icon("camera") + (car.images || []).length + "</span>" +
      "</div>" +
      '<button class="fav-btn card__fav" type="button" data-fav="' + IB.esc(car.id) + '" aria-pressed="false" aria-label="' + IB.esc(IB.t("fav.add")) + '">' + IB.icon("heart") + "</button>" +
      '<div class="card__body">' +
      "<div>" +
      '<div class="card__brand">' + IB.esc(car.brand) + "</div>" +
      '<h3 class="card__title"><a href="' + IB.esc(IB.cars.url(car)) + '">' + IB.esc(IB.cars.name(car)) + "</a></h3>" +
      "</div>" +
      '<div class="card__chips">' +
      '<span class="chip">' + IB.icon("calendar") + IB.esc(car.year) + "</span>" +
      '<span class="chip">' + IB.icon("gauge") + IB.esc(IB.fmt.km(car.mileage)) + "</span>" +
      '<span class="chip">' + IB.icon("fuel") + IB.esc(IB.t("fuel." + car.fuel)) + "</span>" +
      (car.condition === "clean" ? '<span class="chip">' + IB.icon("shield") + IB.esc(IB.t("cond.cleanShort")) + "</span>" : "") +
      "</div>" +
      '<div class="card__foot">' +
      '<div class="price">' + IB.esc(IB.fmt.price(car.price)) + (sub ? "<small>" + IB.esc(sub) + "</small>" : "") + "</div>" +
      '<span class="card__go" aria-hidden="true">' + IB.icon("arrowUR") + "</span>" +
      "</div>" +
      "</div>" +
      "</article>"
    );
  };

  /* ------------------------------------------------------------------ */
  /* Header, drawer, footer, floating tugma                               */
  /* ------------------------------------------------------------------ */
  var NAV = [
    { href: "index.html", key: "nav.home", page: "home" },
    { href: "catalog.html", key: "nav.catalog", page: "catalog" },
    { href: "sold.html", key: "nav.sold", page: "sold" },
    { href: "sell.html", key: "nav.sell", page: "sell" },
    { href: "about.html", key: "nav.about", page: "about" },
    { href: "contact.html", key: "nav.contact", page: "contact" },
  ];
  IB.page = document.body.getAttribute("data-page") || "";

  function renderHeader() {
    var slot = IB.qs("#site-header");
    if (!slot) return;
    var links = NAV.map(function (n) {
      var active = n.page === IB.page;
      return (
        '<li><a class="nav__link' + (active ? " is-active" : "") + '" href="' + n.href + '"' + (active ? ' aria-current="page"' : "") + ">" +
        IB.esc(IB.t(n.key)) + "</a></li>"
      );
    }).join("");
    var drawerLinks = NAV.map(function (n) {
      return '<a href="' + n.href + '"' + (n.page === IB.page ? ' class="is-active" aria-current="page"' : "") + ">" + IB.esc(IB.t(n.key)) + IB.icon("chevR") + "</a>";
    }).join("");
    slot.outerHTML =
      '<header class="header" id="header">' +
      '<div class="container header__inner">' +
      '<a class="header__logo" href="index.html" aria-label="' + IB.esc(C.brand + " — " + IB.t("nav.home")) + '">' +
      '<img src="' + C.logoSmall + '" alt="' + IB.esc(C.brand) + '" width="355" height="110"></a>' +
      '<nav class="nav" aria-label="' + IB.esc(IB.t("nav.label")) + '"><ul class="nav__list">' + links + "</ul></nav>" +
      '<div class="header__actions">' +
      '<div class="lang-switch" role="group" aria-label="' + IB.esc(IB.t("lang.label")) + '">' +
      '<button type="button" data-lang="uz" class="' + (IB.lang === "uz" ? "is-active" : "") + '" aria-pressed="' + (IB.lang === "uz") + '">UZ</button>' +
      '<button type="button" data-lang="ru" class="' + (IB.lang === "ru" ? "is-active" : "") + '" aria-pressed="' + (IB.lang === "ru") + '">RU</button>' +
      "</div>" +
      '<a class="icon-btn" href="favorites.html" aria-label="' + IB.esc(IB.t("nav.favorites")) + '">' + IB.icon("heart") + '<span class="count" data-fav-count hidden>0</span></a>' +
      '<a class="btn btn--gold btn--sm header__call" href="' + IB.links.tel(0) + '" aria-label="' + IB.esc(IB.t("cta.call") + " " + C.phones[0].display) + '">' + IB.icon("phone") + "<span>" + IB.esc(C.phones[0].display) + "</span></a>" +
      '<button class="icon-btn burger" type="button" aria-label="' + IB.esc(IB.t("nav.menu")) + '" aria-expanded="false" aria-controls="drawer">' + IB.icon("menu") + "</button>" +
      "</div></div></header>" +
      '<div class="drawer" id="drawer" aria-hidden="true">' +
      '<div class="drawer__backdrop" data-drawer-close></div>' +
      '<div class="drawer__panel" role="dialog" aria-modal="true" aria-label="' + IB.esc(IB.t("nav.menu")) + '">' +
      '<div class="drawer__head"><img src="' + C.logoSmall + '" alt="' + IB.esc(C.brand) + '" width="355" height="110">' +
      '<button class="icon-btn" type="button" data-drawer-close aria-label="' + IB.esc(IB.t("common.close")) + '">' + IB.icon("x") + "</button></div>" +
      '<nav class="drawer__nav">' + drawerLinks + '<a href="favorites.html">' + IB.esc(IB.t("nav.favorites")) + IB.icon("chevR") + "</a></nav>" +
      '<div class="drawer__foot">' +
      '<a class="btn btn--gold btn--block" href="' + IB.links.tel(0) + '">' + IB.icon("phone") + IB.esc(C.phones[0].display) + "</a>" +
      '<a class="btn btn--tg btn--block" href="' + IB.links.tg() + '" target="_blank" rel="noopener">' + IB.icon("telegram") + IB.esc(IB.t("cta.telegram")) + "</a>" +
      "</div></div></div>";

    var header = IB.qs("#header");
    var drawer = IB.qs("#drawer");
    var burger = IB.qs(".burger");
    function setDrawer(open) {
      drawer.classList.toggle("is-open", open);
      drawer.setAttribute("aria-hidden", open ? "false" : "true");
      burger.setAttribute("aria-expanded", open ? "true" : "false");
      document.body.classList.toggle("is-locked", open);
      if (open) IB.qs("[data-drawer-close].icon-btn", drawer).focus();
      else burger.focus();
    }
    burger.addEventListener("click", function () { setDrawer(true); });
    IB.qsa("[data-drawer-close]", drawer).forEach(function (el) {
      el.addEventListener("click", function () { setDrawer(false); });
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && drawer.classList.contains("is-open")) setDrawer(false);
    });
    IB.qsa("[data-lang]").forEach(function (b) {
      b.addEventListener("click", function () {
        var l = b.getAttribute("data-lang");
        if (l === IB.lang) return;
        IB.store.set("lang", l);
        var url = new URL(location.href);
        url.searchParams.delete("lang");
        location.replace(url.toString());
      });
    });
    var onScroll = function () { header.classList.toggle("is-scrolled", window.scrollY > 8); };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  function renderFooter() {
    var slot = IB.qs("#site-footer");
    if (!slot) return;
    var year = new Date().getFullYear();
    var brands = IB.cars.brands().slice(0, 6).map(function (b) {
      return '<li><a href="catalog.html?brand=' + encodeURIComponent(b.name) + '">' + IB.esc(b.name) + "</a></li>";
    }).join("");
    slot.outerHTML =
      '<footer class="footer">' +
      '<div class="container footer__top">' +
      '<div class="footer__brand">' +
      '<img src="' + C.logo + '" alt="' + IB.esc(C.brand) + '" width="710" height="221" loading="lazy">' +
      "<p>" + IB.esc(IB.t("footer.about", { years: C.experienceYears })) + "</p>" +
      '<div class="socials">' +
      '<a href="' + IB.links.ig() + '" target="_blank" rel="noopener" aria-label="Instagram">' + IB.icon("instagram") + "</a>" +
      '<a href="' + IB.links.tgChannel() + '" target="_blank" rel="noopener" aria-label="' + IB.esc(IB.t("social.tgChannel")) + '">' + IB.icon("telegram") + "</a>" +
      '<a href="' + IB.links.tel(0) + '" aria-label="' + IB.esc(IB.t("cta.call")) + '">' + IB.icon("phone") + "</a>" +
      "</div></div>" +
      "<div><h4>" + IB.esc(IB.t("footer.menu")) + '</h4><ul class="footer__links">' +
      NAV.map(function (n) { return '<li><a href="' + n.href + '">' + IB.esc(IB.t(n.key)) + "</a></li>"; }).join("") +
      '<li><a href="favorites.html">' + IB.esc(IB.t("nav.favorites")) + "</a></li></ul></div>" +
      "<div><h4>" + IB.esc(IB.t("footer.brands")) + '</h4><ul class="footer__links">' + brands + "</ul></div>" +
      "<div><h4>" + IB.esc(IB.t("footer.contacts")) + '</h4><ul class="footer__links">' +
      C.phones.map(function (p) { return '<li><a href="tel:' + p.number + '">' + IB.esc(p.display) + "</a></li>"; }).join("") +
      '<li><a href="' + IB.links.tg() + '" target="_blank" rel="noopener">@' + IB.esc(C.telegram.personal) + "</a></li>" +
      '<li><a href="' + IB.links.ig() + '" target="_blank" rel="noopener">@' + IB.esc(C.instagram) + "</a></li>" +
      "<li>" + IB.esc(IB.L(C.workHours)) + "</li>" +
      "<li>" + IB.esc(IB.L(C.city)) + "</li>" +
      "</ul></div>" +
      "</div>" +
      '<div class="container footer__bottom">' +
      "<span>© " + year + " " + IB.esc(C.brand) + ". " + IB.esc(IB.t("footer.rights")) + "</span>" +
      (C.demo.enabled
        ? '<span class="demo-note">' + IB.esc(IB.t("footer.demo")) + ' · <a href="admin.html">' + IB.esc(IB.t("footer.admin")) + "</a></span>"
        : "") +
      "</div></footer>";
  }

  function renderFab() {
    if (IB.page === "admin") return;
    var fab = document.createElement("div");
    fab.className = "fab";
    fab.innerHTML =
      '<div class="fab__list" id="fab-list">' +
      '<a class="fab__item" href="' + IB.links.tg() + '" target="_blank" rel="noopener">Telegram<i style="background:#229ed9">' + IB.icon("telegram") + "</i></a>" +
      '<a class="fab__item" href="' + IB.links.tel(0) + '">' + IB.esc(IB.t("cta.call")) + '<i style="background:#1f9d55">' + IB.icon("phone") + "</i></a>" +
      '<a class="fab__item" href="' + IB.links.ig() + '" target="_blank" rel="noopener">Instagram<i style="background:linear-gradient(45deg,#fd5949,#d6249f,#285aeb)">' + IB.icon("instagram") + "</i></a>" +
      "</div>" +
      '<button class="fab__main" type="button" aria-expanded="false" aria-controls="fab-list" aria-label="' + IB.esc(IB.t("fab.label")) + '">' + IB.icon("plus") + "</button>";
    document.body.appendChild(fab);
    var btn = fab.querySelector(".fab__main");
    btn.addEventListener("click", function () {
      var open = !fab.classList.contains("is-open");
      fab.classList.toggle("is-open", open);
      btn.setAttribute("aria-expanded", open ? "true" : "false");
    });
    document.addEventListener("click", function (e) {
      if (!fab.contains(e.target)) {
        fab.classList.remove("is-open");
        btn.setAttribute("aria-expanded", "false");
      }
    });
  }

  /* ------------------------------------------------------------------ */
  /* Scroll animatsiyasi                                                  */
  /* ------------------------------------------------------------------ */
  var revealObserver =
    "IntersectionObserver" in window
      ? new IntersectionObserver(
          function (entries) {
            entries.forEach(function (en) {
              if (en.isIntersecting) {
                en.target.classList.add("is-visible");
                revealObserver.unobserve(en.target);
              }
            });
          },
          { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
        )
      : null;
  IB.reveal = function (root) {
    IB.qsa(".reveal:not(.is-visible)", root).forEach(function (el) {
      if (revealObserver) revealObserver.observe(el);
      else el.classList.add("is-visible");
    });
  };

  /* ------------------------------------------------------------------ */
  /* Shakllar uchun telefon maskasi: +998 (90) 123-45-67                  */
  /* ------------------------------------------------------------------ */
  IB.phoneMask = function (input) {
    function format(v) {
      var d = v.replace(/\D/g, "");
      if (d.indexOf("998") !== 0) d = "998" + d.replace(/^998?/, "");
      d = d.slice(0, 12);
      var p = d.slice(3);
      var out = "+998";
      if (p.length) out += " (" + p.slice(0, 2);
      if (p.length >= 2) out += ")";
      if (p.length > 2) out += " " + p.slice(2, 5);
      if (p.length > 5) out += "-" + p.slice(5, 7);
      if (p.length > 7) out += "-" + p.slice(7, 9);
      return out;
    }
    input.addEventListener("focus", function () { if (!input.value) input.value = "+998 "; });
    input.addEventListener("input", function () { input.value = format(input.value); });
    input.addEventListener("blur", function () { if (input.value.replace(/\D/g, "") === "998") input.value = ""; });
  };
  IB.phoneValid = function (v) {
    return /^998\d{9}$/.test(String(v || "").replace(/\D/g, ""));
  };

  /* ------------------------------------------------------------------ */
  /* Ishga tushirish                                                      */
  /* ------------------------------------------------------------------ */
  renderHeader();
  renderFooter();
  renderFab();
  IB.hydrateIcons();
  IB.applyI18n();
  IB.favs.sync();
  IB.reveal();
})();
