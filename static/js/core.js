/*
 * Umumiy yadro: til, saqlash, formatlash, ikonlar, sevimlilar, toast, modal,
 * ulashish, header/drawer/fab xatti-harakatlari.
 * HTML (header, footer, mashina kartochkalari) Django shablonlarida server tomonda chiziladi.
 */
(function () {
  "use strict";

  var IB = (window.IB = window.IB || {});
  var BODY = document.body;
  IB.tgUser = BODY.getAttribute("data-tg") || "";
  IB.page = BODY.getAttribute("data-page") || "";

  /* Saqlash (localStorage — xatolarga chidamli) */
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

  /* Til (uz / ru) */
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

  IB.esc = function (s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  };
  IB.qs = function (sel, root) { return (root || document).querySelector(sel); };
  IB.qsa = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  IB.param = function (name) { return new URLSearchParams(location.search).get(name); };

  IB.fmt = {
    num: function (n) {
      return String(Math.round(Number(n) || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    },
    price: function (usd) { return "$" + IB.fmt.num(usd); },
    km: function (n) { return IB.fmt.num(n) + " km"; },
    date: function (iso) {
      var d = new Date(iso + "T00:00:00");
      if (isNaN(d)) return iso;
      var months = IB.t("months").split(",");
      return d.getDate() + " " + months[d.getMonth()] + " " + d.getFullYear();
    },
  };

  // Server uz tilida chizadi; boshqa til tanlansa matnlarni almashtiramiz.
  IB.applyI18n = function (root) {
    var scope = root || document;
    // Ikki tilli ma'lumotlar (masalan, mashina tavsifi): <p data-l="uz">, <p data-l="ru" hidden>
    IB.qsa("[data-l]", scope).forEach(function (el) {
      var show = el.getAttribute("data-l") === IB.lang;
      var fallback = !scope.querySelector('[data-l="' + IB.lang + '"]:not(:empty)');
      el.hidden = !(show || (fallback && el.getAttribute("data-l") === "uz"));
    });
    if (IB.lang === "uz") return;
    var dict = (window.IB_I18N || {})[IB.lang] || {};
    function each(attr, fn) {
      IB.qsa("[" + attr + "]", scope).forEach(function (el) {
        var v = dict[el.getAttribute(attr)];
        if (v != null) fn(el, v);
      });
    }
    each("data-i18n", function (el, v) {
      // {years} kabi o'zgaruvchilar data-years="16" dan olinadi
      el.textContent = v.replace(/\{(\w+)\}/g, function (m, k) {
        var a = el.getAttribute("data-" + k);
        return a != null ? a : m;
      });
    });
    each("data-i18n-html", function (el, v) { el.innerHTML = v; });
    each("data-i18n-placeholder", function (el, v) { el.setAttribute("placeholder", v); });
    each("data-i18n-aria", function (el, v) { el.setAttribute("aria-label", v); });
    each("data-i18n-content", function (el, v) { el.setAttribute("content", v); });
    IB.qsa("time[data-fmt='date']", scope).forEach(function (el) {
      el.textContent = IB.fmt.date(el.getAttribute("datetime"));
    });
    IB.qsa("[data-unit]", scope).forEach(function (el) {
      el.textContent = IB.t("unit." + el.getAttribute("data-unit"));
    });
  };

  /* Ikonlar (inline SVG) */
  var ICONS = {
    carSedan: '<path d="M2.5 16.5V13l3-1.2 3-3.3h6.5l3.3 3.3 3.2.9v3.8"/><path d="M8.2 11.8h10.3"/><circle cx="6.5" cy="16.5" r="2"/><circle cx="17.5" cy="16.5" r="2"/><path d="M2.5 16.5h2M8.5 16.5h7M19.5 16.5h2"/>',
    carSuv: '<path d="M2.5 16.5v-5l2-.8 1.6-4.2h11.2l2.7 4.4 1.5.6v5"/><path d="M4.6 10.7h15.2M12 6.5v4.2"/><circle cx="6.5" cy="16.5" r="2"/><circle cx="17.5" cy="16.5" r="2"/><path d="M2.5 16.5h2M8.5 16.5h7M19.5 16.5h2"/>',
    carPickup: '<path d="M2.5 16.5v-4h8.2V8h4.8l3 4.2 3 .6v3.7"/><path d="M10.7 12.5h7.8"/><circle cx="6.5" cy="16.5" r="2"/><circle cx="17.5" cy="16.5" r="2"/><path d="M2.5 16.5h2M8.5 16.5h7M19.5 16.5h2"/>',
    carVan: '<path d="M2.5 16.5V11l3.8-4.5h12.4l2.8 4.5v5.5"/><path d="M6.3 11h15.2M12.5 6.5V11"/><circle cx="6.5" cy="16.5" r="2"/><circle cx="17.5" cy="16.5" r="2"/><path d="M2.5 16.5h2M8.5 16.5h7M19.5 16.5h2"/>',
    carHatch: '<path d="M2.5 16.5V13l3-1.2 3.5-3.8h6.3l3.7 4.3 2.5.8v3.4"/><path d="M8.6 11.8h9.6"/><circle cx="6.5" cy="16.5" r="2"/><circle cx="17.5" cy="16.5" r="2"/><path d="M2.5 16.5h2M8.5 16.5h7M19.5 16.5h2"/>',
    carLiftback: '<path d="M2.5 16.5V13l3-1.2 3.4-3.3h5.6l5 3.5 2 .5v4"/><path d="M8.5 11.8h10"/><circle cx="6.5" cy="16.5" r="2"/><circle cx="17.5" cy="16.5" r="2"/><path d="M2.5 16.5h2M8.5 16.5h7M19.5 16.5h2"/>',
    carCoupe: '<path d="M2.5 16.5v-2.6l4-1.6 4-3h4.6l4 3.3 2.4.7v3.2"/><path d="M9.8 12.3h8.6"/><circle cx="6.5" cy="16.5" r="2"/><circle cx="17.5" cy="16.5" r="2"/><path d="M2.5 16.5h2M8.5 16.5h7M19.5 16.5h2"/>',
    bolt: '<path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/>',
    leaf: '<path d="M5 20c0-8.5 5.5-15 15-15 0 9.5-6 15-14 15"/><path d="M5 20c2.5-4 5.5-6.8 9.5-9"/>',
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

  /* Toast va modal */
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


  /* Sevimlilar (brauzerda saqlanadi — akkaunt kerak emas; ID = mashina slug'i) */
  IB.favs = {
    list: function () { return IB.store.get("favs", []); },
    has: function (id) { return IB.favs.list().indexOf(id) > -1; },
    set: function (list) { IB.store.set("favs", list); IB.favs.sync(); },
    toggle: function (id) {
      var list = IB.favs.list();
      var i = list.indexOf(id);
      if (i > -1) list.splice(i, 1);
      else list.unshift(id);
      IB.favs.set(list);
      document.dispatchEvent(new CustomEvent("ib:favs", { detail: { id: id, active: i === -1 } }));
      return i === -1;
    },
    sync: function () {
      var count = IB.favs.list().length;
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

  /* Telegram / ulashish */
  IB.tgLink = function (text) {
    return "https://t.me/" + IB.tgUser + (text ? "?text=" + encodeURIComponent(text) : "");
  };
  // Telegram'ni tayyor matn bilan ochadi (matn nusxalanadi ham — eski ilovalar uchun).
  IB.openTelegram = function (text) {
    IB.copy(text).then(function (ok) {
      if (ok) IB.toast(IB.t("toast.copiedTg"), "telegram");
    });
    window.open(IB.tgLink(text), "_blank", "noopener");
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
  // Telegram havolalari: <a data-tg-text="msg.hello"> yoki data-tg-text-raw
  function hydrateTelegramLinks() {
    IB.qsa("[data-tg-key]").forEach(function (a) {
      a.href = IB.tgLink(IB.t(a.getAttribute("data-tg-key")));
    });
  }

  /* Header: drawer, til almashtirgich, scroll */
  function initHeader() {
    var header = IB.qs("#header");
    var drawer = IB.qs("#drawer");
    var burger = IB.qs(".burger");
    if (!header || !drawer || !burger) return;
    function setDrawer(open) {
      drawer.classList.toggle("is-open", open);
      drawer.setAttribute("aria-hidden", open ? "false" : "true");
      burger.setAttribute("aria-expanded", open ? "true" : "false");
      BODY.classList.toggle("is-locked", open);
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
    IB.qsa("button[data-lang]").forEach(function (b) {
      var on = b.getAttribute("data-lang") === IB.lang;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", on ? "true" : "false");
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

  /* Suzuvchi aloqa tugmasi */
  function initFab() {
    var fab = IB.qs(".fab");
    if (!fab) return;
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

  /* Scroll animatsiyasi */
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

  /* Telefon maskasi: +998 (90) 123-45-67 */
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

  /* Raqamlar sanab chiqadi: <span data-count="22"> */
  IB.counters = function () {
    function run(el) {
      var target = Number(el.getAttribute("data-count")) || 0;
      var start = performance.now();
      (function tick(now) {
        var p = Math.min(1, (now - start) / 1200);
        el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(tick);
      })(start);
    }
    var els = IB.qsa("[data-count]");
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { run(en.target); io.unobserve(en.target); }
        });
      });
      els.forEach(function (el) { io.observe(el); });
    } else {
      els.forEach(function (el) { el.textContent = el.getAttribute("data-count"); });
    }
  };

  /* Ishga tushirish */
  IB.hydrate = function (root) {
    IB.hydrateIcons(root);
    IB.applyI18n(root);
    IB.favs.sync();
    IB.reveal(root);
  };
  initHeader();
  initFab();
  IB.hydrate();
  hydrateTelegramLinks();
})();
