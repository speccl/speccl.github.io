/* Medicion de contacto.
 *
 * Todo contacto del sitio es un mailto: no hay formulario —el de produccion
 * nunca recibio un correo— asi que sin esto no hay forma de saber desde que
 * pagina salio cada consulta. Este archivo registra un evento "Contacto" con
 * la pagina de origen, la zona del enlace y el asunto que llevaba.
 *
 * Tambien registra "Suscripcion" —pagina y zona— cuando alguien pincha un
 * enlace a suscribete.spec.cl, el formulario de los correos.
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

  // `window.umami` lo define el script de Umami, que va antes que este en el
  // documento: los dos son defer y corren en ese orden, asi que para cuando
  // alguien pincha algo ya existe. Umami no trae cola, y no hace falta.
  //
  // Aca solo se comprueba antes de llamar. Si el script no esta —bloqueador,
  // o alguien lo saco del generador— el clic simplemente no se cuenta, que
  // es mejor que fingir una medicion que no ocurre.
  function registrar(evento, props) {
    if (window.umami && typeof window.umami.track === "function") {
      window.umami.track(evento, props);
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

  // Los enlaces a suscribete.spec.cl. Ese formulario no sabe de donde llega
  // cada persona —a proposito no se le pasa nada en la URL—, asi que este
  // evento es la unica forma de saber si suscribe mas el pie o la banda.
  var SUSCRIBETE = /^https:\/\/suscribete\.spec\.cl(\/|$)/;

  document.addEventListener("click", function (e) {
    var t = e.target;
    if (!t || typeof t.closest !== "function") return;
    var a = t.closest("a[href]");
    if (!a) return;
    var href = a.getAttribute("href") || "";

    // Sin barra final: /es/quienes-somos/ y /es/quienes-somos son la misma
    // pagina, y Amplify sirve las dos. Separarlas partiria el informe en dos.
    var pagina = location.pathname.replace(/\/+$/, "") || "/";

    // la banda es un <aside> fuera del pie: cae en "cta"
    if (SUSCRIBETE.test(href)) {
      registrar("Suscripcion", { pagina: pagina, origen: zona(a) });
      return;
    }
    if (href.indexOf("mailto:") !== 0) return;

    registrar("Contacto", {
      pagina: pagina,
      origen: zona(a),
      asunto: asunto(a.getAttribute("href") || "")
    });
  }, true);
})();
