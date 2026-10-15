/* Admin dashboard: grafiklar (Chart.js) va backenddan jonli yangilanish.
   Har bir grafik — bitta ko'rsatkich, bitta o'q. */
(function () {
  "use strict";
  var root = document.querySelector("[data-ib-live]");
  var body = document.querySelector("[data-ib-dash-body]");
  var dataEl = document.getElementById("ib-chart-data");
  if (!root || !body) return;

  var REFRESH_MS = 30000;
  var charts = {};
  var busy = false;
  var baseTitle = document.title;

  var fmt = function (n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, " "); };

  function bars(id, data, values, color, unit) {
    var canvas = document.getElementById(id);
    if (!canvas || !window.Chart) return;
    if (charts[id]) charts[id].destroy();
    var css = getComputedStyle(document.documentElement);
    var v = function (name, fallback) { return (css.getPropertyValue(name) || "").trim() || fallback; };
    var ink = v("--bs-secondary-color", "#6c757d");
    var grid = v("--bs-border-color-translucent", "rgba(0,0,0,.08)");
    var last = data.labels.length - 1;
    charts[id] = new Chart(canvas, {
      type: "bar",
      data: {
        labels: data.labels,
        datasets: [{
          data: values,
          // joriy oy to'q, qolganlari yengilroq
          backgroundColor: values.map(function (_, i) { return i === last ? color : color + "99"; }),
          hoverBackgroundColor: color,
          borderRadius: 4,
          borderSkipped: "bottom",
          maxBarThickness: 28,
        }],
      },
      options: {
        maintainAspectRatio: false,
        animation: { duration: 400 },
        plugins: {
          legend: { display: false },
          tooltip: {
            displayColors: false,
            callbacks: {
              title: function (items) { return data.titles[items[0].dataIndex]; },
              label: function (item) { return fmt(item.raw) + " " + unit; },
            },
          },
        },
        scales: {
          x: { grid: { display: false }, ticks: { color: ink } },
          y: {
            beginAtZero: true,
            grid: { color: grid },
            border: { display: false },
            ticks: { color: ink, precision: 0, callback: function (val) { return val >= 1e6 ? fmt(val / 1e6) + " mln" : fmt(val); } },
          },
        },
      },
    });
  }

  function draw(data) {
    bars("chart-sold", data, data.sold, "#2c7be5", "ta mashina");
    bars("chart-ads", data, data.ad_income, "#00a87e", "soʻm");
  }

  function setTitle(pending) {
    document.title = (pending ? "(" + pending + ") " : "") + baseTitle;
  }

  function refresh() {
    if (busy) return;
    busy = true;
    root.classList.add("is-loading");
    fetch(root.getAttribute("data-ib-live"), { credentials: "same-origin", headers: { "X-Requested-With": "fetch" } })
      .then(function (r) {
        if (r.redirected || !r.ok) throw new Error(r.status); // sessiya tugagan bo'lsa login sahifasiga yo'naltiriladi
        return r.json();
      })
      .then(function (res) {
        body.innerHTML = res.html;
        draw(res.chart);
        setTitle(res.pending);
        root.classList.remove("is-stale");
      })
      .catch(function () { root.classList.add("is-stale"); })
      .then(function () { busy = false; root.classList.remove("is-loading"); });
  }

  if (dataEl) draw(JSON.parse(dataEl.textContent));
  root.addEventListener("click", function (e) {
    if (e.target.closest("[data-ib-refresh]")) refresh();
  });
  setInterval(function () { if (!document.hidden) refresh(); }, REFRESH_MS);
  // boshqa tabdan qaytganda (masalan, arizani qabul qilib bo'lgach) darhol yangilansin
  document.addEventListener("visibilitychange", function () { if (!document.hidden) refresh(); });
  window.addEventListener("pageshow", function (e) { if (e.persisted) refresh(); });
})();
