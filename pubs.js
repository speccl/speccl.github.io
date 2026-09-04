/* Publicaciones: búsqueda y filtros en cliente. Sin dependencias. */
(function () {
  "use strict";

  function boot() {
    var root = document.querySelector("[data-pubs]");
    if (!root) return;

    var input = root.querySelector(".pb-search input");
    var wrap = root.querySelector(".pb-search");
    var clearBtn = root.querySelector(".pb-clear");
    var chips = Array.prototype.slice.call(root.querySelectorAll(".pb-chip[data-facet]"));
    var rows = Array.prototype.slice.call(root.querySelectorAll("tbody tr"));
    var count = root.querySelector(".pb-count");
    var empty = root.querySelector(".pb-empty");
    var table = root.querySelector(".pb-table");
    var one = count.getAttribute("data-one");
    var many = count.getAttribute("data-many");
    var pager = root.querySelector(".pb-pager");
    var pages = pager && pager.querySelector(".pb-pages");
    var prevBtn = pager && pager.querySelector(".pb-prev");
    var nextBtn = pager && pager.querySelector(".pb-next");
    var SIZE = (pager && +pager.getAttribute("data-size")) || 20;
    var page = 1;
    var facets = { year: "", type: "", cat: "" };

    // texto normalizado: buscar "energia" debe encontrar "energía"
    function norm(s) {
      return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
    }
    rows.forEach(function (r) { r.dataset.hay = norm(r.textContent); });

    /* filtra, y luego pagina el resultado en bloques de SIZE */
    function apply(keepPage) {
      var q = norm(input.value.trim());
      var terms = q ? q.split(/\s+/) : [];
      var matched = rows.filter(function (r) {
        var okFacets = Object.keys(facets).every(function (f) {
          return !facets[f] || r.dataset[f] === facets[f];
        });
        return okFacets && terms.every(function (t) { return r.dataset.hay.indexOf(t) !== -1; });
      });

      var n = matched.length;
      var last = Math.max(1, Math.ceil(n / SIZE));
      if (!keepPage) page = 1;
      page = Math.min(page, last);
      var from = (page - 1) * SIZE;

      rows.forEach(function (r) { r.hidden = true; });
      matched.slice(from, from + SIZE).forEach(function (r, i) {
        r.hidden = false;
        r.style.animationDelay = (i * 28) + "ms";
      });

      count.innerHTML = n === 1 ? one : many.replace("%s", "<b>" + n + "</b>");
      empty.style.display = n ? "none" : "block";
      table.style.display = n ? "" : "none";
      wrap.classList.toggle("has", input.value.length > 0);
      renderPager(last);
    }

    function renderPager(last) {
      if (!pager) return;
      pager.hidden = last < 2;
      if (last < 2) return;
      prevBtn.disabled = page === 1;
      nextBtn.disabled = page === last;
      pages.innerHTML = "";
      for (var i = 1; i <= last; i++) {
        var b = document.createElement("button");
        b.type = "button";
        b.className = "pb-page pb-num";
        b.textContent = i;
        b.setAttribute("aria-current", i === page ? "page" : "false");
        b.dataset.p = i;
        pages.appendChild(b);
      }
    }

    function goto(p) {
      page = p;
      apply(true);
      var top = root.querySelector(".pb-search");
      if (top) window.scrollTo({ top: top.getBoundingClientRect().top + window.scrollY - 90,
                                 behavior: "smooth" });
    }

    input.addEventListener("input", apply);
    clearBtn.addEventListener("click", function () { input.value = ""; input.focus(); apply(); });
    chips.forEach(function (c) {
      c.addEventListener("click", function () {
        var f = c.dataset.facet;
        facets[f] = facets[f] === c.dataset.value ? "" : c.dataset.value;
        chips.forEach(function (x) {
          x.setAttribute("aria-pressed",
            facets[x.dataset.facet] === x.dataset.value ? "true" : "false");
        });
        apply();
      });
    });
    var reset = root.querySelector("[data-reset]");
    if (reset) reset.addEventListener("click", function () {
      input.value = ""; facets = { year: "", type: "", cat: "" };
      chips.forEach(function (x) { x.setAttribute("aria-pressed", "false"); });
      apply(); input.focus();
    });

    if (pager) {
      prevBtn.addEventListener("click", function () { if (page > 1) goto(page - 1); });
      nextBtn.addEventListener("click", function () { goto(page + 1); });
      pages.addEventListener("click", function (e) {
        var b = e.target.closest(".pb-num");
        if (b) goto(+b.dataset.p);
      });
    }

    // "/" enfoca el buscador, Escape lo limpia
    document.addEventListener("keydown", function (e) {
      if (e.key === "/" && document.activeElement !== input) { e.preventDefault(); input.focus(); }
      else if (e.key === "Escape" && document.activeElement === input) {
        input.value = ""; apply();
      }
    });

    apply();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
