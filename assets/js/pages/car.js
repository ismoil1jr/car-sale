/* Mashina sahifasi: galereya, xususiyatlar, aloqa, o'xshash mashinalar */
(function () {
  "use strict";
  var t = IB.t;
  var C = IB.config;
  var root = IB.qs("#car-root");
  var id = IB.param("id");
  var car = id ? IB.cars.get(id) : null;

  if (!car) {
    document.title = t("car.notFoundTitle") + " — " + C.brand;
    root.innerHTML =
      '<div class="empty" style="margin:24px 0 64px"><div class="empty__icon">' + IB.icon("handshake") + "</div>" +
      "<h3>" + IB.esc(t("car.notFoundTitle")) + "</h3><p>" + IB.esc(t("car.notFoundText")) + "</p>" +
      '<a class="btn btn--gold" href="catalog.html">' + IB.esc(t("hero.cta")) + "</a></div>";
    return;
  }

  var sold = car.status === "sold";
  var title = IB.cars.title(car);
  var images = (car.images || []).map(IB.safeUrl).filter(Boolean);
  if (!images.length) images = [IB.cars.image(car, 0)];
  var desc = IB.L(car.description);

  // --- Meta teglar (ulashganda chiroyli ko'rinishi uchun) ---
  document.title = title + " " + car.year + " — " + IB.fmt.price(car.price) + " | " + C.brand;
  var metaDesc = [title, car.year, IB.fmt.km(car.mileage), IB.fmt.price(car.price)].join(", ") + ". " + desc.split("\n")[0];
  setMeta('meta[name="description"]', metaDesc);
  setMeta('meta[property="og:title"]', title + " " + car.year + " — " + IB.fmt.price(car.price));
  setMeta('meta[property="og:image"]', images[0]);
  function setMeta(sel, value) {
    var el = IB.qs(sel);
    if (el) el.setAttribute("content", value);
  }

  IB.qs("#crumbs").insertAdjacentHTML("beforeend", '<span aria-hidden="true">/</span><span aria-current="page">' + IB.esc(title) + "</span>");

  // --- Xususiyatlar jadvali ---
  var specs = [
    ["calendar", t("spec.year"), car.year + (car.regYear && car.regYear !== car.year ? " · " + t("spec.reg", { y: car.regYear }) : "")],
    ["gauge", t("spec.mileage"), IB.fmt.km(car.mileage)],
    ["engine", t("spec.engine"), car.engine],
    ["sparkle", t("spec.power"), car.power ? car.power + " " + t("unit.hp") : ""],
    ["fuel", t("spec.fuel"), t("fuel." + car.fuel)],
    ["gearbox", t("spec.transmission"), t("transmission." + car.transmission)],
    ["route", t("spec.drive"), t("drive." + car.drive)],
    ["car", t("spec.body"), t("body." + car.body)],
    ["palette", t("spec.color"), t("color." + car.color)],
    ["seat", t("spec.seats"), car.seats],
    ["shield", t("spec.condition"), t("cond." + car.condition)],
    ["clock", t("spec.posted"), IB.fmt.date(car.postedAt)],
  ].filter(function (r) { return r[2] !== "" && r[2] != null; });

  var specsHtml = specs.map(function (r) {
    return '<div class="spec"><span class="spec__icon">' + IB.icon(r[0]) + "</span><div><dt>" + IB.esc(r[1]) + "</dt><dd>" + IB.esc(r[2]) + "</dd></div></div>";
  }).join("");

  var featuresHtml = (car.features || []).map(function (f) {
    return "<li>" + IB.icon("checkCircle") + IB.esc(t("feat." + f)) + "</li>";
  }).join("");

  var priceSub = sold
    ? IB.fmt.date(car.soldAt)
    : [C.currency.showUzs ? IB.fmt.uzs(car.price) : "", car.negotiable ? t("price.negotiable") : t("price.fixed")].filter(Boolean).join(" · ");

  var thumbs = images.length > 1
    ? '<div class="gallery__thumbs" role="tablist" aria-label="' + IB.esc(t("car.photos")) + '">' +
      images.map(function (src, i) {
        return '<button class="gallery__thumb' + (i === 0 ? " is-active" : "") + '" type="button" role="tab" data-i="' + i + '" aria-label="' + IB.esc(t("car.photoN", { n: i + 1 })) + '" aria-selected="' + (i === 0) + '">' +
          '<img src="' + IB.esc(small(src)) + '" alt="" loading="lazy"></button>';
      }).join("") + "</div>"
    : "";
  function small(src) {
    return /^assets\/img\/cars\/.+\.webp$/.test(src) ? src.replace(/\.webp$/, "-sm.webp") : src;
  }

  var actions = sold
    ? '<a class="btn btn--gold btn--lg btn--block" href="contact.html?type=find&car=' + encodeURIComponent(car.id) + '">' + IB.icon("search") + IB.esc(t("car.findSimilar")) + "</a>" +
      '<button class="btn btn--tg btn--lg btn--block" type="button" data-action="tg">' + IB.icon("telegram") + IB.esc(t("cta.telegram")) + "</button>"
    : '<a class="btn btn--gold btn--lg btn--block" href="' + IB.links.tel(0) + '">' + IB.icon("phone") + IB.esc(t("cta.call")) + " · " + IB.esc(C.phones[0].display) + "</a>" +
      '<button class="btn btn--tg btn--lg btn--block" type="button" data-action="tg">' + IB.icon("telegram") + IB.esc(t("car.askTelegram")) + "</button>";

  root.innerHTML =
    '<div class="car-layout">' +
    '<div class="car-gallery">' +
    '<div class="gallery">' +
    '<div class="gallery__main" id="g-main" tabindex="0" aria-roledescription="carousel" aria-label="' + IB.esc(t("car.photos")) + '">' +
    '<img id="g-img" src="' + IB.esc(images[0]) + '" alt="' + IB.esc(title) + '" width="1600" height="1067">' +
    (sold ? IB.stamp() : "") +
    (images.length > 1
      ? '<button class="gallery__arrow gallery__arrow--prev" type="button" data-step="-1" aria-label="' + IB.esc(t("common.prev")) + '">' + IB.icon("chevL") + "</button>" +
        '<button class="gallery__arrow gallery__arrow--next" type="button" data-step="1" aria-label="' + IB.esc(t("common.next")) + '">' + IB.icon("chevR") + "</button>"
      : "") +
    '<span class="gallery__counter" id="g-counter">1 / ' + images.length + "</span>" +
    '<span class="btn btn--sm gallery__zoom" aria-hidden="true">' + IB.icon("zoom") + IB.esc(t("car.zoom")) + "</span>" +
    "</div>" +
    thumbs +
    '<p class="photo-credit" id="g-credit"></p>' +
    "</div>" +
    "</div>" +
    '<aside class="car-aside">' +
    '<div class="panel">' +
    '<div class="car-aside__top">' + IB.statusBadge(car.status) +
    '<div style="display:flex;gap:8px">' +
    '<button class="fav-btn" type="button" data-fav="' + IB.esc(car.id) + '" aria-pressed="false" aria-label="' + IB.esc(t("fav.add")) + '">' + IB.icon("heart") + "</button>" +
    '<button class="fav-btn" type="button" data-action="share" aria-label="' + IB.esc(t("cta.share")) + '">' + IB.icon("share") + "</button>" +
    "</div></div>" +
    "<h1>" + IB.esc(title) + "</h1>" +
    '<p class="car-sub">' + IB.esc([car.year, IB.fmt.km(car.mileage), IB.L(C.city)].join(" · ")) + "</p>" +
    '<div class="car-price"><div class="price">' + (sold ? IB.esc(t("sold.stamp")) + " 🤝" : IB.esc(IB.fmt.price(car.price))) + "<small>" + IB.esc(priceSub) + "</small></div></div>" +
    '<dl class="car-quick">' +
    "<div><dt>" + IB.esc(t("spec.year")) + "</dt><dd>" + IB.esc(car.year) + "</dd></div>" +
    "<div><dt>" + IB.esc(t("spec.mileage")) + "</dt><dd>" + IB.esc(IB.fmt.km(car.mileage)) + "</dd></div>" +
    "<div><dt>" + IB.esc(t("spec.engine")) + "</dt><dd>" + IB.esc(car.engine || "—") + "</dd></div>" +
    "<div><dt>" + IB.esc(t("spec.condition")) + "</dt><dd>" + IB.esc(t("cond." + car.condition + "Short")) + "</dd></div>" +
    "</dl>" +
    '<div class="car-actions">' + actions +
    '<div class="car-actions__row">' +
    '<a class="btn" href="' + IB.esc(IB.safeUrl(car.video) || IB.links.ig()) + '" target="_blank" rel="noopener">' + IB.icon("play") + IB.esc(t("car.video")) + "</a>" +
    '<button class="btn" type="button" data-action="share">' + IB.icon("share") + IB.esc(t("cta.share")) + "</button>" +
    "</div></div>" +
    "</div>" +
    '<div class="panel seller">' +
    '<span class="seller__avatar"><img src="assets/img/brand/icon-192.png" alt=""></span>' +
    "<div><b>" + IB.esc(C.owner + " · " + C.brand) + IB.icon("verified") + "</b><span>" + IB.esc(t("car.seller", { years: C.experienceYears })) + "</span></div>" +
    "</div>" +
    "</aside>" +
    '<div class="car-details">' +
    '<section class="car-section"><h2>' + IB.esc(t("car.specs")) + '</h2><dl class="specs">' + specsHtml + "</dl></section>" +
    (desc ? '<section class="car-section"><h2>' + IB.esc(t("car.description")) + '</h2><p class="description">' + IB.esc(desc) + "</p></section>" : "") +
    (featuresHtml ? '<section class="car-section"><h2>' + IB.esc(t("car.features")) + '</h2><ul class="feature-list">' + featuresHtml + "</ul></section>" : "") +
    '<section class="car-section"><div class="notice">' + IB.icon("info") + "<p>" + IB.esc(t(sold ? "car.soldNotice" : "car.notice")) + "</p></div></section>" +
    "</div>" +
    "</div>";

  // --- Galereya ---
  var current = 0;
  var img = IB.qs("#g-img");
  var counter = IB.qs("#g-counter");
  var credit = IB.qs("#g-credit");
  function show(i) {
    current = (i + images.length) % images.length;
    img.style.opacity = "0.35";
    var next = new Image();
    next.onload = next.onerror = function () {
      img.src = images[current];
      img.style.opacity = "1";
    };
    next.src = images[current];
    counter.textContent = current + 1 + " / " + images.length;
    IB.qsa(".gallery__thumb").forEach(function (th, k) {
      th.classList.toggle("is-active", k === current);
      th.setAttribute("aria-selected", k === current ? "true" : "false");
      if (k === current) th.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
    });
    showCredit();
    if (lb.classList.contains("is-open")) updateLightbox();
  }
  function showCredit() {
    var file = images[current].split("/").pop();
    var c = (window.IB_PHOTO_CREDITS || {})[file];
    credit.innerHTML = c
      ? IB.esc(t("car.photoCredit")) + ": " + IB.esc(c.author || "—") + " · " + IB.esc(c.license) + ' · <a href="' + IB.esc(IB.safeUrl(c.source)) + '" target="_blank" rel="noopener">Wikimedia Commons</a>'
      : "";
  }
  showCredit();

  var main = IB.qs("#g-main");
  main.addEventListener("click", function (e) {
    var step = e.target.closest("[data-step]");
    if (step) return show(current + Number(step.getAttribute("data-step")));
    openLightbox();
  });
  main.addEventListener("keydown", function (e) {
    if (e.key === "ArrowLeft") show(current - 1);
    if (e.key === "ArrowRight") show(current + 1);
    if (e.key === "Enter") openLightbox();
  });
  IB.qsa(".gallery__thumb").forEach(function (th) {
    th.addEventListener("click", function () { show(Number(th.getAttribute("data-i"))); });
  });
  swipe(main, function (dir) { show(current + dir); });

  function swipe(el, cb) {
    var x0 = null;
    var y0 = null;
    el.addEventListener("touchstart", function (e) { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }, { passive: true });
    el.addEventListener("touchend", function (e) {
      if (x0 == null) return;
      var dx = e.changedTouches[0].clientX - x0;
      var dy = e.changedTouches[0].clientY - y0;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) cb(dx < 0 ? 1 : -1);
      x0 = null;
    });
  }

  // --- Lightbox (to'liq ekran) ---
  var lb = document.createElement("div");
  lb.className = "lightbox";
  lb.setAttribute("role", "dialog");
  lb.setAttribute("aria-modal", "true");
  lb.setAttribute("aria-label", t("car.photos"));
  lb.innerHTML =
    '<span class="lightbox__counter"></span>' +
    '<button class="icon-btn lightbox__close" type="button" aria-label="' + IB.esc(t("common.close")) + '">' + IB.icon("x") + "</button>" +
    (images.length > 1
      ? '<button class="gallery__arrow gallery__arrow--prev" type="button" data-step="-1" aria-label="' + IB.esc(t("common.prev")) + '">' + IB.icon("chevL") + "</button>" +
        '<button class="gallery__arrow gallery__arrow--next" type="button" data-step="1" aria-label="' + IB.esc(t("common.next")) + '">' + IB.icon("chevR") + "</button>"
      : "") +
    '<img alt="">';
  document.body.appendChild(lb);
  var lbImg = lb.querySelector("img");
  function updateLightbox() {
    lbImg.src = images[current];
    lbImg.alt = title + " — " + (current + 1);
    lb.querySelector(".lightbox__counter").textContent = current + 1 + " / " + images.length;
  }
  function openLightbox() {
    updateLightbox();
    lb.classList.add("is-open");
    document.body.classList.add("is-locked");
    lb.querySelector(".lightbox__close").focus();
  }
  function closeLightbox() {
    lb.classList.remove("is-open");
    document.body.classList.remove("is-locked");
    main.focus();
  }
  lb.addEventListener("click", function (e) {
    var step = e.target.closest("[data-step]");
    if (step) return show(current + Number(step.getAttribute("data-step")));
    if (e.target === lb || e.target.closest(".lightbox__close")) closeLightbox();
  });
  document.addEventListener("keydown", function (e) {
    if (!lb.classList.contains("is-open")) return;
    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowLeft") show(current - 1);
    if (e.key === "ArrowRight") show(current + 1);
  });
  swipe(lb, function (dir) { show(current + dir); });

  // --- Tugmalar: Telegram, ulashish ---
  document.addEventListener("click", function (e) {
    var a = e.target.closest("[data-action]");
    if (!a) return;
    var action = a.getAttribute("data-action");
    if (action === "tg") IB.openTelegram(sold ? t("msg.findSimilar", { title: title + " " + car.year }) : IB.carMessage(car));
    if (action === "share") IB.share({ title: title, text: title + " " + car.year + " — " + IB.fmt.price(car.price), url: IB.cars.absUrl(car) });
  });

  // --- Mobil pastki panel ---
  if (!sold) {
    var bar = document.createElement("div");
    bar.className = "mobile-bar";
    bar.innerHTML =
      '<div class="price">' + IB.esc(IB.fmt.price(car.price)) + "</div>" +
      '<a class="btn btn--gold" href="' + IB.links.tel(0) + '" aria-label="' + IB.esc(t("cta.call")) + '">' + IB.icon("phone") + "<span>" + IB.esc(t("cta.callShort")) + "</span></a>" +
      '<button class="btn btn--tg" type="button" data-action="tg" aria-label="Telegram">' + IB.icon("telegram") + "<span>Telegram</span></button>";
    document.body.appendChild(bar);
    document.body.classList.add("has-mobile-bar");
  }

  // --- O'xshash mashinalar ---
  var similar = IB.cars.forSale()
    .filter(function (c) { return c.id !== car.id; })
    .map(function (c) {
      var score = 0;
      if (c.body === car.body) score += 2;
      if (c.brand === car.brand) score += 2;
      score += Math.max(0, 3 - Math.abs(c.price - car.price) / (car.price * 0.2));
      return { c: c, score: score };
    })
    .sort(function (a, b) { return b.score - a.score; })
    .slice(0, 3)
    .map(function (x) { return x.c; });
  if (similar.length) {
    IB.qs("#similar").innerHTML = similar.map(function (c) { return IB.carCard(c); }).join("");
    IB.qs("#similar-section").hidden = false;
  }

  // --- Google uchun tuzilgan ma'lumot (schema.org/Car) ---
  var ld = document.createElement("script");
  ld.type = "application/ld+json";
  ld.textContent = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Car",
    name: title,
    brand: { "@type": "Brand", name: car.brand },
    model: car.model,
    vehicleModelDate: String(car.year),
    mileageFromOdometer: { "@type": "QuantitativeValue", value: car.mileage, unitCode: "KMT" },
    fuelType: t("fuel." + car.fuel),
    vehicleTransmission: t("transmission." + car.transmission),
    color: t("color." + car.color),
    image: images.filter(function (s) { return !/^data:/.test(s); }),
    description: desc,
    offers: {
      "@type": "Offer",
      price: car.price,
      priceCurrency: "USD",
      availability: sold ? "https://schema.org/SoldOut" : "https://schema.org/InStock",
      seller: { "@type": "AutoDealer", name: C.brand },
    },
  });
  document.head.appendChild(ld);

  IB.favs.sync();
  IB.reveal();
})();
