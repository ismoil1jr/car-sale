/*
 * Demo boshqaruv paneli.
 * Hamma o'zgarishlar localStorage'da saqlanadi va shu brauzerda saytda darhol ko'rinadi.
 * Haqiqiy loyihada bu qism backend (masalan, Frappe Desk + REST API) bilan almashtiriladi,
 * parol tekshiruvi ham serverda bo'ladi.
 */
(function () {
  "use strict";
  var t = IB.t;
  var C = IB.config;

  /* ---------------- Kirish ---------------- */
  function session(v) {
    try {
      if (v === undefined) return sessionStorage.getItem("ib:admin") === "1";
      if (v) sessionStorage.setItem("ib:admin", "1");
      else sessionStorage.removeItem("ib:admin");
    } catch (e) {
      return false;
    }
  }
  var loginView = IB.qs("#login-view");
  var dashView = IB.qs("#dash-view");
  IB.qs("#demo-pwd").textContent = C.demo.adminPassword;

  IB.qs("#login-form").addEventListener("submit", function (e) {
    e.preventDefault();
    var pwd = IB.qs("#pwd");
    var ok = pwd.value === C.demo.adminPassword;
    pwd.closest(".field").classList.toggle("has-error", !ok);
    if (!ok) return pwd.focus();
    session(true);
    show();
  });
  IB.qs("#logout").addEventListener("click", function () {
    session(false);
    show();
  });
  function show() {
    var on = session();
    loginView.hidden = on;
    dashView.hidden = !on;
    if (on) renderAll();
    else IB.qs("#pwd").focus();
  }

  /* ---------------- Ma'lumotlar ---------------- */
  function localCars() {
    return IB.store.get("admin:cars", []);
  }
  function saveCar(car) {
    var list = localCars().filter(function (c) { return c.id !== car.id; });
    var clean = Object.assign({}, car);
    delete clean._local;
    list.push(clean);
    if (!IB.store.set("admin:cars", list)) {
      IB.toast(t("admin.storageFull"), "info");
      return false;
    }
    var deleted = IB.store.get("admin:deleted", []).filter(function (id) { return id !== car.id; });
    IB.store.set("admin:deleted", deleted);
    return true;
  }
  function deleteCar(id) {
    IB.store.set("admin:cars", localCars().filter(function (c) { return c.id !== id; }));
    var isBase = (window.IB_CARS || []).some(function (c) { return c.id === id; });
    if (isBase) {
      var deleted = IB.store.get("admin:deleted", []);
      if (deleted.indexOf(id) === -1) deleted.push(id);
      IB.store.set("admin:deleted", deleted);
    }
  }
  function slugify(s) {
    return String(s)
      .toLowerCase()
      .replace(/[ʻʼ'`]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "car";
  }
  function today() {
    var d = new Date();
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }

  /* ---------------- Statistika ---------------- */
  function renderStats() {
    var all = IB.cars.all();
    var leads = IB.store.get("leads", []);
    var count = function (s) { return all.filter(function (c) { return c.status === s; }).length; };
    var items = [
      [all.length, t("admin.statTotal")],
      [count("available"), t("status.available")],
      [count("reserved"), t("status.reserved")],
      [count("sold"), t("status.sold")],
    ];
    IB.qs("#stats").innerHTML = items.map(function (i) {
      return '<div class="admin-stat"><b>' + i[0] + "</b><span>" + IB.esc(i[1]) + "</span></div>";
    }).join("");
    IB.qs("#leads-count").textContent = leads.length ? "(" + leads.length + ")" : "";
  }

  /* ---------------- E'lonlar jadvali ---------------- */
  var statusFilter = IB.qs("#admin-status");
  statusFilter.innerHTML =
    '<option value="">' + IB.esc(t("admin.allStatuses")) + "</option>" +
    IB.OPTIONS.status.map(function (s) { return '<option value="' + s + '">' + IB.esc(t("status." + s)) + "</option>"; }).join("");

  function renderTable() {
    var q = IB.qs("#admin-q").value.trim().toLowerCase();
    var st = statusFilter.value;
    var list = IB.cars.all().filter(function (c) {
      if (st && c.status !== st) return false;
      return !q || (IB.cars.title(c) + " " + c.year + " " + c.id).toLowerCase().indexOf(q) > -1;
    });
    var head =
      "<thead><tr><th>" + IB.esc(t("admin.colCar")) + "</th><th>" + IB.esc(t("spec.price")) + "</th><th>" + IB.esc(t("admin.colInfo")) +
      "</th><th>" + IB.esc(t("spec.status")) + "</th><th>" + IB.esc(t("admin.colActions")) + "</th></tr></thead>";
    var rows = list.map(function (c) {
      return (
        "<tr>" +
        '<td><div class="table__car"><img src="' + IB.esc(IB.cars.image(c, 0, true)) + '" alt="">' +
        "<div><b>" + IB.esc(IB.cars.title(c)) + (c._local ? '<span class="tag-local">' + IB.esc(t("admin.edited")) + "</span>" : "") + "</b><small>" + IB.esc(c.id) + "</small></div></div></td>" +
        "<td><b>" + IB.esc(IB.fmt.price(c.price)) + "</b></td>" +
        "<td>" + IB.esc(c.year + " · " + IB.fmt.km(c.mileage)) + "</td>" +
        '<td><select class="select" data-status="' + IB.esc(c.id) + '" aria-label="' + IB.esc(t("spec.status")) + '">' +
        IB.OPTIONS.status.map(function (s) {
          return '<option value="' + s + '"' + (s === c.status ? " selected" : "") + ">" + IB.esc(t("status." + s)) + "</option>";
        }).join("") +
        "</select></td>" +
        '<td><div class="table__actions">' +
        '<button class="icon-btn" type="button" data-edit="' + IB.esc(c.id) + '" title="' + IB.esc(t("admin.edit")) + '" aria-label="' + IB.esc(t("admin.edit")) + '">' + IB.icon("edit") + "</button>" +
        '<button class="icon-btn" type="button" data-caption="' + IB.esc(c.id) + '" title="' + IB.esc(t("admin.caption")) + '" aria-label="' + IB.esc(t("admin.caption")) + '">' + IB.icon("instagram") + "</button>" +
        '<a class="icon-btn" href="' + IB.esc(IB.cars.url(c)) + '" target="_blank" rel="noopener" title="' + IB.esc(t("admin.view")) + '" aria-label="' + IB.esc(t("admin.view")) + '">' + IB.icon("eye") + "</a>" +
        '<button class="icon-btn" type="button" data-del="' + IB.esc(c.id) + '" title="' + IB.esc(t("admin.delete")) + '" aria-label="' + IB.esc(t("admin.delete")) + '">' + IB.icon("trash") + "</button>" +
        "</div></td></tr>"
      );
    }).join("");
    IB.qs("#cars-table").innerHTML = head + "<tbody>" + (rows || '<tr><td colspan="5" style="text-align:center;color:var(--muted)">' + IB.esc(t("admin.noCars")) + "</td></tr>") + "</tbody>";
  }

  IB.qs("#admin-q").addEventListener("input", renderTable);
  statusFilter.addEventListener("change", renderTable);

  IB.qs("#cars-table").addEventListener("change", function (e) {
    var sel = e.target.closest("[data-status]");
    if (!sel) return;
    var car = IB.cars.get(sel.getAttribute("data-status"));
    car = Object.assign({}, car, { status: sel.value });
    if (sel.value === "sold" && !car.soldAt) car.soldAt = today();
    if (sel.value !== "sold") delete car.soldAt;
    if (saveCar(car)) {
      IB.toast(sel.value === "sold" ? t("admin.soldToast") : t("admin.saved"), sel.value === "sold" ? "handshake" : "checkCircle");
      renderAll();
    }
  });

  IB.qs("#cars-table").addEventListener("click", function (e) {
    var edit = e.target.closest("[data-edit]");
    var cap = e.target.closest("[data-caption]");
    var del = e.target.closest("[data-del]");
    if (edit) openEditor(IB.cars.get(edit.getAttribute("data-edit")));
    if (cap) openCaption(IB.cars.get(cap.getAttribute("data-caption")));
    if (del) {
      var car = IB.cars.get(del.getAttribute("data-del"));
      if (car && confirm(t("admin.confirmDelete", { title: IB.cars.title(car) }))) {
        deleteCar(car.id);
        IB.toast(t("admin.deleted"), "trash");
        renderAll();
      }
    }
  });

  /* ---------------- Instagram uchun matn ---------------- */
  function caption(car) {
    var lines = [
      "🚘 " + IB.cars.title(car),
      "📅 " + t("spec.year") + ": " + car.year + (car.regYear && car.regYear !== car.year ? " (" + t("spec.reg", { y: car.regYear }) + ")" : ""),
      "🛣 " + t("spec.mileage") + ": " + IB.fmt.km(car.mileage),
      "⚙️ " + [car.engine, car.power ? car.power + " " + t("unit.hp") : "", t("transmission." + car.transmission), t("drive." + car.drive)].filter(Boolean).join(" · "),
      "🎨 " + t("spec.color") + ": " + t("color." + car.color),
      "✅ " + t("spec.condition") + ": " + t("cond." + car.condition),
      "💰 " + t("spec.price") + ": " + IB.fmt.price(car.price) + (car.negotiable ? " (" + t("price.negotiable").toLowerCase() + ")" : ""),
      "",
      "📞 " + C.phones.map(function (p) { return p.display; }).join(" | "),
      "✈️ Telegram: @" + C.telegram.personal,
      "🔗 " + t("admin.captionMore") + ": " + IB.cars.absUrl(car),
      "",
      "#" + C.instagram.replace(/^_+|_+$/g, "") + " #" + slugify(car.brand).replace(/-/g, "") + " #" + slugify(car.model).replace(/-/g, "") + " #avto #toshkent",
    ];
    return lines.join("\n");
  }
  function openCaption(car) {
    var text = caption(car);
    var m = IB.modal({
      icon: "instagram",
      title: t("admin.captionTitle"),
      html:
        "<p>" + IB.esc(t("admin.captionText")) + "</p>" +
        '<div class="code-box">' + IB.esc(text) + "</div>" +
        '<div class="modal__actions"><button class="btn btn--gold" type="button" data-copy>' + IB.icon("copy") + IB.esc(t("form.copy")) + "</button>" +
        '<a class="btn" href="' + IB.links.ig() + '" target="_blank" rel="noopener">' + IB.icon("instagram") + "Instagram</a></div>",
    });
    m.el.querySelector("[data-copy]").addEventListener("click", function () {
      IB.copy(text).then(function (ok) { IB.toast(t(ok ? "toast.copied" : "toast.copyFailed"), "copy"); });
    });
  }

  /* ---------------- Tahrirlash oynasi ---------------- */
  function opt(list, prefix, value) {
    return list.map(function (v) {
      return '<option value="' + v + '"' + (v === value ? " selected" : "") + ">" + IB.esc(t(prefix + v)) + "</option>";
    }).join("");
  }
  function input(name, label, value, attrs) {
    return (
      '<div class="field"><label for="e-' + name + '">' + IB.esc(label) + "</label>" +
      '<input class="input" id="e-' + name + '" name="' + name + '" value="' + IB.esc(value == null ? "" : value) + '" ' + (attrs || "") + "></div>"
    );
  }
  function select(name, label, list, prefix, value) {
    return '<div class="field"><label for="e-' + name + '">' + IB.esc(label) + '</label><select class="select" id="e-' + name + '" name="' + name + '">' + opt(list, prefix, value) + "</select></div>";
  }

  function openEditor(car) {
    var isNew = !car;
    car = car || {
      brand: "", model: "", trim: "", year: new Date().getFullYear(), price: "", mileage: "",
      body: "suv", fuel: "petrol", transmission: "automatic", drive: "awd", color: "black",
      condition: "clean", status: "available", seats: 5, images: [], features: [], negotiable: true,
      description: { uz: "", ru: "" },
    };
    var images = (car.images || []).slice();

    var html =
      '<form class="form" id="editor" novalidate style="margin-top:20px">' +
      '<div class="form-grid">' +
      input("brand", t("form.brand") + " *", car.brand, 'required list="e-brands"') +
      '<datalist id="e-brands">' + IB.cars.brands(IB.cars.all()).map(function (b) { return '<option value="' + IB.esc(b.name) + '">'; }).join("") + "</datalist>" +
      input("model", t("form.model") + " *", car.model, "required") +
      input("trim", t("admin.trim"), car.trim) +
      input("engine", t("spec.engine"), car.engine, 'placeholder="3.5 V6"') +
      input("year", t("spec.year") + " *", car.year, 'type="number" min="1980" max="2100" required') +
      input("regYear", t("admin.regYear"), car.regYear, 'type="number" min="1980" max="2100"') +
      input("price", t("spec.price") + ", $ *", car.price, 'type="number" min="0" step="500" required') +
      input("mileage", t("spec.mileage") + ", km *", car.mileage, 'type="number" min="0" step="1000" required') +
      input("power", t("spec.power") + ", " + t("unit.hp"), car.power, 'type="number" min="0"') +
      input("seats", t("spec.seats"), car.seats, 'type="number" min="1" max="12"') +
      select("body", t("spec.body"), IB.OPTIONS.body, "body.", car.body) +
      select("fuel", t("spec.fuel"), IB.OPTIONS.fuel, "fuel.", car.fuel) +
      select("transmission", t("spec.transmission"), IB.OPTIONS.transmission, "transmission.", car.transmission) +
      select("drive", t("spec.drive"), IB.OPTIONS.drive, "drive.", car.drive) +
      select("color", t("spec.color"), IB.OPTIONS.color, "color.", car.color) +
      select("condition", t("spec.condition"), IB.OPTIONS.condition, "cond.", car.condition) +
      select("status", t("spec.status"), IB.OPTIONS.status, "status.", car.status) +
      input("video", t("admin.video"), car.video, 'type="url" placeholder="https://www.instagram.com/reel/..."') +
      '<div class="field full"><div class="check-list" style="grid-template-columns:repeat(auto-fill,minmax(220px,1fr))">' +
      '<label class="check"><input type="checkbox" name="negotiable"' + (car.negotiable ? " checked" : "") + '><span class="check__box">' + IB.icon("check") + "</span>" + IB.esc(t("price.negotiable")) + "</label>" +
      '<label class="check"><input type="checkbox" name="featured"' + (car.featured ? " checked" : "") + '><span class="check__box">' + IB.icon("check") + "</span>" + IB.esc(t("admin.featured")) + "</label>" +
      "</div></div>" +
      '<div class="field full"><label for="e-desc-uz">' + IB.esc(t("admin.descUz")) + '</label><textarea class="textarea" id="e-desc-uz" name="descUz">' + IB.esc((car.description && car.description.uz) || "") + "</textarea></div>" +
      '<div class="field full"><label for="e-desc-ru">' + IB.esc(t("admin.descRu")) + '</label><textarea class="textarea" id="e-desc-ru" name="descRu">' + IB.esc((car.description && car.description.ru) || "") + "</textarea></div>" +
      '<div class="field full"><span class="label">' + IB.esc(t("car.features")) + '</span><div class="feature-checks">' +
      IB.OPTIONS.features.map(function (f) {
        return '<label class="check"><input type="checkbox" name="feat" value="' + f + '"' + ((car.features || []).indexOf(f) > -1 ? " checked" : "") + '><span class="check__box">' + IB.icon("check") + "</span>" + IB.esc(t("feat." + f)) + "</label>";
      }).join("") +
      "</div></div>" +
      '<div class="field full"><span class="label">' + IB.esc(t("admin.photos")) + "</span>" +
      '<label class="upload"><input type="file" accept="image/*" multiple id="e-files">' + IB.icon("upload") + "<b>" + IB.esc(t("form.uploadTitle")) + "</b><small>" + IB.esc(t("admin.photosHint")) + "</small></label>" +
      '<div class="previews" id="e-previews"></div></div>' +
      "</div>" +
      '<div class="modal__actions"><button class="btn btn--gold btn--lg" type="submit">' + IB.icon("check") + IB.esc(t("admin.save")) + "</button>" +
      '<button class="btn btn--lg" type="button" data-close>' + IB.esc(t("admin.cancel")) + "</button></div>" +
      "</form>";

    var m = IB.modal({ wide: true, title: isNew ? t("admin.newTitle") : t("admin.editTitle", { title: IB.cars.title(car) }), html: html });
    var form = m.el.querySelector("#editor");
    var previews = m.el.querySelector("#e-previews");

    function renderPreviews() {
      previews.innerHTML = images.map(function (src, i) {
        return (
          '<div class="preview"><img src="' + IB.esc(IB.safeUrl(src)) + '" alt="">' +
          (i === 0 ? '<span class="badge badge--featured" style="position:absolute;left:6px;bottom:6px;font-size:10px;padding:3px 7px">' + IB.esc(t("admin.cover")) + "</span>" : '<button type="button" data-cover="' + i + '" style="position:absolute;left:6px;top:6px;width:26px;height:26px;border-radius:50%;display:grid;place-items:center;background:rgba(0,0,0,.7)" title="' + IB.esc(t("admin.makeCover")) + '">' + IB.icon("star") + "</button>") +
          '<button type="button" data-rm="' + i + '" aria-label="' + IB.esc(t("form.removePhoto")) + '">' + IB.icon("x") + "</button></div>"
        );
      }).join("");
    }
    renderPreviews();
    previews.addEventListener("click", function (e) {
      var rm = e.target.closest("[data-rm]");
      var cv = e.target.closest("[data-cover]");
      if (rm) images.splice(Number(rm.getAttribute("data-rm")), 1);
      if (cv) images.unshift(images.splice(Number(cv.getAttribute("data-cover")), 1)[0]);
      renderPreviews();
    });
    m.el.querySelector("#e-files").addEventListener("change", function (e) {
      var files = Array.prototype.slice.call(e.target.files).filter(function (f) { return /^image\//.test(f.type); }).slice(0, 10);
      e.target.value = "";
      Promise.all(files.map(resize)).then(function (urls) {
        images = images.concat(urls.filter(Boolean));
        renderPreviews();
      });
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var bad = null;
      IB.qsa("[required]", form).forEach(function (el) {
        var empty = !String(el.value).trim();
        el.closest(".field").classList.toggle("has-error", empty);
        if (empty && !bad) bad = el;
      });
      if (bad) return bad.focus();
      var fd = new FormData(form);
      var n = function (k) { var v = fd.get(k); return v === "" || v == null ? undefined : Number(v); };
      var s = function (k) { return String(fd.get(k) || "").trim(); };
      var next = Object.assign({}, car, {
        brand: s("brand"), model: s("model"), trim: s("trim"), engine: s("engine"),
        year: n("year"), regYear: n("regYear"), price: n("price"), mileage: n("mileage"), power: n("power"), seats: n("seats"),
        body: s("body"), fuel: s("fuel"), transmission: s("transmission"), drive: s("drive"), color: s("color"),
        condition: s("condition"), status: s("status"), video: s("video"),
        negotiable: fd.get("negotiable") === "on", featured: fd.get("featured") === "on",
        description: { uz: s("descUz"), ru: s("descRu") },
        features: fd.getAll("feat"),
        images: images,
      });
      if (isNew) {
        var base = slugify(next.brand + "-" + next.model + "-" + next.year);
        var id = base;
        var k = 2;
        while (IB.cars.get(id)) id = base + "-" + k++;
        next.id = id;
        next.postedAt = today();
      }
      if (next.status === "sold" && !next.soldAt) next.soldAt = today();
      if (next.status !== "sold") delete next.soldAt;
      if (saveCar(next)) {
        m.close();
        IB.toast(t("admin.saved"));
        renderAll();
        if (isNew) openCaption(IB.cars.get(next.id));
      }
    });
  }

  // Rasmni 1280px gacha kichraytirib, WebP (yoki JPEG) data-URL qilamiz — localStorage'ga sig'ishi uchun.
  function resize(file) {
    return new Promise(function (resolve) {
      var img = new Image();
      var url = URL.createObjectURL(file);
      img.onload = function () {
        var scale = Math.min(1, 1280 / img.width);
        var canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
        var out = canvas.toDataURL("image/webp", 0.8);
        if (out.indexOf("data:image/webp") !== 0) out = canvas.toDataURL("image/jpeg", 0.8);
        URL.revokeObjectURL(url);
        resolve(out);
      };
      img.onerror = function () {
        URL.revokeObjectURL(url);
        resolve(null);
      };
      img.src = url;
    });
  }

  IB.qs("#add-car").addEventListener("click", function () { openEditor(null); });

  /* ---------------- Arizalar ---------------- */
  function renderLeads() {
    var leads = IB.store.get("leads", []);
    var box = IB.qs("#leads");
    if (!leads.length) {
      box.innerHTML = '<div class="empty"><div class="empty__icon">' + IB.icon("message") + "</div><h3>" + IB.esc(t("admin.noLeads")) + "</h3><p>" + IB.esc(t("admin.noLeadsText")) + "</p></div>";
      return;
    }
    box.innerHTML = '<div style="display:grid;gap:12px">' + leads.map(function (l) {
      var d = new Date(l.createdAt);
      return (
        '<div class="panel" style="padding:20px">' +
        '<div style="display:flex;flex-wrap:wrap;gap:10px;align-items:center;justify-content:space-between">' +
        '<div style="display:flex;gap:10px;align-items:center"><span class="badge badge--' + (l.form === "sell" ? "reserved" : "available") + '">' + IB.esc(t("admin.lead." + l.form)) + "</span>" +
        "<b>" + IB.esc((l.data && l.data.name) || "—") + "</b><span style=\"color:var(--muted)\">" + IB.esc((l.data && l.data.phone) || "") + "</span></div>" +
        '<div style="display:flex;gap:8px;align-items:center"><small style="color:var(--muted)">' + IB.esc(d.toLocaleString(IB.lang === "ru" ? "ru-RU" : "uz-UZ")) + "</small>" +
        '<button class="icon-btn" type="button" data-copy-lead="' + IB.esc(l.id) + '" aria-label="' + IB.esc(t("form.copy")) + '">' + IB.icon("copy") + "</button>" +
        '<button class="icon-btn" type="button" data-del-lead="' + IB.esc(l.id) + '" aria-label="' + IB.esc(t("admin.delete")) + '">' + IB.icon("trash") + "</button></div></div>" +
        '<div class="code-box">' + IB.esc(l.message) + "</div></div>"
      );
    }).join("") + "</div>";
  }
  IB.qs("#leads").addEventListener("click", function (e) {
    var cp = e.target.closest("[data-copy-lead]");
    var dl = e.target.closest("[data-del-lead]");
    var leads = IB.store.get("leads", []);
    if (cp) {
      var lead = leads.filter(function (l) { return l.id === cp.getAttribute("data-copy-lead"); })[0];
      if (lead) IB.copy(lead.message).then(function (ok) { IB.toast(t(ok ? "toast.copied" : "toast.copyFailed"), "copy"); });
    }
    if (dl) {
      IB.store.set("leads", leads.filter(function (l) { return l.id !== dl.getAttribute("data-del-lead"); }));
      renderAll();
    }
  });

  /* ---------------- Tablar va tiklash ---------------- */
  IB.qsa("[data-tab]").forEach(function (tab) {
    tab.addEventListener("click", function () {
      var name = tab.getAttribute("data-tab");
      IB.qsa("[data-tab]").forEach(function (x) {
        var on = x === tab;
        x.classList.toggle("is-active", on);
        x.setAttribute("aria-selected", on ? "true" : "false");
      });
      IB.qs("#tab-cars").hidden = name !== "cars";
      IB.qs("#tab-leads").hidden = name !== "leads";
    });
  });
  IB.qs("#reset-demo").addEventListener("click", function () {
    if (!confirm(t("admin.confirmReset"))) return;
    IB.store.remove("admin:cars");
    IB.store.remove("admin:deleted");
    IB.store.remove("leads");
    IB.toast(t("admin.resetDone"), "refresh");
    renderAll();
  });

  function renderAll() {
    renderStats();
    renderTable();
    renderLeads();
    IB.favs.sync();
  }

  show();
})();
