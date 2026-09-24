/* COLUMNA «CARGAR A CERO, DESCARGAR A CERO» — canvas del hero y reveals.
   Sin dependencias. Las figuras del cuerpo son SVG generado en Python y no
   necesitan nada de aqui: si este archivo no carga, el articulo se lee
   entero y con todas sus figuras.

   El hero es la matriz semana x hora del costo marginal proyectado en
   Crucero (mediana entre hidrologias de la corrida PLP del 22-09-2026): una
   columna por semana, una fila por hora. Los datos NO viven aqui: llegan en
   el atributo data-matriz del canvas, que escribe costocero.py desde
   costocero_datos.py. Asi no hay una segunda copia que actualizar. */
(function () {
  "use strict";
  var REDUCED = window.matchMedia &&
                window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var TECHO = 62;                 // USD/MWh: el tope de la escala de color
  var C0 = [16, 74, 90];          // teal oscuro: precio bajo
  var C1 = [231, 200, 115];       // dorado: precio alto

  function color(v, a) {
    if (v < 0.5) return "rgba(120,190,205," + (0.07 * a).toFixed(3) + ")";
    var t = Math.min(1, v / TECHO), c = [];
    for (var k = 0; k < 3; k++) c.push(Math.round(C0[k] + (C1[k] - C0[k]) * t));
    return "rgba(" + c.join(",") + "," + ((0.35 + 0.6 * t) * a).toFixed(3) + ")";
  }

  function hero() {
    var cv = document.getElementById("cc-hero");
    if (!cv) return;
    var datos;
    try { datos = JSON.parse(cv.getAttribute("data-matriz")); } catch (e) { return; }
    var M = datos.m, NS = M.length, NH = M[0].length;
    var ctx = cv.getContext("2d");
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var W = 0, H = 0, box = null, raf = null, t0 = 0;

    function resize() {
      W = cv.clientWidth; H = cv.clientHeight;
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      /* Mismo cuadrante que el hero de vertimiento: abajo a la derecha, donde
         el titular ya no llega. */
      var wide = W >= 1100;
      box = {
        x0: W * (wide ? 0.575 : 0.40), x1: W - Math.max(26, W * 0.05),
        y0: H * 0.30, y1: H * 0.78
      };
    }

    function rotulo(txt, x, y, a, align) {
      ctx.font = "600 11.5px 'Be Vietnam Pro', Arial, sans-serif";
      ctx.textAlign = align || "left";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "rgba(255,255,255," + (0.55 * a).toFixed(2) + ")";
      ctx.fillText(txt, x, y);
    }

    function dibujar(p) {
      var cw = (box.x1 - box.x0) / NS, ch = (box.y1 - box.y0) / NH;
      var gap = Math.min(2, cw * 0.14);
      ctx.clearRect(0, 0, W, H);
      /* entra columna a columna, de septiembre hacia abril */
      var hasta = p * NS;
      for (var s = 0; s < NS; s++) {
        var a = Math.max(0, Math.min(1, hasta - s));
        if (!a) break;
        for (var h = 0; h < NH; h++) {
          ctx.fillStyle = color(M[s][h], a);
          ctx.fillRect(box.x0 + s * cw + gap / 2, box.y0 + h * ch + gap / 2,
                       cw - gap, ch - gap);
        }
      }
      if (p > 0.8) {
        var q = Math.min(1, (p - 0.8) / 0.2);
        datos.meses.forEach(function (m) {
          rotulo(m[1], box.x0 + m[0] * cw + 2, box.y1 + 16, q);
        });
        rotulo("0 h", box.x0 - 8, box.y0 + ch / 2, q, "right");
        rotulo("12 h", box.x0 - 8, box.y0 + ch * 12.5, q, "right");
        rotulo("23 h", box.x0 - 8, box.y0 + ch * 23.5, q, "right");
      }
    }

    function frame(t) {
      if (!t0) t0 = t;
      var p = Math.min(1, (t - t0) / 2100);
      dibujar(1 - Math.pow(1 - p, 2));
      if (p < 1) raf = requestAnimationFrame(frame);
    }

    /* En pestana oculta el navegador congela requestAnimationFrame y la
       entrada se quedaria a medio dibujar: ahi se pinta el estado final. */
    function arrancar() {
      cancelAnimationFrame(raf);
      if (document.hidden || REDUCED) { dibujar(1); return; }
      t0 = 0;
      raf = requestAnimationFrame(frame);
    }

    resize();
    window.addEventListener("resize", function () { resize(); arrancar(); });
    arrancar();
    document.addEventListener("visibilitychange", arrancar);
  }

  /* ---------- reveal por scroll (igual que vertimiento.js) ---------- */
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

  function boot() { hero(); reveals(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
