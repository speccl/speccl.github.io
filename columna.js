/* COLUMNAS — canvas del hero y reveals por scroll. Sin dependencias. */
(function () {
  "use strict";
  var REDUCED = window.matchMedia &&
                window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ============================================================
     La cartera de suministro regulado en el tiempo.
     Energia bajo contrato por anio, en GWh, y dentro de ella el
     tramo con precio indexado sobre 130 USD/MWh a junio de 2026.
     Es descriptivo a proposito: no supone ninguna negociacion ni
     adelanta un resultado, solo muestra que la cartera se desarma
     sola y que el tramo caro se extingue en 2033. Sale de
     data/contratos.json ponderando cada contrato por la fraccion
     de meses vigentes del anio.
     Para actualizarlo, recalcular y reemplazar el array.
     ============================================================ */
  var CARTERA = [
    [2026, 32365, 11469], [2027, 32510, 11304], [2028, 33125, 11304],
    [2029, 33125, 11304], [2030, 33125, 11304], [2031, 29430, 11159],
    [2032, 28810, 11039], [2033, 22810,  5039], [2034, 17810,    39],
    [2035, 17810,    39], [2036, 17810,    39], [2037, 16610,     0],
    [2038, 16610,     0], [2039, 16610,     0], [2040, 16610,     0],
    [2041, 11984,     0], [2042,  5120,     0], [2043,  5120,     0],
    [2044,  3600,     0], [2045,  3600,     0], [2046,  3600,     0],
    [2047,  2100,     0]
  ];
  var C_TOT  = "120,164,180";    // acero: toda la energia contratada
  var C_ALTO = "231,200,115";    // dorado: el tramo sobre 130 USD/MWh

  function hero() {
    var cv = document.getElementById("co-traj");
    if (!cv) return;
    var ctx = cv.getContext("2d");
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var W = 0, H = 0, box = null, raf = null, t0 = 0;

    var TECHO = 34000;                           // GWh/anio, escala holgada

    function resize() {
      W = cv.clientWidth; H = cv.clientHeight;
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // El grafico ocupa el vacio de abajo a la derecha: el titular llega
      // hasta ~0.42H y ahi abajo no hay texto que estorbar.
      var wide = W >= 1100;
      box = {
        x0: W * (wide ? 0.575 : 0.33), x1: W - Math.max(26, W * 0.05),
        y0: H * 0.40, y1: H * 0.75
      };
    }

    function px(i) { return box.x0 + (box.x1 - box.x0) * (i / CARTERA.length); }
    function py(v) { return box.y1 - (box.y1 - box.y0) * (v / TECHO); }

    function rotulo(txt, x, y, color, align, peso) {
      ctx.font = (peso || 600) + " 11.5px 'Be Vietnam Pro', Arial, sans-serif";
      ctx.textAlign = align || "left";
      ctx.textBaseline = "middle";
      ctx.fillStyle = color;
      ctx.fillText(txt, x, y);
    }

    /* Escalonado, no suavizado: un contrato no se apaga de a poco, deja de
       estar vigente en una fecha. La escalera es el dato. */
    function area(col, hasta, relleno, trazo) {
      ctx.beginPath();
      ctx.moveTo(px(0), box.y1);
      for (var i = 0; i < hasta; i++) {
        ctx.lineTo(px(i), py(CARTERA[i][col]));
        ctx.lineTo(px(i + 1), py(CARTERA[i][col]));
      }
      ctx.lineTo(px(hasta), box.y1);
      ctx.closePath();
      ctx.fillStyle = relleno; ctx.fill();
      if (!trazo) return;
      // el contorno superior, sin las verticales de los extremos
      ctx.beginPath();
      for (var j = 0; j < hasta; j++) {
        if (j === 0) ctx.moveTo(px(0), py(CARTERA[0][col]));
        else ctx.lineTo(px(j), py(CARTERA[j][col]));
        ctx.lineTo(px(j + 1), py(CARTERA[j][col]));
      }
      ctx.strokeStyle = trazo; ctx.lineWidth = 1.8;
      ctx.lineJoin = "round"; ctx.lineCap = "round";
      ctx.stroke();
    }

    function dibujar(p) {
      var n = CARTERA.length;
      var hasta = Math.max(1, Math.round(n * (1 - Math.pow(1 - p, 3))));

      ctx.clearRect(0, 0, W, H);

      // linea de base
      ctx.strokeStyle = "rgba(255,255,255,.18)"; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(box.x0, box.y1); ctx.lineTo(box.x1, box.y1); ctx.stroke();

      // el relleno del total va bajo, casi insinuado, y el peso lo lleva su
      // contorno: a .20 el area entera se leia como un bloque gris. El tramo
      // caro va encima con bastante mas cuerpo, o el dorado sobre el acero
      // sobre el fondo azul termina en un caqui apagado.
      area(1, hasta, "rgba(" + C_TOT + ",.12)", "rgba(" + C_TOT + ",.8)");
      area(2, hasta, "rgba(" + C_ALTO + ",.82)", "rgba(" + C_ALTO + ",1)");

      if (p > .8) {
        var a = Math.min(1, (p - .8) / .2);
        // los anios de los extremos y el del quiebre
        [[0, "2026", "left"], [7, "2033", "center"], [n, "2047", "right"]].forEach(
          function (t) {
            rotulo(t[1], px(t[0]), box.y1 + 16,
                   "rgba(255,255,255," + (.6 * a).toFixed(2) + ")", t[2]);
          });
        // los rotulos vienen del contenido, que existe en dos idiomas
        rotulo(cv.dataset.serieTotal || "energía bajo contrato",
               px(2), py(33125) - 14,
               "rgba(" + C_TOT + "," + a.toFixed(2) + ")", "left", 700);
        rotulo(cv.dataset.serieAlto || "sobre 130 USD/MWh",
               px(2), py(11304) - 14,
               "rgba(" + C_ALTO + "," + a.toFixed(2) + ")", "left", 700);
      }
    }

    function frame(t) {
      if (!t0) t0 = t;
      var p = Math.min(1, (t - t0) / 1900);
      dibujar(p);
      if (p < 1) raf = requestAnimationFrame(frame);
    }

    /* Arranque. En pestana oculta el navegador congela requestAnimationFrame
       y la entrada se quedaria a medio dibujar; ahi se pinta directamente el
       estado final y la animacion se guarda para cuando la pagina se vea. */
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
