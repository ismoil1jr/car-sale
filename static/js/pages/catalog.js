/* Katalog: filtrlash serverda (GET parametrlari); bu yerda faqat qulayliklar. */
(function () {
  "use strict";

  // --- Filtr o'zgarishi bilan avtomatik yuborish ---
  var timer;
  IB.qsa("[data-filter-form]").forEach(function (form) {
    form.addEventListener("change", function (e) {
      var el = e.target;
      if (el.classList && el.closest(".filter-chip")) el.closest(".filter-chip").classList.toggle("is-active", el.checked);
      // Mobil oynada "Ko'rsatish" tugmasi bilan yuboriladi
      if (form.id === "filters-mobile") return;
      form.requestSubmit();
    });
    form.addEventListener("input", function (e) {
      var el = e.target;
      if (form.id === "filters-mobile" || !(el.type === "search" || el.type === "number")) return;
      clearTimeout(timer);
      timer = setTimeout(function () { form.requestSubmit(); }, 600);
    });
    // Bo'sh maydonlar URL'ga tushmasin
    form.addEventListener("submit", function () {
      IB.qsa("input, select", form).forEach(function (el) {
        if (el.type !== "checkbox" && el.value === "") el.disabled = true;
      });
    });
  });

  // --- Saralash ---
  IB.qs("#sort").addEventListener("change", function (e) {
    var url = new URL(location.href);
    if (e.target.value === "new") url.searchParams.delete("sort");
    else url.searchParams.set("sort", e.target.value);
    location.href = url.toString();
  });

  // --- Ko'rinish: to'r / ro'yxat ---
  var grid = IB.qs("#results");
  function setView(v) {
    grid.classList.toggle("is-list", v === "list");
    IB.qsa("[data-view]").forEach(function (b) {
      var on = b.getAttribute("data-view") === v;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", on ? "true" : "false");
    });
    IB.store.set("view", v);
  }
  IB.qsa("[data-view]").forEach(function (b) {
    b.addEventListener("click", function () { setView(b.getAttribute("data-view")); });
  });
  setView(IB.store.get("view", "grid"));

  // --- Mobil filtr oynasi ---
  var sheet = IB.qs("#filter-sheet");
  var openBtn = IB.qs("#open-filters");
  function setSheet(open) {
    sheet.classList.toggle("is-open", open);
    sheet.setAttribute("aria-hidden", open ? "false" : "true");
    openBtn.setAttribute("aria-expanded", open ? "true" : "false");
    document.body.classList.toggle("is-locked", open);
    if (!open) openBtn.focus();
  }
  openBtn.addEventListener("click", function () { setSheet(true); });
  IB.qsa("[data-sheet-close]", sheet).forEach(function (el) {
    el.addEventListener("click", function () { setSheet(false); });
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && sheet.classList.contains("is-open")) setSheet(false);
  });
})();
