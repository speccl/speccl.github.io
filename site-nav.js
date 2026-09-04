/* Navegación compartida por las páginas propias: fondo de la barra al hacer
   scroll, menú móvil y selector de idioma. Vive aquí y no en ameba.js porque
   ABEX también lo necesita.
   Replica lo que hace el sitio real: sobre el hero la barra es casi
   transparente, y apenas hay scroll toma el azul marino sólido. Sin esto el
   texto blanco del menú desaparece sobre las secciones claras. */
(function () {
  "use strict";
  var GHOST = "bg-white/2";       // clases del bundle Tailwind del sitio
  var SOLID = "bg-[#071828]";

  function init() {
    var nav = document.querySelector("nav");
    if (!nav) return;
    var solid = null;
    function update() {
      var next = window.scrollY > 40;
      if (next === solid) return;
      solid = next;
      nav.classList.toggle(SOLID, next);
      nav.classList.toggle(GHOST, !next);
    }
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update, { passive: true });
    update();
  }

  /* ---------- menu movil ---------- */
  function initMobileMenu() {
    var overlay = document.querySelector(".am-mobile");
    if (!overlay) return;
    function setOpen(open) {
      overlay.setAttribute("data-open", open ? "true" : "false");
      document.body.style.overflow = open ? "hidden" : "";
    }
    document.querySelectorAll("[data-menu-open]").forEach(function (b) {
      b.addEventListener("click", function () { setOpen(true); });
    });
    document.querySelectorAll("[data-menu-close]").forEach(function (b) {
      b.addEventListener("click", function () { setOpen(false); });
    });
    overlay.querySelectorAll("[data-submenu]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var sub = document.getElementById(btn.getAttribute("data-submenu"));
        var chev = btn.querySelector(".am-mobile-chev");
        var open = sub.getAttribute("data-open") !== "true";
        sub.setAttribute("data-open", open ? "true" : "false");
        if (chev) chev.setAttribute("data-open", open ? "true" : "false");
      });
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") setOpen(false);
    });
  }

  /* ---------- selector de idioma (mismo gesto que el sitio) ---------- */
  function initLangSwitch() {
    var box = document.querySelector("[data-lang-switch]");
    if (!box) return;
    var slot = box.querySelector("[data-lang-slot]");
    function show(on) {
      if (!slot) return;
      slot.style.maxWidth = on ? "40px" : "0px";
      slot.style.opacity = on ? "1" : "0";
      slot.style.transform = on ? "none" : "translateX(-4px)";
    }
    box.addEventListener("mouseenter", function () { show(true); });
    box.addEventListener("mouseleave", function () { show(false); });
    box.addEventListener("focusin", function () { show(true); });
    box.addEventListener("focusout", function () { show(false); });
  }


  function boot() {
    init();
    initMobileMenu();
    initLangSwitch();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
