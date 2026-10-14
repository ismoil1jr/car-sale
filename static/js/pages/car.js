/* Mashina sahifasi: galereya, lightbox, Telegram va ulashish tugmalari.
 * Mashina ma'lumotlari Django shablonida chiziladi; bu yerda faqat interaktivlik. */
(function () {
  "use strict";
  var t = IB.t;
  var data = JSON.parse(IB.qs("#car-data").textContent);
  var title = data.title;
  var sold = data.sold;

  var items = IB.qsa("#g-data li");
  var images = items.map(function (li) { return li.getAttribute("data-src"); });
  if (!images.length) images = [IB.qs("#g-img").getAttribute("src")];

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
    var li = items[current];
    var author = li && li.getAttribute("data-author");
    var license = li && li.getAttribute("data-license");
    var source = li && li.getAttribute("data-source");
    if (!li || !(author || license || source)) { credit.textContent = ""; return; }
    credit.innerHTML = IB.esc(t("car.photoCredit")) + ": " + IB.esc(author || "—") +
      (license ? " · " + IB.esc(license) : "") +
      (source ? ' · <a href="' + IB.esc(source) + '" target="_blank" rel="noopener">Wikimedia Commons</a>' : "");
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
    var fullTitle = title + " " + data.year;
    if (action === "tg") {
      IB.openTelegram(sold
        ? t("msg.findSimilar", { title: fullTitle })
        : t("msg.car", { title: title, year: data.year, price: IB.fmt.price(data.price), url: location.href }));
    }
    if (action === "share") {
      IB.share({ title: title, text: fullTitle + " — " + IB.fmt.price(data.price), url: location.href });
    }
  });

  if (IB.qs(".mobile-bar")) document.body.classList.add("has-mobile-bar");
})();
