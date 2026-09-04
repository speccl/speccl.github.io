/* GALILEI — canvas del hero, pestañas de módulos y reveals por scroll.
   Generado a mano; acompaña a custom/galilei.py. Sin dependencias. */
(function () {
  "use strict";

  var reduce = window.matchMedia &&
               window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ==========================================================
     HERO — convergencia
     Diez orígenes dispersos emiten partículas que convergen en un
     punto y salen ordenadas en carriles paralelos. Va en la mitad
     derecha, que es la que el velo del hero deja ver.
     Es el mismo argumento de la página, dibujado.
     ========================================================== */
  function hero() {
    var cv = document.getElementById("gl-conv");
    if (!cv || !cv.getContext) return;
    var ctx = cv.getContext("2d");
    var W = 0, H = 0, dpr = 1;
    var srcs = [], lanes = [], parts = [], hub = { x: 0, y: 0 };

    var SRC_N = 10, LANE_N = 7, PART_N = reduce ? 90 : 200;

    function layout() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = cv.clientWidth; H = cv.clientHeight;
      cv.width = Math.round(W * dpr);
      cv.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      hub.x = W * 0.76; hub.y = H * 0.52;

      srcs.length = 0;
      for (var i = 0; i < SRC_N; i++) {
        // repartidos en la banda izquierda, con un desorden estable
        var f = (i + 0.5) / SRC_N;
        srcs.push({
          x: W * (0.40 + 0.13 * ((i * 7) % 5) / 5),
          y: H * (0.08 + 0.84 * f),
          r: 2 + ((i * 3) % 3)
        });
      }

      lanes.length = 0;
      for (var j = 0; j < LANE_N; j++) {
        lanes.push(hub.y + (j - (LANE_N - 1) / 2) * Math.max(14, H * 0.045));
      }
    }

    function spawn(p, seed) {
      var s = srcs[(seed | 0) % srcs.length];
      p.sx = s.x; p.sy = s.y;
      p.cx = (s.x + hub.x) / 2 + (hub.x - s.x) * 0.18;
      p.cy = s.y;                                  // sale horizontal y luego dobla
      p.lane = lanes[(seed * 3 | 0) % lanes.length];
      p.t = -Math.random() * 0.9;                  // arranques escalonados
      p.v = 0.0022 + Math.random() * 0.0032;
      p.a = 0.25 + Math.random() * 0.6;
    }

    function build() {
      parts.length = 0;
      for (var i = 0; i < PART_N; i++) {
        var p = {};
        spawn(p, i);
        parts.push(p);
      }
    }

    function pos(p, t) {
      if (t <= 1) {
        // cuadrática desde el origen hasta el hub
        var u = 1 - t;
        return {
          x: u * u * p.sx + 2 * u * t * p.cx + t * t * hub.x,
          y: u * u * p.sy + 2 * u * t * p.cy + t * t * hub.y
        };
      }
      // ya pasó por el hub: sale recto por su carril
      var k = Math.min((t - 1) / 0.35, 1);
      return {
        x: hub.x + (W * 1.06 - hub.x) * (t - 1),
        y: hub.y + (p.lane - hub.y) * k
      };
    }

    function frame() {
      ctx.clearRect(0, 0, W, H);

      // guías: origen -> hub
      ctx.lineWidth = 1;
      for (var i = 0; i < srcs.length; i++) {
        var s = srcs[i];
        ctx.strokeStyle = "rgba(159,186,199,.10)";
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.quadraticCurveTo((s.x + hub.x) / 2 + (hub.x - s.x) * 0.18, s.y, hub.x, hub.y);
        ctx.stroke();

        ctx.fillStyle = "rgba(159,186,199,.34)";
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, 6.284);
        ctx.fill();
      }

      // carriles de salida
      ctx.strokeStyle = "rgba(231,200,115,.08)";
      for (var j = 0; j < lanes.length; j++) {
        ctx.beginPath();
        ctx.moveTo(hub.x, lanes[j]);
        ctx.lineTo(W, lanes[j]);
        ctx.stroke();
      }

      // partículas
      for (var k = 0; k < parts.length; k++) {
        var p = parts[k];
        if (p.t > 0) {
          var a = pos(p, p.t);
          var ordered = p.t > 1;
          ctx.fillStyle = ordered
            ? "rgba(231,200,115," + (p.a * 0.85) + ")"
            : "rgba(159,186,199," + (p.a * 0.7) + ")";
          ctx.fillRect(a.x - 1.1, a.y - 1.1, ordered ? 4.5 : 2.2, 2.2);
        }
        if (!reduce) p.t += p.v;
        if (p.t > 2) spawn(p, (k * 13 + Math.floor(p.v * 1e5)) | 0);
      }

      // el hub
      var g = ctx.createRadialGradient(hub.x, hub.y, 0, hub.x, hub.y, 46);
      g.addColorStop(0, "rgba(231,200,115,.32)");
      g.addColorStop(1, "rgba(231,200,115,0)");
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(hub.x, hub.y, 46, 0, 6.284); ctx.fill();

      ctx.strokeStyle = "rgba(231,200,115,.55)";
      ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.arc(hub.x, hub.y, 15, 0, 6.284); ctx.stroke();

      if (!reduce) raf = requestAnimationFrame(frame);
    }

    var raf = 0;
    function restart() {
      layout(); build();
      if (raf) cancelAnimationFrame(raf);
      // con movimiento reducido se pinta un solo fotograma
      if (reduce) { for (var i = 0; i < parts.length; i++) parts[i].t = 0.2 + (i % 9) * 0.2; }
      frame();
    }

    restart();

    var to;
    window.addEventListener("resize", function () {
      clearTimeout(to);
      to = setTimeout(restart, 180);
    });

    // no gastar cuadros con el hero fuera de pantalla
    if (!reduce && "IntersectionObserver" in window) {
      new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          if (e.isIntersecting) { if (!raf) frame(); }
          else if (raf) { cancelAnimationFrame(raf); raf = 0; }
        });
      }, { threshold: 0 }).observe(cv);
    }
  }

  /* ==========================================================
     PESTAÑAS de los módulos en detalle
     ========================================================== */
  function tabs() {
    var root = document.querySelector("[data-tabs]");
    if (!root) return;
    var btns = [].slice.call(root.querySelectorAll(".gl-tab"));
    var panels = [].slice.call(root.querySelectorAll(".gl-panel"));

    function show(i) {
      btns.forEach(function (b, k) {
        b.setAttribute("aria-selected", k === i ? "true" : "false");
        b.tabIndex = k === i ? 0 : -1;
      });
      panels.forEach(function (p, k) {
        if (k === i) p.removeAttribute("hidden"); else p.setAttribute("hidden", "");
      });
    }

    btns.forEach(function (b, i) {
      b.addEventListener("click", function () { show(i); });
      b.addEventListener("keydown", function (e) {
        var d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
        if (!d) return;
        e.preventDefault();
        var n = (i + d + btns.length) % btns.length;
        show(n); btns[n].focus();
      });
    });
    show(0);
  }

  /* ==========================================================
     REVEALS y animaciones que se disparan al entrar en pantalla
     ========================================================== */
  function reveals() {
    // la curva definitiva se dibuja sola: hay que medirla primero
    [].forEach.call(document.querySelectorAll(".gl-line.is-final"), function (p) {
      try { p.style.setProperty("--len", Math.ceil(p.getTotalLength())); } catch (e) {}
    });

    var targets = [].slice.call(
      document.querySelectorAll(".gl-r, .gl-mx, .gl-svg"));

    if (!("IntersectionObserver" in window)) {
      targets.forEach(function (el) { el.classList.add("in", "gl-inview"); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el = e.target;
        var d = parseInt(el.getAttribute("data-d") || "0", 10);
        setTimeout(function () { el.classList.add("in", "gl-inview"); }, d);
        io.unobserve(el);
      });
    }, { rootMargin: "0px 0px -12% 0px", threshold: 0.12 });

    targets.forEach(function (el) { io.observe(el); });
  }

  function boot() { hero(); tabs(); reveals(); }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
