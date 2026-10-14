/* Saqlanganlar: ID'lar brauzerda (localStorage), kartochkalar va taqqoslash jadvalini server chizadi. */
(function () {
  "use strict";
  var grid = IB.qs("#fav-grid");
  var compareSection = IB.qs("#compare-section");
  var url = grid.getAttribute("data-url");

  function empty() {
    grid.innerHTML =
      '<div class="empty" style="grid-column:1/-1"><div class="empty__icon">' + IB.icon("heart") + "</div>" +
      "<h3>" + IB.esc(IB.t("fav.emptyTitle")) + "</h3><p>" + IB.esc(IB.t("fav.emptyText")) + "</p>" +
      '<a class="btn btn--gold" href="' + grid.getAttribute("data-catalog") + '">' + IB.esc(IB.t("hero.cta")) + "</a></div>";
    compareSection.hidden = true;
  }

  function render() {
    var ids = IB.favs.list();
    if (!ids.length) return empty();
    fetch(url + "?ids=" + encodeURIComponent(ids.join(",")), { headers: { Accept: "application/json" } })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        // Bazadan o'chirilgan mashinalarni saqlanganlardan tozalaymiz
        if (data.ids.length !== ids.length) IB.favs.set(data.ids);
        if (!data.ids.length) return empty();
        grid.innerHTML = data.cards;
        IB.qs("#compare").innerHTML = data.compare;
        compareSection.hidden = !data.compare;
        IB.hydrate(grid);
        IB.hydrate(compareSection);
      })
      .catch(function () { IB.toast(IB.t("toast.copyFailed"), "info"); });
  }

  document.addEventListener("ib:favs", render);
  render();
})();
