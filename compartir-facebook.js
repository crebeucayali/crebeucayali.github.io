(() => {
  "use strict";

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

  // El tacto por sí solo no identifica un móvil: los portátiles táctiles suelen
  // conservar un puntero fino y hover. Exigir las tres señales evita ese caso.
  const esEntornoMovilTactil = () =>
    navigator.maxTouchPoints > 0 &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(pointer: coarse)").matches &&
    window.matchMedia("(hover: none)").matches;

  const mensajes = new WeakMap();

  const feedback = (enlace) => {
    let bloque = mensajes.get(enlace);
    if (!bloque || !bloque.isConnected) {
      bloque = document.createElement("div");
      bloque.className = "eva-compartir-feedback";
      const estado = document.createElement("p");
      estado.setAttribute("role", "status");
      estado.setAttribute("aria-live", "polite");
      bloque.append(estado);
      enlace.insertAdjacentElement("afterend", bloque);
      mensajes.set(enlace, bloque);
    }
    return bloque;
  };

  const informar = (enlace, texto) => {
    const bloque = feedback(enlace);
    bloque.firstElementChild.textContent = texto;
    while (bloque.children.length > 1) bloque.lastElementChild.remove();
  };

  const copiar = async (url) => {
    if (window.isSecureContext && navigator.clipboard?.writeText) {
      try { await navigator.clipboard.writeText(url); return true; } catch { /* Probar compatibilidad. */ }
    }
    const anterior = document.activeElement;
    const temporal = document.createElement("textarea");
    temporal.value = url;
    temporal.readOnly = true;
    temporal.setAttribute("aria-label", "Enlace para compartir");
    document.body.append(temporal);
    try {
      temporal.focus({ preventScroll: true });
      temporal.select();
      return typeof document.execCommand === "function" && document.execCommand("copy");
    } catch { return false; }
    finally {
      temporal.remove();
      anterior?.focus?.({ preventScroll: true });
    }
  };

  const copiarOMostrar = async (enlace, url, actividad) => {
    const mensaje = actividad ? "Enlace de la actividad copiado." : "Enlace copiado.";
    if (await copiar(url)) {
      informar(enlace, mensaje);
      return;
    }
    informar(enlace, "Enlace para compartir: selecciona y copia el enlace si tu navegador no permite copiarlo automáticamente.");
    const bloque = feedback(enlace);
    const etiqueta = document.createElement("label");
    etiqueta.textContent = "Enlace para compartir:";
    const campo = document.createElement("textarea");
    campo.value = url;
    campo.readOnly = true;
    campo.rows = 3;
    etiqueta.append(campo);
    const boton = document.createElement("button");
    boton.type = "button";
    boton.textContent = "Copiar enlace";
    boton.addEventListener("click", async () => {
      if (boton.disabled) return;
      boton.disabled = true;
      if (await copiar(url)) informar(enlace, mensaje);
      else { boton.disabled = false; campo.focus(); campo.select(); }
      // Este botón continúa el mismo intento; no registra otro evento.
    });
    bloque.append(etiqueta, boton);
    campo.focus();
    campo.select();
  };

  enlaces.forEach((enlace) => {
    enlace.href = urlActual();
    enlace.removeAttribute("target");
    enlace.textContent = "Compartir";
    enlace.setAttribute("aria-label", "Compartir este contenido");
    const descripcion = enlace.closest(".compartir-eva")?.querySelector("p");
    if (descripcion?.textContent?.includes("Facebook")) descripcion.textContent = "Comparte este contenido.";
  });

  document.addEventListener("click", async (evento) => {
    const enlace = evento.target.closest?.(selector);
    if (!enlace) return;
    evento.preventDefault();
    if (enlace.dataset.compartiendo === "si") return;
    let actividad = null;
    if (enlace.dataset.evaModulo === "galeria") {
      try {
        const url = new URL(enlace.dataset.compartirUrl);
        if (url.origin !== "https://crebeucayali.github.io" ||
            url.pathname !== "/accesos-complementarios/recursos/galeria.html" ||
            !/^#actividad-[1-9][0-9]{0,18}$/.test(url.hash) || url.search) return;
        actividad = { url, titulo: enlace.dataset.compartirTitulo || "Actividad de Galería",
          texto: enlace.dataset.compartirTexto || "" };
      } catch { return; }
    }
    const url = actividad ? actividad.url.href : urlActual();
    enlace.href = url;
    enlace.removeAttribute("target");
    enlace.dataset.compartiendo = "si";
    const inicio = Date.now();
    informar(enlace, "");
    try {
      if (esEntornoMovilTactil() && typeof navigator.share === "function") {
        try {
          await navigator.share({ title: actividad ? actividad.titulo : document.title,
            text: actividad ? actividad.texto : "", url });
          registrarAccionCompartir(actividad);
          return;
        } catch (error) {
          if (error?.name === "AbortError") return;
          // Un error real continúa por copia; la cancelación no cambia de canal.
        }
      }
      await copiarOMostrar(enlace, url, actividad);
      registrarAccionCompartir(actividad);
    } finally {
      window.setTimeout(() => { delete enlace.dataset.compartiendo; }, Math.max(0, 1500 - (Date.now() - inicio)));
    }
  });
})();
