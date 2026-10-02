(() => {
  "use strict";

  const APP_ID = "1743067010248486";
  const SUPABASE_URL = "https://dteimbhwtzghhsijeeld.supabase.co";
  const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_tHbo1jTeW_dC90hdA5DvyQ_a6LrfKpq";
  // Un solo listener delegado cubre también tarjetas creadas después de cargar el script.
  if (document.documentElement.dataset.evaCompartirInicializado) return;
  document.documentElement.dataset.evaCompartirInicializado = "si";
  const selector = "[data-compartir-facebook], .compartir-facebook";
  const enlaces = document.querySelectorAll(selector);

  const RUTAS_MODULOS = [
    ["/capacitaciones", "capacitaciones"],
    ["/banco-digital-accesible", "bda"],
    ["/materiales-educativos-accesibles", "mea"],
    ["/noti-inclusivos", "noti_inclusivos"],
    ["/repositorio-accesible", "repositorio_accesible"],
    ["/DUA-3.0", "dua_3"],
    ["/accesos-complementarios", "accesos_complementarios"]
  ];

  let ultimoRegistro = 0;

  const urlActual = () => {
    const actual = new URL(window.location.href);
    actual.hash = "";
    return actual.href;
  };

  const paginaActual = () => {
    let ruta = String(window.location.pathname || "/");
    ruta = ruta.replace(/index\.html$/i, "");
    return ruta || "/";
  };

  const moduloActual = () => {
    const ruta = paginaActual();
    const coincidencia = RUTAS_MODULOS.find(([prefijo]) =>
      ruta === prefijo || ruta.startsWith(prefijo + "/")
    );
    return coincidencia?.[1] || "principal";
  };

  const crearDialogo = (url, texto = "") => {
    const parametros = new URLSearchParams({
      app_id: APP_ID,
      display: "popup",
      href: url,
      redirect_uri: url,
    });

    if (texto) parametros.set("quote", texto);
    return "https://www.facebook.com/dialog/share?" + parametros.toString();
  };

  const registrarAccionCompartir = (actividad) => {
    const ahora = Date.now();
    if (!actividad && ahora - ultimoRegistro < 1500) return;
    ultimoRegistro = ahora;

    fetch(SUPABASE_URL + "/rest/v1/eva_compartidos_eventos", {
      method: "POST",
      headers: {
        apikey: SUPABASE_PUBLISHABLE_KEY,
        "Content-Type": "application/json",
        Accept: "application/json",
        Prefer: "return=minimal"
      },
      body: JSON.stringify({
        modulo: actividad ? "galeria" : moduloActual(),
        pagina: actividad ? actividad.url.pathname + actividad.url.hash : paginaActual()
      }),
      credentials: "omit",
      cache: "no-store",
      referrerPolicy: "strict-origin-when-cross-origin",
      keepalive: true
    }).then((respuesta) => {
      document.documentElement.dataset.evaCompartir =
        respuesta.ok ? "registrada" : "error";
    }).catch(() => {
      document.documentElement.dataset.evaCompartir = "error";
    });
  };

  enlaces.forEach((enlace) => {
    enlace.href = crearDialogo(urlActual());
    enlace.target = "_blank";
    enlace.rel = "noopener noreferrer";
    enlace.textContent = "Compartir";
    enlace.setAttribute("aria-label", "Compartir este contenido");

    const contenedor = enlace.closest(".compartir-eva");
    const descripcion = contenedor?.querySelector("p");
    if (descripcion?.textContent?.includes("Facebook")) {
      descripcion.textContent = "Comparte este contenido.";
    }


  });

  document.addEventListener("click", (evento) => {
    const enlace = evento.target.closest?.(selector);
    if (!enlace) return;
    const esActividad = enlace.dataset.evaModulo === "galeria";
    let actividad = null;
    if (esActividad) {
      try {
        const url = new URL(enlace.dataset.compartirUrl);
        if (url.origin !== "https://crebeucayali.github.io" ||
            url.pathname !== "/accesos-complementarios/recursos/galeria.html" ||
            !/^#actividad-[1-9][0-9]{0,18}$/.test(url.hash) || url.search) return;
        actividad = { url, titulo: enlace.dataset.compartirTitulo || "Actividad de Galería",
          texto: enlace.dataset.compartirTexto || "" };
      } catch { return; }
      // Un doble clic no abre dos flujos simultáneos. El registro no se reintenta.
      if (enlace.dataset.compartiendo === "si") { evento.preventDefault(); return; }
      enlace.href = crearDialogo(actividad.url.href, actividad.texto);
      if (typeof navigator.share === "function") {
        evento.preventDefault();
        enlace.dataset.compartiendo = "si";
        registrarAccionCompartir(actividad);
        try {
          Promise.resolve(navigator.share({title: actividad.titulo, text: actividad.texto,
            url: actividad.url.href})).catch((error) => {
            // Cancelar no inicia otro canal ni registra una segunda acción.
            if (error.name !== "AbortError") {
              enlace.dispatchEvent(new CustomEvent("eva-compartir-error", {bubbles: true}));
            }
          }).finally(() => { delete enlace.dataset.compartiendo; });
        } catch {
          delete enlace.dataset.compartiendo;
          enlace.dispatchEvent(new CustomEvent("eva-compartir-error", {bubbles: true}));
        }
        return;
      }
    }
    registrarAccionCompartir(actividad);
  });
})();
