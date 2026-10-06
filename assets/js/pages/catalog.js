/* Katalog: filtrlar, saralash, URL bilan sinxronlash */
(function () {
  "use strict";
  var t = IB.t;
  var ALL = IB.cars.all();
  var ARRAYS = ["brand", "body", "fuel"];
  var FLAGS = ["clean", "sold"];
  var VALUES = ["q", "priceMin", "priceMax", "yearMin", "yearMax", "kmMax", "sort"];

  // --- Holat (URL'dan o'qiladi, shuning uchun havolani ulashsa bo'ladi) ---
  var state = readState();
  function readState() {
    var p = new URLSearchParams(location.search);
    var s = {};
    ARRAYS.forEach(function (k) { s[k] = (p.get(k) || "").split(",").filter(Boolean); });
    FLAGS.forEach(function (k) { s[k] = p.get(k) === "1"; });
    VALUES.forEach(function (k) { s[k] = p.get(k) || ""; });
    if (!s.sort) s.sort = "new";
    return s;
  }
  function writeState() {
    var p = new URLSearchParams();
    ARRAYS.forEach(function (k) { if (state[k].length) p.set(k, state[k].join(",")); });
    FLAGS.forEach(function (k) { if (state[k]) p.set(k, "1"); });
    VALUES.forEach(function (k) { if (state[k] && !(k === "sort" && state[k] === "new")) p.set(k, state[k]); });
    var q = p.toString();
    history.replaceState(null, "", location.pathname + (q ? "?" + q : ""));
  }

  // --- Filtrlash va saralash ---
  function haystack(c) {
    return [c.brand, c.model, c.trim, c.year, c.engine, t("color." + c.color), t("body." + c.body), t("fuel." + c.fuel)]
      .join(" ")
      .toLowerCase();
  }
  function num(v) {
    var n = Number(v);
    return v === "" || isNaN(n) ? null : n;
  }
  function match(c, ignore) {
    if (!state.sold && c.status === "sold") return false;
    if (state.q) {
      var h = haystack(c);
      var words = state.q.toLowerCase().split(/\s+/).filter(Boolean);
      if (!words.every(function (w) { return h.indexOf(w) > -1; })) return false;
    }
    if (ignore !== "brand" && state.brand.length && state.brand.indexOf(c.brand) === -1) return false;
    if (state.body.length && state.body.indexOf(c.body) === -1) return false;
    if (state.fuel.length && state.fuel.indexOf(c.fuel) === -1) return false;
    if (num(state.priceMin) != null && c.price < num(state.priceMin)) return false;
    if (num(state.priceMax) != null && c.price > num(state.priceMax)) return false;
    if (num(state.yearMin) != null && c.year < num(state.yearMin)) return false;
    if (num(state.yearMax) != null && c.year > num(state.yearMax)) return false;
    if (num(state.kmMax) != null && c.mileage > num(state.kmMax)) return false;
    if (state.clean && c.condition !== "clean") return false;
    return true;
  }
  var SORTS = {
    new: function (a, b) { return String(b.postedAt).localeCompare(String(a.postedAt)); },
    priceAsc: function (a, b) { return a.price - b.price; },
    priceDesc: function (a, b) { return b.price - a.price; },
    yearDesc: function (a, b) { return b.year - a.year || a.mileage - b.mileage; },
    kmAsc: function (a, b) { return a.mileage - b.mileage; },
  };
  function results() {
    var sorter = SORTS[state.sort] || SORTS.new;
    return ALL.filter(function (c) { return match(c); }).sort(function (a, b) {
      var sa = a.status === "sold" ? 1 : 0;
      var sb = b.status === "sold" ? 1 : 0;
      return sa - sb || sorter(a, b);
    });
  }

  // --- Filtr panelini chizish (desktop va mobil uchun bir xil) ---
  var brands = IB.cars.brands(ALL).map(function (b) { return b.name; }).sort();
  var years = ALL.map(function (c) { return c.year; });
  var minYear = Math.min.apply(null, years);
  var maxYear = Math.max.apply(null, years);

  function yearOptions(placeholder) {
    var html = '<option value="">' + IB.esc(placeholder) + "</option>";
    for (var y = maxYear; y >= minYear; y--) html += '<option value="' + y + '">' + y + "</option>";
    return html;
  }
  function chips(key, values) {
    return values
      .filter(function (v) { return ALL.some(function (c) { return c[key] === v; }); })
      .map(function (v) {
        return '<button type="button" class="filter-chip" data-f="' + key + '" data-v="' + v + '" aria-pressed="false">' + IB.esc(t(key + "." + v)) + "</button>";
      })
      .join("");
  }
  function check(key, value, label, extra) {
    return (
      '<label class="check"><input type="checkbox" data-f="' + key + '"' + (value != null ? ' value="' + IB.esc(value) + '"' : "") + ">" +
      '<span class="check__box">' + IB.icon("check") + "</span><span>" + IB.esc(label) + "</span>" + (extra || "") + "</label>"
    );
  }
  function filtersHtml(mobile) {
    return (
      '<div class="filter-group"><div class="search-input">' + IB.icon("search") +
      '<input class="input" type="search" data-f="q" placeholder="' + IB.esc(t("filter.searchPh")) + '" aria-label="' + IB.esc(t("filter.search")) + '"></div></div>' +
      '<div class="filter-group"><h4>' + IB.esc(t("filter.brand")) + '</h4><div class="check-list">' +
      brands.map(function (b) { return check("brand", b, b, '<span class="check__count" data-count-for="' + IB.esc(b) + '"></span>'); }).join("") +
      "</div></div>" +
      '<div class="filter-group"><h4>' + IB.esc(t("filter.body")) + '</h4><div class="filter-chips">' + chips("body", IB.OPTIONS.body) + "</div></div>" +
      '<div class="filter-group"><h4>' + IB.esc(t("filter.fuel")) + '</h4><div class="filter-chips">' + chips("fuel", IB.OPTIONS.fuel) + "</div></div>" +
      '<div class="filter-group"><h4>' + IB.esc(t("filter.price")) + '</h4><div class="range-pair">' +
      '<input class="input" type="number" inputmode="numeric" min="0" step="1000" data-f="priceMin" placeholder="' + IB.esc(t("filter.from")) + '" aria-label="' + IB.esc(t("filter.priceMin")) + '">' +
      '<input class="input" type="number" inputmode="numeric" min="0" step="1000" data-f="priceMax" placeholder="' + IB.esc(t("filter.to")) + '" aria-label="' + IB.esc(t("filter.priceMax")) + '">' +
      "</div></div>" +
      '<div class="filter-group"><h4>' + IB.esc(t("filter.year")) + '</h4><div class="range-pair">' +
      '<select class="select" data-f="yearMin" aria-label="' + IB.esc(t("filter.yearMin")) + '">' + yearOptions(t("filter.from")) + "</select>" +
      '<select class="select" data-f="yearMax" aria-label="' + IB.esc(t("filter.yearMax")) + '">' + yearOptions(t("filter.to")) + "</select>" +
      "</div></div>" +
      '<div class="filter-group"><h4>' + IB.esc(t("filter.mileage")) + '</h4><select class="select" data-f="kmMax" aria-label="' + IB.esc(t("filter.mileage")) + '">' +
      '<option value="">' + IB.esc(t("filter.any")) + "</option>" +
      [10000, 30000, 50000, 100000].map(function (k) { return '<option value="' + k + '">' + IB.esc(t("filter.kmUpTo", { km: IB.fmt.km(k) })) + "</option>"; }).join("") +
      "</select></div>" +
      '<div class="filter-group"><div class="check-list">' + check("clean", null, t("filter.clean")) + check("sold", null, t("filter.showSold")) + "</div></div>" +
      (mobile ? "" : '<button class="btn btn--sm btn--block" type="button" data-reset>' + IB.icon("refresh") + IB.esc(t("filter.reset")) + "</button>")
    );
  }

  var boxes = [IB.qs("#filters"), IB.qs("#filters-mobile")];
  boxes[0].innerHTML = filtersHtml(false);
  boxes[1].innerHTML = filtersHtml(true);

  // Panel elementlarini holatga moslash
  function syncBoxes() {
    var pool = ALL.filter(function (c) { return match(c, "brand"); });
    boxes.forEach(function (box) {
      IB.qsa("[data-f]", box).forEach(function (el) {
        var k = el.getAttribute("data-f");
        if (el.classList.contains("filter-chip")) {
          var on = state[k].indexOf(el.getAttribute("data-v")) > -1;
          el.classList.toggle("is-active", on);
          el.setAttribute("aria-pressed", on ? "true" : "false");
        } else if (el.type === "checkbox") {
          el.checked = ARRAYS.indexOf(k) > -1 ? state[k].indexOf(el.value) > -1 : !!state[k];
        } else if (document.activeElement !== el) {
          el.value = state[k] || "";
        }
      });
      IB.qsa("[data-count-for]", box).forEach(function (el) {
        var b = el.getAttribute("data-count-for");
        el.textContent = pool.filter(function (c) { return c.brand === b; }).length;
      });
    });
  }

  // --- Faol filtrlar ("chip"lar) ---
  function activeChips() {
    var list = [];
    state.brand.forEach(function (b) { list.push({ key: "brand", v: b, label: b }); });
    state.body.forEach(function (b) { list.push({ key: "body", v: b, label: t("body." + b) }); });
    state.fuel.forEach(function (b) { list.push({ key: "fuel", v: b, label: t("fuel." + b) }); });
    if (state.q) list.push({ key: "q", label: "“" + state.q + "”" });
    if (state.priceMin) list.push({ key: "priceMin", label: t("filter.from") + " " + IB.fmt.price(state.priceMin) });
    if (state.priceMax) list.push({ key: "priceMax", label: t("filter.upTo", { price: IB.fmt.price(state.priceMax) }) });
    if (state.yearMin) list.push({ key: "yearMin", label: state.yearMin + " " + t("filter.yearFromSuffix") });
    if (state.yearMax) list.push({ key: "yearMax", label: state.yearMax + " " + t("filter.yearToSuffix") });
    if (state.kmMax) list.push({ key: "kmMax", label: t("filter.kmUpTo", { km: IB.fmt.km(state.kmMax) }) });
    if (state.clean) list.push({ key: "clean", label: t("filter.clean") });
    if (state.sold) list.push({ key: "sold", label: t("filter.showSold") });
    if (!list.length) return "";
    return (
      list.map(function (f) {
        return '<button type="button" class="active-filter" data-remove="' + f.key + '"' + (f.v ? ' data-v="' + IB.esc(f.v) + '"' : "") +
          ' aria-label="' + IB.esc(t("filter.remove") + ": " + f.label) + '">' + IB.esc(f.label) + IB.icon("x") + "</button>";
      }).join("") +
      '<button type="button" class="clear-all" data-reset>' + IB.esc(t("filter.resetAll")) + "</button>"
    );
  }

  // --- Natijalarni chizish ---
  var grid = IB.qs("#results");
  function render() {
    var list = results();
    IB.qs("#count").innerHTML = t("catalog.found", { n: "<b>" + list.length + "</b>" });
    IB.qs("#sheet-apply").textContent = t("filter.showN", { n: list.length });
    IB.qs("#active-filters").innerHTML = activeChips();
    IB.qs("#sort").value = state.sort;
    if (!list.length) {
      grid.innerHTML =
        '<div class="empty" style="grid-column:1/-1"><div class="empty__icon">' + IB.icon("search") + "</div>" +
        "<h3>" + IB.esc(t("catalog.emptyTitle")) + "</h3><p>" + IB.esc(t("catalog.emptyText")) + "</p>" +
        '<div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap">' +
        '<button class="btn" type="button" data-reset>' + IB.esc(t("filter.reset")) + "</button>" +
        '<a class="btn btn--gold" href="contact.html?type=find">' + IB.esc(t("catalog.findForMe")) + "</a></div></div>";
    } else {
      grid.innerHTML = list.map(function (c) { return IB.carCard(c, { reveal: false }); }).join("");
    }
    syncBoxes();
    IB.favs.sync();
  }
  function update() {
    writeState();
    render();
  }

  // --- Hodisalar ---
  var debounceTimer;
  function isToggle(el) {
    return el.type === "checkbox" || el.tagName === "SELECT";
  }
  function onInput(e) {
    var el = e.target.closest("[data-f]");
    if (!el) return;
    var k = el.getAttribute("data-f");
    if (el.type === "checkbox") {
      if (ARRAYS.indexOf(k) > -1) {
        var arr = state[k];
        var i = arr.indexOf(el.value);
        if (el.checked && i === -1) arr.push(el.value);
        if (!el.checked && i > -1) arr.splice(i, 1);
      } else {
        state[k] = el.checked;
      }
      return update();
    }
    if (el.tagName === "SELECT") {
      state[k] = el.value;
      return update();
    }
    state[k] = el.value.trim();
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(update, 250);
  }
  boxes.forEach(function (box) {
    // Checkbox va select — "change", matn/raqam maydonlari — "input" (har harfda, debounce bilan)
    box.addEventListener("input", function (e) { if (!isToggle(e.target)) onInput(e); });
    box.addEventListener("change", function (e) { if (isToggle(e.target)) onInput(e); });
    box.addEventListener("click", function (e) {
      var chip = e.target.closest(".filter-chip");
      if (!chip) return;
      var k = chip.getAttribute("data-f");
      var v = chip.getAttribute("data-v");
      var i = state[k].indexOf(v);
      if (i > -1) state[k].splice(i, 1);
      else state[k].push(v);
      update();
    });
  });
  document.addEventListener("click", function (e) {
    if (e.target.closest("[data-reset]")) {
      ARRAYS.forEach(function (k) { state[k] = []; });
      FLAGS.forEach(function (k) { state[k] = false; });
      VALUES.forEach(function (k) { if (k !== "sort") state[k] = ""; });
      return update();
    }
    var rm = e.target.closest("[data-remove]");
    if (rm) {
      var k = rm.getAttribute("data-remove");
      if (ARRAYS.indexOf(k) > -1) state[k] = state[k].filter(function (v) { return v !== rm.getAttribute("data-v"); });
      else if (FLAGS.indexOf(k) > -1) state[k] = false;
      else state[k] = "";
      update();
    }
  });

  IB.qs("#sort").addEventListener("change", function (e) {
    state.sort = e.target.value;
    update();
  });

  // Ko'rinish: to'r / ro'yxat
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

  // Mobil filtr oynasi
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

  render();
})();
