/* ABEX — comportamiento de la pagina. Sin dependencias. */
(function () {
  "use strict";
  var REDUCED = window.matchMedia &&
                window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ============================================================
     Campo de agentes del hero.
     Cada punto es un agente que se mueve y se enlaza con sus
     vecinos: la interaccion local produce la estructura global,
     que es justamente la idea del modelo.
     ============================================================ */
  function initAgents() {
    var cv = document.getElementById("ab-agents");
    if (!cv) return;
    var ctx = cv.getContext("2d");
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var W = 0, H = 0, agents = [], raf = null;
    var LINK = 178;                       // radio de vinculo, recalculado en resize

    function resize() {
      W = cv.clientWidth; H = cv.clientHeight;
      // en telefono un radio fijo enlaza casi todo con todo y se ve tosco
      LINK = Math.max(96, Math.min(178, W * 0.13));
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
    }

    function seed() {
      var n = Math.max(38, Math.min(132, Math.round(W * H / 9800)));
      agents = [];
      for (var i = 0; i < n; i++) {
        // distribucion determinista: mismo dibujo en cada carga
        var a = i * 2.399963;                       // angulo aureo
        var r = Math.sqrt((i + 0.5) / n);
        agents.push({
          x: W * (0.5 + 0.62 * r * Math.cos(a)),
          y: H * (0.5 + 0.62 * r * Math.sin(a)),
          vx: Math.cos(a * 3.1) * 0.14,
          vy: Math.sin(a * 2.3) * 0.14,
          r: 1.3 + (i % 5) * 0.46,
          big: i % 9 === 0,
          ph: (i % 13) / 13
        });
      }
    }

    function frame(t) {
      ctx.clearRect(0, 0, W, H);
      var i, j, a, b, dx, dy, d;

      for (i = 0; i < agents.length; i++) {
        a = agents[i];
        a.x += a.vx; a.y += a.vy;
        if (a.x < -20) a.x = W + 20; else if (a.x > W + 20) a.x = -20;
        if (a.y < -20) a.y = H + 20; else if (a.y > H + 20) a.y = -20;
      }

      ctx.lineWidth = 1;
      for (i = 0; i < agents.length; i++) {
        a = agents[i];
        for (j = i + 1; j < agents.length; j++) {
          b = agents[j];
          dx = a.x - b.x; dy = a.y - b.y;
          d = Math.sqrt(dx * dx + dy * dy);
          if (d > LINK) continue;
          var k = 1 - d / LINK;
          ctx.strokeStyle = "rgba(231,200,115," + (k * k * 0.62).toFixed(3) + ")";
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
      }

      for (i = 0; i < agents.length; i++) {
        a = agents[i];
        var pulse = 0.72 + 0.28 * Math.sin(t / 1400 + a.ph * 6.283);
        ctx.beginPath();
        ctx.arc(a.x, a.y, a.r * (a.big ? 1.9 : 1) * pulse, 0, 6.2832);
        ctx.fillStyle = a.big ? "rgba(231,200,115,.95)" : "rgba(196,222,231,.78)";
        ctx.fill();
      }
      raf = requestAnimationFrame(frame);
    }

    resize();
    window.addEventListener("resize", function () {
      cancelAnimationFrame(raf); resize();
      if (!REDUCED) raf = requestAnimationFrame(frame); else frame(0);
    });
    if (REDUCED) { frame(0); cancelAnimationFrame(raf); }
    else raf = requestAnimationFrame(frame);

    // no gastar CPU con la pestaña oculta
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) cancelAnimationFrame(raf);
      else if (!REDUCED) raf = requestAnimationFrame(frame);
    });
  }

  /* ---------- reveal por scroll ---------- */
  function initReveal() {
    var els = document.querySelectorAll(".ab-r");
    if (!("IntersectionObserver" in window)) {
      els.forEach(function (e) { e.classList.add("in"); }); return;
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
    els.forEach(function (e) { io.observe(e); });
  }

  /* ---------- contadores ---------- */
  function initCounters() {
    var els = document.querySelectorAll("[data-count]");
    if (!els.length) return;
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        run(e.target); io.unobserve(e.target);
      });
    }, { threshold: .5 });
    els.forEach(function (e) { io.observe(e); });

    function run(el) {
      var to = parseFloat(el.getAttribute("data-count"));
      var dec = (el.getAttribute("data-dec") | 0);
      if (REDUCED) { el.textContent = to.toFixed(dec); return; }
      var t0 = performance.now(), dur = 1300;
      (function step(t) {
        var p = Math.min(1, (t - t0) / dur);
        var e = 1 - Math.pow(1 - p, 3);
        el.textContent = (to * e).toFixed(dec);
        if (p < 1) requestAnimationFrame(step);
      })(t0);
    }
  }

  /* ---------- scrollytelling de los tres modulos ---------- */
  function initScrolly() {
    var steps = document.querySelectorAll(".ab-step");
    if (!steps.length) return;

    function activate(idx) {
      steps.forEach(function (s, i) { s.classList.toggle("on", i === idx); });
      document.querySelectorAll("[data-mod]").forEach(function (n) {
        n.classList.toggle("on", +n.getAttribute("data-mod") === idx);
      });
      document.querySelectorAll("[data-edge]").forEach(function (n) {
        n.classList.toggle("on", +n.getAttribute("data-edge") <= idx);
      });
    }

    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) activate(+e.target.getAttribute("data-step"));
      });
    }, { threshold: .55, rootMargin: "-20% 0px -35% 0px" });
    steps.forEach(function (s) { io.observe(s); });
    activate(0);
  }

  /* ---------- horizonte rodante ----------
     Barrido continuo: la ventana avanza un año a la vez sobre el horizonte
     completo. Se pausa al pasar el cursor y al salir de pantalla. Los años
     del riel son el control: al hacer clic, la ventana salta ahí. */
  function initRolling() {
    var wrap = document.querySelector("[data-roll]");
    if (!wrap) return;
    var win = wrap.querySelector(".ab-win");
    var label = win.querySelector("b");
    var cells = Array.prototype.slice.call(wrap.querySelectorAll(".ab-year"));
    var starts = Array.prototype.slice.call(wrap.querySelectorAll(".ab-year[data-start]"));
    var span = +wrap.getAttribute("data-span") || 12;
    var prefix = wrap.getAttribute("data-prefix") || "";
    var maxStart = cells.length - span;
    var at = 0, timer = null, visible = false, hovered = false, pinned = false;

    function show(start) {
      at = Math.max(0, Math.min(maxStart, start));
      var a = cells[at], b = cells[at + span - 1];
      win.style.left = (a.offsetLeft - 4) + "px";
      win.style.width = (b.offsetLeft + b.offsetWidth - a.offsetLeft + 8) + "px";
      label.textContent = prefix + " " + a.textContent;
      cells.forEach(function (c, i) { c.classList.toggle("lit", i >= at && i < at + span); });
      starts.forEach(function (c) {
        c.setAttribute("aria-pressed", +c.getAttribute("data-start") === at ? "true" : "false");
      });
    }

    function play() {
      if (timer || REDUCED || !visible || hovered || pinned) return;
      timer = setInterval(function () { show(at >= maxStart ? 0 : at + 1); }, 1100);
    }
    function pause() { if (timer) { clearInterval(timer); timer = null; } }

    starts.forEach(function (c) {
      c.addEventListener("click", function () {
        var n = +c.getAttribute("data-start");
        if (pinned && n === at) {          // volver a hacer clic reanuda el barrido
          pinned = false; play();
        } else {                            // fijar la evaluacion elegida
          pinned = true; pause(); show(n);
        }
        wrap.setAttribute("data-pinned", pinned ? "true" : "false");
      });
    });
    wrap.addEventListener("mouseenter", function () { hovered = true; pause(); });
    wrap.addEventListener("mouseleave", function () { hovered = false; play(); });

    show(0);
    window.addEventListener("resize", function () { show(at); });

    if (!("IntersectionObserver" in window)) { visible = true; play(); return; }
    new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        visible = e.isIntersecting;
        if (visible) play(); else pause();
      });
    }, { threshold: .35 }).observe(wrap);
  }

  /* ---------- alternador de casos en resultados ---------- */
  function initSeg() {
    document.querySelectorAll("[data-seg]").forEach(function (seg) {
      var btns = Array.prototype.slice.call(seg.querySelectorAll("button"));
      btns.forEach(function (b) {
        b.addEventListener("click", function () {
          btns.forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
          var target = b.getAttribute("data-target");
          document.querySelectorAll("[data-case]").forEach(function (p) {
            var on = p.getAttribute("data-case") === target;
            p.style.display = on ? "" : "none";
            if (on) { p.classList.remove("in"); void p.offsetWidth; p.classList.add("in"); }
          });
        });
      });
    });
  }

  /* ---------- longitud real de los trazos animados ---------- */
  function initTraces() {
    document.querySelectorAll(".ab-trace").forEach(function (p) {
      try { p.style.setProperty("--len", Math.ceil(p.getTotalLength())); } catch (e) {}
    });
  }

  function boot() {
    if (REDUCED) document.querySelectorAll("svg").forEach(function (s) {
      if (s.pauseAnimations) s.pauseAnimations();
    });
    initTraces(); initAgents(); initReveal(); initCounters();
    initScrolly(); initRolling(); initSeg();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
