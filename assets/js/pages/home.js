/* Bosh sahifa */
(function () {
  "use strict";
  var t = IB.t;
  var forSale = IB.cars.forSale();
  var sold = IB.cars.sold();

  // --- Tezkor qidiruv: markalar, kuzov, narx ---
  var brandSel = IB.qs("#qs-brand");
  IB.cars.brands(forSale).forEach(function (b) {
    brandSel.insertAdjacentHTML("beforeend", '<option value="' + IB.esc(b.name) + '">' + IB.esc(b.name) + " (" + b.count + ")</option>");
  });
  var bodySel = IB.qs("#qs-body");
  IB.OPTIONS.body.forEach(function (b) {
    if (forSale.some(function (c) { return c.body === b; })) {
      bodySel.insertAdjacentHTML("beforeend", '<option value="' + b + '">' + IB.esc(t("body." + b)) + "</option>");
    }
  });
  var priceSel = IB.qs("#qs-price");
  [40000, 60000, 80000, 100000, 150000, 200000].forEach(function (p) {
    priceSel.insertAdjacentHTML("beforeend", '<option value="' + p + '">' + IB.esc(t("filter.upTo", { price: IB.fmt.price(p) })) + "</option>");
  });
  // Bo'sh maydonlar URL'ga tushmasin
  IB.qs(".quick-search").addEventListener("submit", function (e) {
    e.preventDefault();
    var params = new URLSearchParams();
    new FormData(e.target).forEach(function (v, k) { if (v) params.set(k, v); });
    var q = params.toString();
    location.href = "catalog.html" + (q ? "?" + q : "");
  });

  // --- Statistika (raqamlar sanab chiqadi) ---
  IB.qs("#stat-sale").setAttribute("data-count", forSale.length);
  IB.qs("#stat-sold").setAttribute("data-count", sold.length);
  var counters = IB.qsa("[data-count]");
  function runCounter(el) {
    var target = Number(el.getAttribute("data-count")) || 0;
    var start = performance.now();
    var dur = 1200;
    (function tick(now) {
      var p = Math.min(1, (now - start) / dur);
      el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(tick);
    })(start);
  }
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { runCounter(en.target); io.unobserve(en.target); }
      });
    });
    counters.forEach(function (el) { io.observe(el); });
  } else {
    counters.forEach(function (el) { el.textContent = el.getAttribute("data-count"); });
  }

  // --- Markalar ---
  IB.qs("#brands").innerHTML = IB.cars.brands(forSale).map(function (b) {
    return '<a class="brand-pill" href="catalog.html?brand=' + encodeURIComponent(b.name) + '">' + IB.esc(b.name) + "<small>" + b.count + "</small></a>";
  }).join("");

  // --- Sotuvdagi eng yaxshi takliflar (avval "TOP"lar, keyin yangilari) ---
  var featured = forSale
    .filter(function (c) { return c.status === "available"; })
    .sort(function (a, b) { return (b.featured ? 1 : 0) - (a.featured ? 1 : 0); })
    .slice(0, 6);
  IB.qs("#featured").innerHTML = featured.map(function (c) { return IB.carCard(c); }).join("");

  // --- Baraka bo'ldi slayderi ---
  var track = IB.qs("#sold-track");
  track.innerHTML = sold.map(function (c) {
    return (
      '<a class="sold-card" href="' + IB.esc(IB.cars.url(c)) + '">' +
      '<img src="' + IB.esc(IB.cars.image(c, 0, true)) + '" alt="' + IB.esc(IB.cars.title(c)) + '" loading="lazy" width="720" height="480">' +
      IB.stamp() +
      '<div class="sold-card__info"><h3>' + IB.esc(IB.cars.title(c)) + "</h3><p>" + IB.esc(c.year + " · " + IB.fmt.date(c.soldAt)) + "</p></div>" +
      "</a>"
    );
  }).join("");
  IB.qsa("[data-slide]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var dir = Number(btn.getAttribute("data-slide"));
      var card = track.firstElementChild;
      var step = card ? card.getBoundingClientRect().width + 20 : 300;
      track.scrollBy({ left: dir * step, behavior: "smooth" });
    });
  });

  // --- Ijtimoiy tarmoqlar va "reels" ---
  IB.qs("#ig-card").href = IB.links.ig();
  IB.qs("#tg-card").href = IB.links.tgChannel();
  IB.qs("#hero-tg").href = IB.links.tg(t("msg.hello"));
  IB.qs("#faq-tg").href = IB.links.tg(t("msg.hello"));
  IB.qs("#sell-call").href = IB.links.tel(0);
  IB.qs("#reels").innerHTML = IB.cars.all().slice(0, 6).map(function (c) {
    return (
      '<a class="reel reveal" href="' + IB.esc(IB.safeUrl(c.video) || IB.links.ig()) + '" target="_blank" rel="noopener" aria-label="' + IB.esc(IB.cars.title(c) + " — Instagram") + '">' +
      '<img src="' + IB.esc(IB.cars.image(c, 0, true)) + '" alt="" loading="lazy">' +
      '<span class="reel__play">' + IB.icon("play") + "</span></a>"
    );
  }).join("");

  IB.favs.sync();
  IB.reveal();
})();
