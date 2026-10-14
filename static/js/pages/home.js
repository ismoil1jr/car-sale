/* Bosh sahifa: statistika sanagichi va "Baraka bo'ldi" slayderi */
(function () {
  "use strict";
  IB.counters();

  var track = IB.qs("#sold-track");
  IB.qsa("[data-slide]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var dir = Number(btn.getAttribute("data-slide"));
      var card = track.firstElementChild;
      var step = card ? card.getBoundingClientRect().width + 20 : 300;
      track.scrollBy({ left: dir * step, behavior: "smooth" });
    });
  });
})();
