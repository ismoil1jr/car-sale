/*
 * Ariza shakllari (sotish va aloqa sahifalari).
 * Forma serverga POST qilinadi (Django, CSRF bilan) va bazadagi "Arizalar" bo'limiga tushadi.
 * Bu yerda: telefon maskasi, brauzer tomonidagi tekshiruv, rasmlarni oldindan ko'rish, muvaffaqiyat oynasi.
 */
(function () {
  "use strict";
  var t = IB.t;
  var form = IB.qs("[data-lead-form]");
  if (!form) return;

  IB.qsa('input[type="tel"]', form).forEach(IB.phoneMask);

  // --- Muvaffaqiyatli yuborilgandan keyin oyna ---
  if (IB.qs("#lead-sent")) {
    var tel = IB.qs(".header__call");
    IB.modal({
      icon: "check",
      title: t("form.sentTitle"),
      html:
        "<p>" + IB.esc(t("form.sentText")) + "</p>" +
        '<div class="modal__actions">' +
        '<a class="btn btn--tg" href="' + IB.tgLink() + '" target="_blank" rel="noopener">' + IB.icon("telegram") + "Telegram</a>" +
        (tel ? '<a class="btn" href="' + tel.getAttribute("href") + '">' + IB.icon("phone") + IB.esc(t("cta.call")) + "</a>" : "") +
        "</div>",
    });
  }

  // --- Aloqa sahifasi: ?car=<slug> bilan oldindan to'ldirish ---
  var msg = form.querySelector('[name="message"][data-prefill-title]');
  if (msg && msg.getAttribute("data-prefill-title") && !msg.value.trim()) {
    msg.value = t("contact.prefillFind", { title: msg.getAttribute("data-prefill-title") });
  }

  // --- Rasmlar: haqiqiy <input type=file> + ko'rib chiqish ---
  var upload = IB.qs("#upload");
  var previews = IB.qs("#previews");
  var files = [];
  var fileInput = upload && upload.querySelector("input[type=file]");
  var MAX = 15;
  function syncInput() {
    var dt = new DataTransfer();
    files.forEach(function (f) { dt.items.add(f.file); });
    fileInput.files = dt.files;
  }
  function renderPreviews() {
    previews.innerHTML = files.map(function (f, i) {
      return '<div class="preview"><img src="' + f.url + '" alt=""><button type="button" data-rm="' + i + '" aria-label="' + IB.esc(t("form.removePhoto")) + '">' + IB.icon("x") + "</button></div>";
    }).join("");
  }
  function addFiles(list) {
    Array.prototype.slice.call(list || [])
      .filter(function (f) { return /^image\//.test(f.type); })
      .slice(0, Math.max(0, MAX - files.length))
      .forEach(function (f) { files.push({ file: f, url: URL.createObjectURL(f) }); });
    syncInput();
    renderPreviews();
  }
  if (upload && window.DataTransfer) {
    fileInput.addEventListener("change", function () { addFiles(fileInput.files); });
    ["dragenter", "dragover"].forEach(function (ev) {
      upload.addEventListener(ev, function (e) { e.preventDefault(); upload.classList.add("is-drag"); });
    });
    ["dragleave", "drop"].forEach(function (ev) {
      upload.addEventListener(ev, function (e) { e.preventDefault(); upload.classList.remove("is-drag"); });
    });
    upload.addEventListener("drop", function (e) { addFiles(e.dataTransfer.files); });
    previews.addEventListener("click", function (e) {
      var rm = e.target.closest("[data-rm]");
      if (!rm) return;
      var i = Number(rm.getAttribute("data-rm"));
      URL.revokeObjectURL(files[i].url);
      files.splice(i, 1);
      syncInput();
      renderPreviews();
    });
  }

  // --- Tekshiruv (server ham qayta tekshiradi) ---
  function fieldOf(el) { return el.closest(".field"); }
  function isBad(el) {
    var v = String(el.value || "").trim();
    return el.type === "tel" ? !IB.phoneValid(v) : !v;
  }
  form.addEventListener("submit", function (e) {
    var first = null;
    IB.qsa("[required]", form).forEach(function (el) {
      var bad = isBad(el);
      fieldOf(el).classList.toggle("has-error", bad);
      el.setAttribute("aria-invalid", bad ? "true" : "false");
      if (bad && !first) first = el;
    });
    if (first) {
      e.preventDefault();
      first.focus();
      IB.toast(t("form.fixErrors"), "info");
      return;
    }
    var btn = form.querySelector('[type="submit"]');
    if (btn) { btn.disabled = true; var s = btn.querySelector("span"); if (s) s.textContent = t("form.sending"); }
  });
  form.addEventListener("input", function (e) {
    var f = fieldOf(e.target);
    if (f && f.classList.contains("has-error") && !isBad(e.target)) {
      f.classList.remove("has-error");
      e.target.setAttribute("aria-invalid", "false");
    }
  });

  // --- Xarita (aloqa sahifasi) ---
  var map = IB.qs("#map");
  if (map) map.src = map.getAttribute("data-src") + IB.lang;
})();
