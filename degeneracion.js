/* Columna «Cuando el óptimo no es único». Dos cosas:

   1. El reveal por scroll de los bloques .co-r, el mismo de las otras columnas.
   2. La figura `despacho`: tres baterías que se reparten de cinco maneras el
      mismo total. Los cinco repartos vienen en `data-repartos` desde Python
      (degeneracion_art.g_despacho) —el JS no guarda una copia de los datos—,
      junto con la línea del cero y la escala en MW por píxel. Se recorren
      interpolando: cada cuadro intermedio también es un reparto óptimo.

   Avanza sola sólo mientras la figura está en pantalla y nunca con
   movimiento reducido; los puntos de abajo eligen un reparto y detienen el
   avance automático. */
(function () {
  "use strict";

  var QUIETO = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var PAUSA = 2600, TRANSICION = 900;

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

  function suave(x) { return x < .5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2; }

  function animar(svg) {
    var R = JSON.parse(svg.getAttribute("data-repartos"));
    var cero = parseFloat(svg.getAttribute("data-cero"));
    var esc = parseFloat(svg.getAttribute("data-esc"));
    var barras = {};
    Array.prototype.forEach.call(svg.querySelectorAll(".dg-b"), function (r) {
      barras[r.getAttribute("data-k") + r.getAttribute("data-i") + "_" + r.getAttribute("data-h")] = r;
    });
    var puntos = svg.querySelectorAll(".dg-dot");
    var cuenta = svg.querySelector(".dg-cuenta");
    var fmt = cuenta.getAttribute("data-fmt");
    var actual = 0, timer = null, raf = null, visible = false, manual = false;

    function pintar(a, b, f) {
      for (var h = 0; h < 24; h++) {
        var bd = 0, bc = 0;
        for (var i = 0; i < 3; i++) {
          var d = R[a][0][i][h] + (R[b][0][i][h] - R[a][0][i][h]) * f;
          var c = R[a][1][i][h] + (R[b][1][i][h] - R[a][1][i][h]) * f;
          var rd = barras["d" + i + "_" + h], rc = barras["c" + i + "_" + h];
          rd.setAttribute("y", (cero - (bd + d) * esc).toFixed(1));
          rd.setAttribute("height", (d * esc).toFixed(1));
          rc.setAttribute("y", (cero + bc * esc).toFixed(1));
          rc.setAttribute("height", (c * esc).toFixed(1));
          bd += d; bc += c;
        }
      }
    }

    function marcar(k) {
      Array.prototype.forEach.call(puntos, function (p) {
        p.classList.toggle("on", +p.getAttribute("data-k") === k);
      });
      cuenta.textContent = fmt.replace("%d", k + 1).replace("%d", R.length);
    }

    function ir(k, instantaneo) {
      if (raf) cancelAnimationFrame(raf);
      var desde = actual;
      actual = k;
      marcar(k);
      if (instantaneo || QUIETO) { pintar(k, k, 0); return; }
      var t0 = null;
      function paso(t) {
        if (t0 === null) t0 = t;
        var f = Math.min(1, (t - t0) / TRANSICION);
        pintar(desde, k, suave(f));
        if (f < 1) raf = requestAnimationFrame(paso);
      }
      raf = requestAnimationFrame(paso);
    }

    function programar() {
      clearTimeout(timer);
      if (QUIETO || manual || !visible) return;
      timer = setTimeout(function () { ir((actual + 1) % R.length); programar(); }, PAUSA);
    }

    Array.prototype.forEach.call(puntos, function (p) {
      function elegir(e) {
        if (e.type === "keydown" && e.key !== "Enter" && e.key !== " ") return;
        e.preventDefault();
        manual = true;
        clearTimeout(timer);
        ir(+p.getAttribute("data-k"));
      }
      p.addEventListener("click", elegir);
      p.addEventListener("keydown", elegir);
    });

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (es) {
        visible = es[0].isIntersecting;
        if (visible) programar(); else clearTimeout(timer);
      }, { threshold: .4 }).observe(svg);
    }
  }

  function iniciar() {
    reveals();
    Array.prototype.forEach.call(document.querySelectorAll("svg.dg-anim"), animar);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", iniciar);
  else iniciar();
})();
