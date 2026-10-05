/* Columna «Redes para el clima que viene». El hero es una imagen fija, así
   que aquí sólo queda el reveal por scroll de los bloques .co-r (el mismo de
   vertimiento.js y costocero.js). */
(function () {
  "use strict";

  function reveals() {
    var els = document.querySelectorAll(".co-r");
    if (!("IntersectionObserver" in window)) {
      Array.prototype.forEach.call(els, function (e) { e.classList.add("in"); });
      return;
    }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        var d = e.target.getAttribute("data-d");
        if (d) e.target.style.transitionDelay = d + "ms";
        e.target.classList.add("in");
        io.unobserve(e.target);
      });
    }, { threshold: .16, rootMargin: "0px 0px -70px 0px" });
    Array.prototype.forEach.call(els, function (e) { io.observe(e); });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", reveals);
  else reveals();
})();
