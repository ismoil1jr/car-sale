/* Admin dashboard grafiklari (Chart.js). Har bir grafik — bitta ko'rsatkich, bitta o'q. */
(function () {
  "use strict";
  var el = document.getElementById("ib-chart-data");
  if (!el || !window.Chart) return;
  var data = JSON.parse(el.textContent);
  var css = getComputedStyle(document.documentElement);
  function v(name, fallback) { return (css.getPropertyValue(name) || "").trim() || fallback; }
  var ink = v("--bs-secondary-color", "#6c757d");
  var grid = v("--bs-border-color-translucent", "rgba(0,0,0,.08)");
  var last = data.labels.length - 1;
  var fmt = function (n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, " "); };

  function bars(id, values, color, unit) {
    var canvas = document.getElementById(id);
    if (!canvas) return;
    new Chart(canvas, {
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
  bars("chart-sold", data.sold, "#2c7be5", "ta mashina");
  bars("chart-ads", data.ad_income, "#00a87e", "soʻm");
})();
