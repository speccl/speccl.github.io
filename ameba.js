/* AMEBA — comportamiento de la pagina (sin dependencias) */
(function () {
  "use strict";

  /* ---------- reveal por scroll ---------- */
  function initReveal() {
    var targets = document.querySelectorAll(".am-reveal, [data-reveal]");
    if (!("IntersectionObserver" in window)) {
      targets.forEach(function (el) { el.classList.add("is-in"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el = e.target;
        var d = el.getAttribute("data-delay");
        if (d) el.style.transitionDelay = d + "ms";
        el.classList.add("is-in");
        io.unobserve(el);
      });
    }, { threshold: 0.18, rootMargin: "0px 0px -60px 0px" });
    targets.forEach(function (el) { io.observe(el); });
  }

  /* ---------- tabs de modulos ---------- */
  function initTabs() {
    var list = document.querySelector("[data-tabs]");
    if (!list) return;
    var tabs = Array.prototype.slice.call(list.querySelectorAll("[role=tab]"));

    function select(tab, focus) {
      tabs.forEach(function (t) {
        var on = t === tab;
        t.setAttribute("aria-selected", on ? "true" : "false");
        t.setAttribute("tabindex", on ? "0" : "-1");
        var panel = document.getElementById(t.getAttribute("aria-controls"));
        if (panel) panel.setAttribute("data-active", on ? "true" : "false");
        if (on && panel) {
          // relanza las animaciones de la ilustracion del panel
          panel.classList.remove("is-in");
          void panel.offsetWidth;
          panel.classList.add("is-in");
        }
      });
      if (focus) tab.focus();
    }

    tabs.forEach(function (tab, i) {
      tab.addEventListener("click", function () { select(tab); });
      tab.addEventListener("keydown", function (ev) {
        var d = ev.key === "ArrowRight" ? 1 : ev.key === "ArrowLeft" ? -1 : 0;
        if (!d) return;
        ev.preventDefault();
        select(tabs[(i + d + tabs.length) % tabs.length], true);
      });
    });

    // permite enlazar un modulo concreto: .../ameba#invx
    var hash = (location.hash || "").replace("#", "");
    var target = hash && tabs.filter(function (t) { return t.dataset.module === hash; })[0];
    select(target || tabs[0]);

    // los enlaces del diagrama de horizontes abren su modulo
    document.querySelectorAll("[data-goto-module]").forEach(function (el) {
      el.addEventListener("click", function (ev) {
        ev.preventDefault();
        var name = el.getAttribute("data-goto-module");
        var t = tabs.filter(function (x) { return x.dataset.module === name; })[0];
        if (!t) return;
        select(t);
        var sec = document.getElementById("ameba-modules");
        if (sec) sec.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
  }

  /* ---------- longitud real de los trazos SVG animados ---------- */
  function initTraces() {
    document.querySelectorAll(".am-trace").forEach(function (p) {
      try {
        var len = Math.ceil(p.getTotalLength());
        p.style.setProperty("--len", len);
      } catch (e) { /* elementos sin geometria */ }
    });
  }

  /* ---------- SMIL: pausar si el usuario pidio menos movimiento ---------- */
  function initReducedMotion() {
    var mq = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!mq || !mq.matches) return;
    document.querySelectorAll("svg").forEach(function (svg) {
      if (svg.pauseAnimations) svg.pauseAnimations();
    });
  }

  function boot() {
    initReducedMotion();
    initTraces();
    initReveal();
    initTabs();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
