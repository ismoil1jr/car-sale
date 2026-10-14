/*
 * Video reklama: foydalanuvchi mashinani bosganda, sahifaga o'tishdan oldin ko'rsatiladi.
 *  - Har bir reklama bir tashrifda bir marta chiqadi (2 ta reklama bo'lsa: 1-bosishda biri, 2-sida ikkinchisi,
 *    keyin boshqa chiqmaydi). Sahifa yangilansa (refresh) yoki saytga tashqaridan qayta kirilsa — qaytadan.
 *  - Ovoz boshida o'chiq (brauzerlar ovozli autoplay'ga ruxsat bermaydi), tugma bilan yoqiladi.
 *  - 3 soniyadan keyin "O'tkazib yuborish" — tanlangan mashina sahifasi ochiladi.
 *  - Videoning o'ziga yoki "Batafsil" ga bosilsa — reklama havolasi yangi oynada ochiladi,
 *    joriy oynada esa tanlangan mashina ochiladi.
 */
(function () {
  "use strict";
  var dataEl = document.getElementById("ib-ads");
  if (!dataEl) return;
  var ADS = JSON.parse(dataEl.textContent) || [];
  if (!ADS.length) return;

  var t = IB.t;
  // Sahifaga o'tish (testlarda almashtirish mumkin)
  IB.navigate = IB.navigate || function (url) { location.href = url; };
  var SKIP_AFTER = 3;
  var KEY = "ib:adsSeen";
  var eventUrl = (document.currentScript && document.currentScript.getAttribute("data-event-url")) || "/ads/0/EVENT/";

  // --- "Tashrif" chegarasi: refresh yoki tashqaridan kirish — hisob yangidan ---
  function sameOriginReferrer() {
    try { return !!document.referrer && new URL(document.referrer).origin === location.origin; } catch (e) { return false; }
  }
  var nav = performance.getEntriesByType ? performance.getEntriesByType("navigation")[0] : null;
  if ((nav && nav.type === "reload") || !sameOriginReferrer()) store("set", []);

  function store(op, value) {
    try {
      if (op === "set") sessionStorage.setItem(KEY, JSON.stringify(value));
      else return JSON.parse(sessionStorage.getItem(KEY)) || [];
    } catch (e) {
      return [];
    }
  }
  function nextAd() {
    var seen = store("get");
    for (var i = 0; i < ADS.length; i++) if (seen.indexOf(ADS[i].id) === -1) return ADS[i];
    return null;
  }
  function markSeen(ad) {
    var seen = store("get");
    if (seen.indexOf(ad.id) === -1) seen.push(ad.id);
    store("set", seen);
  }
  function track(ad, event) {
    var url = eventUrl.replace("/0/", "/" + ad.id + "/").replace("EVENT", event);
    if (navigator.sendBeacon) navigator.sendBeacon(url);
    else fetch(url, { method: "POST", keepalive: true }).catch(function () {});
  }

  // --- Mashina havolasini bosish ---
  document.addEventListener("click", function (e) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target.closest && e.target.closest("a[href]");
    if (!a || a.target === "_blank") return;
    var url;
    try { url = new URL(a.href, location.href); } catch (err) { return; }
    if (url.origin !== location.origin || !/^\/car\/\d+/.test(url.pathname) || url.pathname === location.pathname) return;
    var ad = nextAd();
    if (!ad) return;
    e.preventDefault();
    show(ad, url.href);
  });

  // --- Reklama oynasi ---
  function show(ad, carUrl) {
    markSeen(ad);
    var done = false;
    var root = document.createElement("div");
    root.className = "ad";
    root.setAttribute("role", "dialog");
    root.setAttribute("aria-modal", "true");
    root.setAttribute("aria-label", t("ad.label") + ": " + ad.title);
    root.innerHTML =
      '<div class="ad__stage">' +
      '<video class="ad__video" playsinline muted autoplay preload="auto"></video>' +
      '<a class="ad__hit" target="_blank" rel="noopener sponsored" aria-label="' + IB.esc(t("ad.open") + ": " + ad.title) + '"></a>' +
      '<div class="ad__top">' +
      '<span class="ad__label">' + IB.esc(t("ad.label")) + "</span>" +
      '<button class="ad__sound" type="button" aria-pressed="false" aria-label="' + IB.esc(t("ad.soundOn")) + '">' + IB.icon("volumeX") + "</button>" +
      "</div>" +
      '<div class="ad__bottom">' +
      '<a class="ad__cta" target="_blank" rel="noopener sponsored"><span>' + IB.esc(ad.title) + "</span><b>" + IB.esc(t("ad.more")) + IB.icon("external") + "</b></a>" +
      '<button class="ad__skip" type="button" disabled><span class="ad__skip-text"></span></button>' +
      "</div>" +
      '<div class="ad__progress" aria-hidden="true"><span></span></div>' +
      "</div>";
    var video = root.querySelector(".ad__video");
    var hit = root.querySelector(".ad__hit");
    var cta = root.querySelector(".ad__cta");
    var sound = root.querySelector(".ad__sound");
    var skip = root.querySelector(".ad__skip");
    var skipText = root.querySelector(".ad__skip-text");
    var bar = root.querySelector(".ad__progress span");
    hit.href = cta.href = ad.link;
    // Ovoz boshida o'chiq (atributning o'zi ba'zi brauzerlarda yetmaydi — xususiyatni ham qo'yamiz)
    video.muted = true;
    video.defaultMuted = true;
    video.src = ad.video;

    document.body.appendChild(root);
    document.body.classList.add("is-locked");
    requestAnimationFrame(function () { root.classList.add("is-open"); });
    track(ad, "view");

    // Skip taymeri (video yuklanmasa ham 3 soniyadan keyin o'tkazish mumkin)
    var left = SKIP_AFTER;
    function renderSkip() {
      if (left > 0) {
        skipText.textContent = t("ad.skipIn", { n: left });
      } else {
        skip.disabled = false;
        skip.classList.add("is-ready");
        skipText.innerHTML = IB.esc(t("ad.skip")) + IB.icon("chevR");
      }
    }
    renderSkip();
    var timer = setInterval(function () {
      left -= 1;
      renderSkip();
      if (left <= 0) clearInterval(timer);
    }, 1000);

    var playing = video.play();
    if (playing && playing.catch) playing.catch(function () {});
    video.addEventListener("timeupdate", function () {
      if (video.duration) bar.style.width = (video.currentTime / video.duration) * 100 + "%";
    });
    video.addEventListener("ended", function () { finish(); });

    sound.addEventListener("click", function () {
      video.muted = !video.muted;
      if (!video.muted && video.paused) video.play().catch(function () {});
      sound.innerHTML = IB.icon(video.muted ? "volumeX" : "volume");
      sound.setAttribute("aria-pressed", video.muted ? "false" : "true");
      sound.setAttribute("aria-label", t(video.muted ? "ad.soundOn" : "ad.soundOff"));
    });

    // Reklamaga bosish: havola yangi oynada (brauzerning o'zi ochadi), bu oynada — tanlangan mashina
    function onAdClick() {
      track(ad, "click");
      setTimeout(finish, 150);
    }
    hit.addEventListener("click", onAdClick);
    cta.addEventListener("click", onAdClick);

    skip.addEventListener("click", function () {
      if (skip.disabled) return;
      track(ad, "skip");
      finish();
    });
    function onKey(e) {
      if (e.key === "Escape" && !skip.disabled) skip.click();
    }
    document.addEventListener("keydown", onKey);
    skip.focus({ preventScroll: true });

    function finish() {
      if (done) return;
      done = true;
      clearInterval(timer);
      video.pause();
      document.removeEventListener("keydown", onKey);
      IB.navigate(carUrl);
    }
  }
})();
