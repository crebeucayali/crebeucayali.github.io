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

  const copiarOMostrar = async (enlace, url, actividad, mensajeCanal) => {
    const mensaje = mensajeCanal || (actividad ? "Enlace de la actividad copiado." : "Enlace copiado.");
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

  const css = document.createElement("link");
  css.rel = "stylesheet";
  css.href = new URL("compartir-eva.css?v=1", document.currentScript?.src || "https://crebeucayali.github.io/compartir-facebook.js").href;
  document.head.append(css);

  let menu = null;
  let intentoMenu = null;
  const liberar = (enlace, inicio) => window.setTimeout(() => {
    delete enlace.dataset.compartiendo;
  }, Math.max(0, 1500 - (Date.now() - inicio)));

  const cerrarMenu = (conservarBloqueo = false, devolverFoco = true) => {
    if (!intentoMenu) return;
    const anterior = intentoMenu;
    intentoMenu = null;
    menu.hidden = true;
    anterior.enlace.setAttribute("aria-expanded", "false");
    if (!conservarBloqueo) liberar(anterior.enlace, anterior.inicio);
    if (devolverFoco && anterior.enlace.isConnected) anterior.enlace.focus({ preventScroll: true });
  };

  const prepararBoton = (enlace) => {
    enlace.setAttribute("role", "button");
    enlace.setAttribute("aria-controls", "eva-compartir-menu");
    enlace.setAttribute("aria-haspopup", "dialog");
    if (!enlace.hasAttribute("aria-expanded")) enlace.setAttribute("aria-expanded", "false");
  };

  const crearMenu = () => {
    if (menu) return menu;
    menu = document.createElement("div");
    menu.id = "eva-compartir-menu";
    menu.className = "eva-compartir-menu";
    menu.hidden = true;
    menu.setAttribute("role", "dialog");
    menu.setAttribute("aria-labelledby", "eva-compartir-menu-titulo");
    const titulo = document.createElement("h2");
    titulo.id = "eva-compartir-menu-titulo";
    titulo.textContent = "Compartir";
    menu.append(titulo);
    for (const [canal, nombre] of [["copiar", "Copiar enlace"], ["facebook", "Facebook"],
      ["whatsapp", "WhatsApp"], ["messenger", "Messenger"], ["correo", "Correo"]]) {
      const boton = document.createElement("button");
      boton.type = "button";
      boton.dataset.evaCanal = canal;
      boton.textContent = nombre;
      menu.append(boton);
    }
    menu.addEventListener("click", async (evento) => {
      const boton = evento.target.closest("[data-eva-canal]");
      if (!boton || !intentoMenu) return;
      const intento = intentoMenu;
      cerrarMenu(true);
      const { enlace, url, actividad, inicio, titulo, texto } = intento;
      try {
        const canal = boton.dataset.evaCanal;
        if (canal === "whatsapp" || canal === "correo") {
          const cuerpo = [titulo, texto, url].filter(Boolean).join("\n");
          const destino = canal === "whatsapp" ? "https://wa.me/?text=" + encodeURIComponent(cuerpo) :
            "mailto:?subject=" + encodeURIComponent(titulo) + "&body=" + encodeURIComponent(cuerpo);
          if (canal === "whatsapp") {
            const ventana = window.open(destino, "_blank");
            if (ventana) ventana.opener = null;
            else await copiarOMostrar(enlace, url, actividad);
          } else {
            window.location.href = destino;
          }
        } else {
          // Facebook ya falló en las pruebas reales; Messenger no requiere una integración no verificada.
          const mensaje = canal === "facebook" ? "Enlace copiado. Pégalo en una publicación de Facebook." :
            canal === "messenger" ? "Enlace copiado. Pégalo en Messenger." : undefined;
          await copiarOMostrar(enlace, url, actividad, mensaje);
        }
        registrarAccionCompartir(actividad);
      } finally { liberar(enlace, inicio); }
    });
    document.body.append(menu);
    return menu;
  };

  const abrirMenu = (intento) => {
    cerrarMenu(false, false);
    const panel = crearMenu();
    intentoMenu = intento;
    prepararBoton(intento.enlace);
    intento.enlace.setAttribute("aria-expanded", "true");
    panel.hidden = false;
    const rect = intento.enlace.getBoundingClientRect();
    const ancho = panel.offsetWidth;
    const alto = panel.offsetHeight;
    panel.style.left = Math.max(12, Math.min(rect.left, window.innerWidth - ancho - 12)) + "px";
    panel.style.top = Math.max(12, Math.min(rect.bottom + 8, window.innerHeight - alto - 12)) + "px";
    panel.querySelector("button").focus({ preventScroll: true });
  };

  document.addEventListener("click", (evento) => {
    if (intentoMenu && !menu.contains(evento.target) &&
        !intentoMenu.enlace.contains(evento.target)) cerrarMenu(false, false);
  }, true);
  document.addEventListener("keydown", (evento) => {
    if (intentoMenu && evento.key === "Escape") {
      evento.preventDefault(); cerrarMenu(); return;
    }
    if (intentoMenu && menu.contains(evento.target) && ["ArrowDown", "ArrowUp", "Home", "End"].includes(evento.key)) {
      evento.preventDefault();
      const opciones = Array.from(menu.querySelectorAll("button"));
      const actual = opciones.indexOf(document.activeElement);
      const siguiente = evento.key === "Home" ? 0 : evento.key === "End" ? opciones.length - 1 :
        (actual + (evento.key === "ArrowDown" ? 1 : -1) + opciones.length) % opciones.length;
      opciones[siguiente].focus();
    }
    if (evento.key === " " && evento.target.closest?.(selector)) {
      evento.preventDefault(); evento.target.closest(selector).click();
    }
  });
  document.addEventListener("focusin", (evento) => {
    const enlace = evento.target.closest?.(selector);
    if (enlace) prepararBoton(enlace);
    if (intentoMenu && !menu.contains(evento.target) && !intentoMenu.enlace.contains(evento.target)) cerrarMenu(false, false);
  });
  window.addEventListener("resize", () => cerrarMenu(false, false));
  window.addEventListener("scroll", (evento) => {
    if (intentoMenu && !menu.contains(evento.target)) cerrarMenu(false, false);
  }, true);

  enlaces.forEach((enlace) => {
    prepararBoton(enlace);
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
    if (enlace.dataset.compartiendo === "si") {
      if (intentoMenu?.enlace === enlace) menu.querySelector("button").focus({ preventScroll: true });
      return;
    }
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
    const titulo = actividad ? actividad.titulo : document.title;
    const texto = actividad ? actividad.texto : "";
    let abierto = false;
    informar(enlace, "");
    try {
      if (esEntornoMovilTactil() && typeof navigator.share === "function") {
        try {
          await navigator.share({ title: titulo, text: texto, url });
          registrarAccionCompartir(actividad);
          return;
        } catch (error) {
          if (error?.name === "AbortError") return;
          // Un error real ofrece el menú; la cancelación no cambia de canal.
        }
      }
      abrirMenu({ enlace, url, actividad, inicio, titulo, texto });
      abierto = true;
    } finally {
      if (!abierto) liberar(enlace, inicio);
    }
  });
})();
