/*
 * Ariza shakllari (sotish va aloqa sahifalari).
 * Hozircha backend yo'q: ariza matni tayyorlanadi va Telegram orqali yuboriladi,
 * nusxasi brauzerda saqlanadi (admin paneldagi "Arizalar" bo'limida ko'rinadi).
 * Backend ulanganda submit() ichida fetch("/api/...") qilinadi.
 */
(function () {
  "use strict";
  var t = IB.t;
  var C = IB.config;
  var form = IB.qs("[data-lead-form]");
  if (!form) return;
  var formType = form.getAttribute("data-lead-form");

  // --- Yordamchi ro'yxatlar ---
  var brandList = IB.qs("#brand-list");
  if (brandList) {
    var common = ["Audi", "BMW", "BYD", "Cadillac", "Chevrolet", "Chery", "Haval", "Hyundai", "Kia", "Land Rover", "Lexus", "Li Auto", "Mercedes-Benz", "Nissan", "Porsche", "Toyota", "Volkswagen", "Zeekr"];
    IB.cars.all().forEach(function (c) { if (common.indexOf(c.brand) === -1) common.push(c.brand); });
    brandList.innerHTML = common.sort().map(function (b) { return '<option value="' + IB.esc(b) + '">'; }).join("");
  }
  var yearSel = IB.qs("#s-year");
  if (yearSel) {
    for (var y = new Date().getFullYear(); y >= 1995; y--) yearSel.insertAdjacentHTML("beforeend", '<option value="' + y + '">' + y + "</option>");
  }
  var colorSel = IB.qs("#s-color");
  if (colorSel) {
    IB.OPTIONS.color.forEach(function (c) {
      colorSel.insertAdjacentHTML("beforeend", '<option value="' + c + '">' + IB.esc(t("color." + c)) + "</option>");
    });
  }
  var sideContacts = IB.qs("#side-contacts");
  if (sideContacts) {
    sideContacts.innerHTML =
      C.phones.map(function (p) {
        return '<a class="contact-line" href="tel:' + p.number + '"><span class="contact-line__icon">' + IB.icon("phone") + "</span><span><small>" + IB.esc(IB.L(p.label)) + "</small><b>" + IB.esc(p.display) + "</b></span></a>";
      }).join("") +
      '<a class="contact-line" href="' + IB.links.tg() + '" target="_blank" rel="noopener"><span class="contact-line__icon">' + IB.icon("telegram") + "</span><span><small>Telegram</small><b>@" + IB.esc(C.telegram.personal) + "</b></span></a>";
  }

  IB.qsa('input[type="tel"]', form).forEach(IB.phoneMask);

  // --- Aloqa sahifasi: ?type=find&car=<id> bilan oldindan to'ldirish ---
  var qType = IB.param("type");
  if (qType) {
    IB.qsa('input[name="type"]', form).forEach(function (r) { r.checked = r.value === qType; });
  }
  var qCar = IB.param("car") ? IB.cars.get(IB.param("car")) : null;
  var msgField = form.querySelector('[name="message"]');
  if (qCar && msgField) msgField.value = t("contact.prefillFind", { title: IB.cars.title(qCar) + " " + qCar.year });

  // --- Rasmlar (faqat ko'rib chiqish uchun; yuborish Telegram orqali) ---
  var files = [];
  var upload = IB.qs("#upload");
  var previews = IB.qs("#previews");
  if (upload) {
    var fileInput = upload.querySelector("input");
    fileInput.addEventListener("change", function () { addFiles(fileInput.files); fileInput.value = ""; });
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
      renderPreviews();
    });
  }
  function addFiles(list) {
    Array.prototype.slice.call(list || [])
      .filter(function (f) { return /^image\//.test(f.type); })
      .slice(0, Math.max(0, 15 - files.length))
      .forEach(function (f) { files.push({ file: f, url: URL.createObjectURL(f) }); });
    renderPreviews();
  }
  function renderPreviews() {
    previews.innerHTML = files.map(function (f, i) {
      return '<div class="preview"><img src="' + f.url + '" alt=""><button type="button" data-rm="' + i + '" aria-label="' + IB.esc(t("form.removePhoto")) + '">' + IB.icon("x") + "</button></div>";
    }).join("");
  }

  // --- Tekshiruv ---
  function fieldOf(el) {
    return el.closest(".field");
  }
  function isBad(el) {
    var v = String(el.value || "").trim();
    if (el.type === "tel") return !IB.phoneValid(v);
    return !v;
  }
  function validate() {
    var first = null;
    IB.qsa("[required]", form).forEach(function (el) {
      var bad = isBad(el);
      fieldOf(el).classList.toggle("has-error", bad);
      el.setAttribute("aria-invalid", bad ? "true" : "false");
      if (bad && !first) first = el;
    });
    if (first) first.focus();
    return !first;
  }
  form.addEventListener("input", function (e) {
    var f = fieldOf(e.target);
    if (f && f.classList.contains("has-error") && !isBad(e.target)) {
      f.classList.remove("has-error");
      e.target.setAttribute("aria-invalid", "false");
    }
  });

  // --- Xabar matnini yig'ish (label matni + qiymat) ---
  function labelFor(el) {
    if (el.type === "radio") {
      var lg = el.closest("fieldset") && el.closest("fieldset").querySelector("legend");
      return lg ? lg.textContent.trim() : el.name;
    }
    var l = el.id && form.querySelector('label[for="' + el.id + '"]');
    // "Probeg, km" -> "Probeg": birlik qiymatning o'zida yoziladi
    return l ? l.textContent.replace("*", "").trim().replace(/,\s*(km|км|\$)$/i, "") : el.name;
  }
  function valueOf(el) {
    if (el.tagName === "SELECT") return el.value ? el.options[el.selectedIndex].text : "";
    if (el.type === "radio") return el.closest("label").textContent.trim();
    var v = el.value.trim();
    if (!v) return "";
    if (/^(price|budget)$/.test(el.name)) return IB.fmt.price(v);
    if (el.name === "mileage") return IB.fmt.km(v);
    return v;
  }
  function buildMessage() {
    var lines = [t(form.getAttribute("data-msg-title")), ""];
    IB.qsa("input, select, textarea", form).forEach(function (el) {
      if (!el.name || el.type === "file" || (el.type === "radio" && !el.checked)) return;
      var v = valueOf(el);
      if (v) lines.push("• " + labelFor(el) + ": " + v);
    });
    if (files.length) lines.push("• " + t("form.photosLine", { n: files.length }));
    lines.push("", t("msg.fromSite"));
    return lines.join("\n");
  }

  // --- Yuborish ---
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!validate()) {
      IB.toast(t("form.fixErrors"), "info");
      return;
    }
    var message = buildMessage();
    var data = {};
    new FormData(form).forEach(function (v, k) { if (typeof v === "string" && v) data[k] = v; });
    var leads = IB.store.get("leads", []);
    leads.unshift({ id: Date.now().toString(36), form: formType, createdAt: new Date().toISOString(), data: data, message: message, photos: files.length });
    IB.store.set("leads", leads.slice(0, 50));
    showReady(message);
  });

  function showReady(message) {
    var m = IB.modal({
      icon: "check",
      title: t("form.readyTitle"),
      html:
        "<p>" + IB.esc(t("form.readyText")) + "</p>" +
        '<div class="code-box">' + IB.esc(message) + "</div>" +
        '<div class="modal__actions">' +
        '<button class="btn btn--tg" type="button" data-send>' + IB.icon("telegram") + IB.esc(t("form.sendTg")) + "</button>" +
        '<button class="btn" type="button" data-copy>' + IB.icon("copy") + IB.esc(t("form.copy")) + "</button>" +
        '<a class="btn" href="' + IB.links.tel(0) + '">' + IB.icon("phone") + IB.esc(t("cta.call")) + "</a>" +
        "</div>",
    });
    m.el.querySelector("[data-send]").addEventListener("click", function () {
      IB.openTelegram(message);
      form.reset();
      files.forEach(function (f) { URL.revokeObjectURL(f.url); });
      files = [];
      if (previews) renderPreviews();
      m.close();
    });
    m.el.querySelector("[data-copy]").addEventListener("click", function () {
      IB.copy(message).then(function (ok) { IB.toast(t(ok ? "toast.copied" : "toast.copyFailed"), "copy"); });
    });
  }
})();
