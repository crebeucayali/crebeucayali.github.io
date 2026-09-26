(() => {
  "use strict";

  const STORAGE_KEY = "eva_accesibilidad_preferencias";
  const CENTRAL_VERSION = "10";
  const CENTRAL_URL = `https://crebeucayali.github.io/accesos-complementarios/accesibilidad/accesibilidad.js?v=${CENTRAL_VERSION}`;
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
  };

  const cargarHerramientaCentral = () => {
    if (document.querySelector(`script[data-eva-accesibilidad-central="${CENTRAL_VERSION}"]`)) return;

    const script = document.createElement("script");
    script.src = CENTRAL_URL;
    script.async = false;
    script.dataset.evaAccesibilidadCentral = CENTRAL_VERSION;
    document.head.appendChild(script);
  };

  migrarPreferenciasAnteriores();
  cargarHerramientaCentral();

  document.addEventListener("DOMContentLoaded", migrarPreferenciasAnteriores, { once: true });
})();
