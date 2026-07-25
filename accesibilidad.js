(() => {
  "use strict";

  const STORAGE_KEY = "eva_accesibilidad_preferencias";
  const CENTRAL_URL = "https://crebe-ucayali.github.io/accesos-complementarios/accesibilidad/accesibilidad.js?v=10";
  const CLASES = [
    "eva-alto-contraste",
    "eva-texto-grande",
    "eva-texto-muy-grande",
    "eva-fuente-legible",
    "eva-espaciado-amplio",
    "eva-enlaces-resaltados",
    "eva-escala-grises",
    "eva-reducir-movimiento"
  ];
  const CLAVES_ANTERIORES = [
    "evaTextoNivel",
    "evaTextoGrande",
    "evaContraste",
    "evaFuenteLegible",
    "evaEspaciadoAmplio",
    "evaEnlacesSubrayados",
    "evaEscalaGrises",
    "evaMovimientoReducido"
  ];

  const leerPreferencias = () => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    } catch (error) {
      return {};
    }
  };

  const guardarPreferencias = (preferencias) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preferencias));
    } catch (error) {
      // La página continúa funcionando aunque el almacenamiento esté bloqueado.
    }
  };

  const aplicarPreferencias = (preferencias) => {
    CLASES.forEach((clase) => document.documentElement.classList.remove(clase));
    CLASES.forEach((clase) => {
      if (preferencias[clase]) document.documentElement.classList.add(clase);
    });
  };

  const sincronizarPanelCentral = (preferencias = leerPreferencias()) => {
    document.querySelectorAll(".eva-accesibilidad-panel [data-eva-clase]").forEach((boton) => {
      boton.setAttribute("aria-pressed", preferencias[boton.dataset.evaClase] ? "true" : "false");
    });
  };

  const migrarPreferenciasAnteriores = () => {
    const preferencias = leerPreferencias();
    let modificadas = false;

    const nivelTexto = localStorage.getItem("evaTextoNivel");
    if (nivelTexto === "grande" && !preferencias["eva-texto-grande"] && !preferencias["eva-texto-muy-grande"]) {
      preferencias["eva-texto-grande"] = true;
      modificadas = true;
    }
    if (nivelTexto === "muy-grande" && !preferencias["eva-texto-muy-grande"]) {
      preferencias["eva-texto-muy-grande"] = true;
      preferencias["eva-texto-grande"] = false;
      modificadas = true;
    }

    const equivalencias = {
      evaContraste: "eva-alto-contraste",
      evaFuenteLegible: "eva-fuente-legible",
      evaEspaciadoAmplio: "eva-espaciado-amplio",
      evaEnlacesSubrayados: "eva-enlaces-resaltados",
      evaEscalaGrises: "eva-escala-grises",
      evaMovimientoReducido: "eva-reducir-movimiento"
    };

    Object.entries(equivalencias).forEach(([anterior, actual]) => {
      if (localStorage.getItem(anterior) === "activo" && !preferencias[actual]) {
        preferencias[actual] = true;
        modificadas = true;
      }
    });

    if (modificadas) guardarPreferencias(preferencias);
    CLAVES_ANTERIORES.forEach((clave) => localStorage.removeItem(clave));
    document.body?.classList.remove(
      "texto-grande",
      "texto-muy-grande",
      "alto-contraste",
      "escala-grises",
      "fuente-legible",
      "espaciado-amplio",
      "enlaces-resaltados",
      "movimiento-reducido"
    );
    aplicarPreferencias(preferencias);
    sincronizarPanelCentral(preferencias);
  };

  const actualizarAtajos = () => {
    const preferencias = leerPreferencias();
    const botonTexto = document.querySelector("#boton-texto");
    const botonContraste = document.querySelector("#boton-contraste");

    if (botonTexto) {
      const grande = Boolean(preferencias["eva-texto-grande"]);
      const muyGrande = Boolean(preferencias["eva-texto-muy-grande"]);
      botonTexto.textContent = muyGrande ? "Texto normal" : grande ? "Texto muy grande" : "Texto grande";
      botonTexto.setAttribute("aria-pressed", grande || muyGrande ? "true" : "false");
    }

    if (botonContraste) {
      botonContraste.setAttribute("aria-pressed", preferencias["eva-alto-contraste"] ? "true" : "false");
    }

    sincronizarPanelCentral(preferencias);
  };

  const anunciar = (mensaje) => {
    let estado = document.querySelector("#estado-accesibilidad-inicio");
    if (!estado) {
      estado = document.createElement("p");
      estado.id = "estado-accesibilidad-inicio";
      estado.className = "eva-solo-lectores";
      estado.setAttribute("role", "status");
      estado.setAttribute("aria-live", "polite");
      document.body.appendChild(estado);
    }
    estado.textContent = "";
    window.setTimeout(() => {
      estado.textContent = mensaje;
    }, 30);
  };

  const configurarAtajos = () => {
    const botonTexto = document.querySelector("#boton-texto");
    const botonContraste = document.querySelector("#boton-contraste");
    const botonRestablecer = document.querySelector("#boton-restablecer");

    botonTexto?.addEventListener("click", (evento) => {
      evento.preventDefault();
      evento.stopImmediatePropagation();
      const preferencias = leerPreferencias();
      const grande = Boolean(preferencias["eva-texto-grande"]);
      const muyGrande = Boolean(preferencias["eva-texto-muy-grande"]);

      preferencias["eva-texto-grande"] = !grande && !muyGrande;
      preferencias["eva-texto-muy-grande"] = grande && !muyGrande;
      if (muyGrande) {
        preferencias["eva-texto-grande"] = false;
        preferencias["eva-texto-muy-grande"] = false;
      }

      guardarPreferencias(preferencias);
      aplicarPreferencias(preferencias);
      actualizarAtajos();
      anunciar("Tamaño del texto actualizado.");
    }, true);

    botonContraste?.addEventListener("click", (evento) => {
      evento.preventDefault();
      evento.stopImmediatePropagation();
      const preferencias = leerPreferencias();
      preferencias["eva-alto-contraste"] = !preferencias["eva-alto-contraste"];
      guardarPreferencias(preferencias);
      aplicarPreferencias(preferencias);
      actualizarAtajos();
      anunciar(`Alto contraste: ${preferencias["eva-alto-contraste"] ? "activado" : "desactivado"}.`);
    }, true);

    botonRestablecer?.addEventListener("click", (evento) => {
      evento.preventDefault();
      evento.stopImmediatePropagation();
      guardarPreferencias({});
      aplicarPreferencias({});
      actualizarAtajos();
      anunciar("Se restablecieron las opciones de accesibilidad.");
    }, true);
  };

  const cargarHerramientaCentral = () => {
    if (document.querySelector('script[data-eva-accesibilidad-central="10"]')) return;
    const script = document.createElement("script");
    script.src = CENTRAL_URL;
    script.async = false;
    script.dataset.evaAccesibilidadCentral = "10";
    script.addEventListener("load", () => actualizarAtajos());
    document.head.appendChild(script);
  };

  migrarPreferenciasAnteriores();
  cargarHerramientaCentral();

  document.addEventListener("DOMContentLoaded", () => {
    migrarPreferenciasAnteriores();
    configurarAtajos();
    actualizarAtajos();

    const observador = new MutationObserver(() => {
      if (document.querySelector(".eva-accesibilidad-panel")) {
        actualizarAtajos();
        observador.disconnect();
      }
    });
    observador.observe(document.body, { childList: true, subtree: true });
  });
})();