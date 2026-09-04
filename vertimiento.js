/* COLUMNA DE VERTIMIENTO — canvas del hero y reveals por scroll.
   Sin dependencias. Los graficos del cuerpo son SVG generado en Python y no
   necesitan nada de aqui: si este archivo no carga, el articulo se lee
   entero y con todas sus figuras. */
(function () {
  "use strict";
  var REDUCED = window.matchMedia &&
                window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ============================================================
     Las dos series del hero, trimestre a trimestre desde 2021.
     [etiqueta, vertimiento solar+eolico GWh/trimestre, potencia BESS MW]
     Sale de vertimiento_datos.py (VERTIMIENTO y BESS_MES) agregado por
     trimestre. Solo van trimestres COMPLETOS: el ultimo dato consolidado
     es julio de 2026, asi que la serie cierra en el segundo trimestre.
     Para actualizarlo, recalcular y reemplazar el array.
     ============================================================ */
  var SERIE = [
    ["2021", 52, 0], [null, 7, 0], [null, 99, 0], [null, 301, 0],
    ["2022", 264, 0], [null, 135, 0], [null, 375, 0], [null, 697, 0],
    ["2023", 458, 84], [null, 416, 199], [null, 619, 341], [null, 1207, 582],
    ["2024", 1455, 666], [null, 582, 989], [null, 1138, 1118], [null, 2458, 1169],
    ["2025", 1590, 1481], [null, 806, 1914], [null, 1320, 2353], [null, 2329, 2982],
    ["2026", 1869, 4062], [null, 627, 5232]
  ];
  var C_VERT = "231,200,115";    // dorado: el vertimiento
  var C_BESS = "120,190,205";    // teal claro: la potencia de baterias

  function hero() {
    var cv = document.getElementById("vt-hero");
    if (!cv) return;
    var ctx = cv.getContext("2d");
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var W = 0, H = 0, box = null, raf = null, t0 = 0;

    var TECHO_V = 2600;          // GWh por trimestre
    var TECHO_B = 5600;          // MW

    function resize() {
      W = cv.clientWidth; H = cv.clientHeight;
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      /* El dibujo ocupa el vacio de abajo a la derecha: el titular llega
         hasta ~0.42H y ahi abajo no hay texto que estorbar. */
      var wide = W >= 1100;
      box = {
        x0: W * (wide ? 0.575 : 0.33), x1: W - Math.max(26, W * 0.05),
        y0: H * 0.40, y1: H * 0.75
      };
    }

    function px(i) { return box.x0 + (box.x1 - box.x0) * (i / (SERIE.length - 1)); }
    function py(v, techo) { return box.y1 - (box.y1 - box.y0) * (v / techo); }

    function rotulo(txt, x, y, color, align, peso) {
      ctx.font = (peso || 600) + " 11.5px 'Be Vietnam Pro', Arial, sans-serif";
      ctx.textAlign = align || "left";
      ctx.textBaseline = "middle";
      ctx.fillStyle = color;
      ctx.fillText(txt, x, y);
    }

    function trazo(col, techo, hasta, relleno) {
      var i;
      if (relleno) {
        ctx.beginPath();
        ctx.moveTo(px(0), box.y1);
        for (i = 0; i < hasta; i++) ctx.lineTo(px(i), py(SERIE[i][col], techo));
        ctx.lineTo(px(hasta - 1), box.y1);
        ctx.closePath();
        ctx.fillStyle = relleno; ctx.fill();
      }
      ctx.beginPath();
      for (i = 0; i < hasta; i++) {
        if (i === 0) ctx.moveTo(px(0), py(SERIE[0][col], techo));
        else ctx.lineTo(px(i), py(SERIE[i][col], techo));
      }
      ctx.strokeStyle = "rgba(" + (col === 1 ? C_VERT : C_BESS) + ",1)";
      ctx.lineWidth = 2; ctx.lineJoin = "round"; ctx.lineCap = "round";
      ctx.stroke();
    }

    function dibujar(p) {
      var n = SERIE.length;
      var hasta = Math.max(2, Math.round(n * (1 - Math.pow(1 - p, 3))));

      ctx.clearRect(0, 0, W, H);
      ctx.strokeStyle = "rgba(255,255,255,.18)"; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(box.x0, box.y1); ctx.lineTo(box.x1, box.y1); ctx.stroke();

      trazo(1, TECHO_V, hasta, "rgba(" + C_VERT + ",.16)");
      trazo(2, TECHO_B, hasta, null);

      if (p > .8) {
        var a = Math.min(1, (p - .8) / .2);
        for (var i = 0; i < n; i++) {
          if (!SERIE[i][0]) continue;
          rotulo(SERIE[i][0], px(i), box.y1 + 16,
                 "rgba(255,255,255," + (.55 * a).toFixed(2) + ")", "center");
        }
        rotulo(cv.dataset.serieVert || "vertimiento",
               px(15), py(SERIE[15][1], TECHO_V) - 14,
               "rgba(" + C_VERT + "," + a.toFixed(2) + ")", "center", 700);
        rotulo(cv.dataset.serieBess || "potencia de baterías",
               px(19), py(SERIE[19][2], TECHO_B) - 14,
               "rgba(" + C_BESS + "," + a.toFixed(2) + ")", "center", 700);
      }
    }

    function frame(t) {
      if (!t0) t0 = t;
      var p = Math.min(1, (t - t0) / 1900);
      dibujar(p);
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

  /* ---------- reveal por scroll ---------- */
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
