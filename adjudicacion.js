/* Columna «Adjudicación de ofertas del proceso 2026/01»: el reveal por scroll de los bloques
   .co-r, el mismo de las otras columnas. Sin IntersectionObserver, o con
   movimiento reducido, los bloques se muestran de una vez. */
(function () {
  "use strict";
  var els = document.querySelectorAll(".co-r");
  var quieto = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (quieto || !("IntersectionObserver" in window)) {
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
})();
