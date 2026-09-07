/* Medicion de contacto.
 *
 * Todo contacto del sitio es un mailto: no hay formulario —el de produccion
 * nunca recibio un correo— asi que sin esto no hay forma de saber desde que
 * pagina salio cada consulta. Este archivo registra un evento "Contacto" con
 * la pagina de origen, la zona del enlace y el asunto que llevaba.
 *
 * Va DELEGADO en document, a proposito. Las paginas del espejo son un build
 * de Next ya compilado: cualquier nodo que se inyecte se pierde al hidratar y
 * mutar el DOM antes de que React termine rompe la hidratacion (#418).
 * Escuchando en document no se toca un solo nodo, asi que no hay nada que
 * React pueda reponer ni con lo que pueda chocar, y no hace falta ni esperar
 * al load ni vigilar con MutationObserver como hacen los otros scripts.
 *
 * En fase de captura para que un handler sintetico de React no lo pueda
 * cancelar antes: el clic se cuenta aunque la pagina decida no navegar.
 */
(function () {
  "use strict";

  // La cola la define el snippet de Plausible, que es un <script> en linea y
  // por lo tanto corre mientras se parsea el documento: para cuando este
  // archivo (defer) registra el listener, `window.plausible` ya existe y
  // encola lo que se dispare antes de que llegue el script async.
  //
  // Aca solo se comprueba antes de llamar. Redefinir la cola seria peor que
  // inutil: si el snippet no esta —bloqueador, o alguien lo saco del
  // generador— nada la vaciaria nunca, y un arreglo creciendo en memoria
  // simula que se esta midiendo cuando no se esta midiendo nada.
  function registrar(evento, props) {
    if (typeof window.plausible === "function") {
      window.plausible(evento, { props: props });
    }
  }

  // El <header> NO cuenta como navegacion: en las paginas propias el hero es
  // un <header> y el boton de "Hablemos de tu caso" vive ahi dentro. Con
  // "nav, header" ese CTA se contaba como si fuera el enlace del menu, que es
  // justo la distincion que este evento existe para hacer. La navegacion del
  // sitio es un <nav> en el espejo y en las propias, asi que basta con eso.
  function zona(a) {
    if (a.closest("footer")) return "pie";
    if (a.closest("nav")) return "nav";
    return "cta";
  }

  function asunto(href) {
    var i = href.indexOf("subject=");
    if (i < 0) return "sin asunto";
    try {
      return decodeURIComponent(href.slice(i + 8).split("&")[0]) || "sin asunto";
    } catch (e) {
      return "sin asunto";
    }
  }

  document.addEventListener("click", function (e) {
    var t = e.target;
    if (!t || typeof t.closest !== "function") return;
    var a = t.closest('a[href^="mailto:"]');
    if (!a) return;

    // Sin barra final: /es/quienes-somos/ y /es/quienes-somos son la misma
    // pagina, y Amplify sirve las dos. Separarlas partiria el informe en dos.
    var pagina = location.pathname.replace(/\/+$/, "") || "/";

    registrar("Contacto", {
      pagina: pagina,
      origen: zona(a),
      asunto: asunto(a.getAttribute("href") || "")
    });
  }, true);
})();
