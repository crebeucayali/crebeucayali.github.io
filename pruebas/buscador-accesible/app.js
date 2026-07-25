(() => {
  "use strict";

  const DATA_URL = "datos/recursos.json?v=1";
  const SINONIMOS_URL = "datos/sinonimos.json?v=1";
  const HISTORIAL_KEY = "eva_buscador_historial_v1";
  const FAVORITOS_KEY = "eva_buscador_favoritos_v1";
  const MAX_SUGERENCIAS = 7;
  const MAX_HISTORIAL = 8;

  const sinonimosBase = {
    braille: ["braile"],
    "lengua de señas": ["lsp", "señas"],
    capacitación: ["capacitacion", "taller", "curso"],
    pictogramas: ["pictograma", "apoyos visuales"],
    autismo: ["tea"]
  };

  const elementos = {
    entrada: document.querySelector("#buscador"),
    listaSugerencias: document.querySelector("#lista-sugerencias"),
    estadoBuscador: document.querySelector("#estado-buscador"),
    estadoCorreccion: document.querySelector("#estado-correccion"),
    estadoCatalogo: document.querySelector("#estado-catalogo"),
    limpiar: document.querySelector("#limpiar"),
    filtroModulo: document.querySelector("#filtro-modulo"),
    filtroCategoria: document.querySelector("#filtro-categoria"),
    filtroTipo: document.querySelector("#filtro-tipo"),
    soloFavoritos: document.querySelector("#solo-favoritos"),
    restablecer: document.querySelector("#restablecer-filtros"),
    compartir: document.querySelector("#compartir-busqueda"),
    estadoCompartir: document.querySelector("#estado-compartir"),
    contador: document.querySelector("#contador-resultados"),
    resumen: document.querySelector("#resumen-filtros"),
    listaResultados: document.querySelector("#lista-resultados"),
    botonesRapidos: document.querySelectorAll("[data-consulta]"),
    historial: document.querySelector("#historial-busquedas"),
    borrarHistorial: document.querySelector("#borrar-historial"),
    contadorFavoritos: document.querySelector("#contador-favoritos"),
    verFavoritos: document.querySelector("#ver-favoritos")
  };

  let recursos = [];
  let resultadosActuales = [];
  let sugerencias = [];
  let indiceActivo = -1;
  let sinonimos = { ...sinonimosBase };
  let vocabulario = new Set();
  let historial = leerJsonLocal(HISTORIAL_KEY, []);
  let favoritos = new Set(leerJsonLocal(FAVORITOS_KEY, []));

  function leerJsonLocal(clave, respaldo) {
    try {
      const datos = JSON.parse(localStorage.getItem(clave) || "null");
      return datos ?? respaldo;
    } catch (error) {
      return respaldo;
    }
  }

  const guardarJsonLocal = (clave, datos) => {
    try {
      localStorage.setItem(clave, JSON.stringify(datos));
      return true;
    } catch (error) {
      return false;
    }
  };

  const normalizar = (texto = "") => String(texto)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9ñ\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const palabrasDe = (texto) => normalizar(texto).split(" ").filter((palabra) => palabra.length >= 2);
  const etiquetasTexto = (recurso) => Array.isArray(recurso.etiquetas) ? recurso.etiquetas.join(" ") : String(recurso.etiquetas || "");
  const textoBuscable = (recurso) => [recurso.titulo, recurso.modulo, recurso.categoria, recurso.tipo, recurso.descripcion, etiquetasTexto(recurso)].join(" ");

  const esRecursoValido = (recurso) => Boolean(
    recurso && typeof recurso.id === "string" && typeof recurso.titulo === "string" &&
    typeof recurso.modulo === "string" && typeof recurso.categoria === "string" &&
    typeof recurso.tipo === "string" && typeof recurso.descripcion === "string" && typeof recurso.url === "string"
  );

  const distancia = (a, b, limite = 2) => {
    if (Math.abs(a.length - b.length) > limite) return limite + 1;
    const anterior = Array.from({ length: b.length + 1 }, (_, indice) => indice);
    for (let i = 1; i <= a.length; i += 1) {
      const actual = [i];
      let minimoFila = actual[0];
      for (let j = 1; j <= b.length; j += 1) {
        const costo = a[i - 1] === b[j - 1] ? 0 : 1;
        const valor = Math.min(actual[j - 1] + 1, anterior[j] + 1, anterior[j - 1] + costo);
        actual.push(valor);
        minimoFila = Math.min(minimoFila, valor);
      }
      if (minimoFila > limite) return limite + 1;
      anterior.splice(0, anterior.length, ...actual);
    }
    return anterior[b.length];
  };

  const construirVocabulario = () => {
    vocabulario = new Set();
    recursos.forEach((recurso) => palabrasDe(textoBuscable(recurso)).forEach((palabra) => {
      if (palabra.length >= 4) vocabulario.add(palabra);
    }));
    Object.entries(sinonimos).forEach(([principal, relacionados]) => {
      palabrasDe(principal).forEach((palabra) => vocabulario.add(palabra));
      relacionados.forEach((termino) => palabrasDe(termino).forEach((palabra) => vocabulario.add(palabra)));
    });
  };

  const encontrarCorreccion = (palabra) => {
    if (palabra.length < 4 || vocabulario.has(palabra)) return "";
    const limite = palabra.length <= 5 ? 1 : 2;
    let mejor = "";
    let mejorDistancia = limite + 1;
    vocabulario.forEach((candidata) => {
      if (Math.abs(candidata.length - palabra.length) > limite) return;
      const valor = distancia(palabra, candidata, limite);
      if (valor < mejorDistancia) {
        mejor = candidata;
        mejorDistancia = valor;
      }
    });
    return mejorDistancia <= limite ? mejor : "";
  };

  const analizarConsulta = (texto) => {
    const original = normalizar(texto);
    const palabras = palabrasDe(original);
    const ampliados = new Set(original ? [original, ...palabras] : []);
    const equivalencias = new Set();
    const correcciones = [];

    Object.entries(sinonimos).forEach(([principal, relacionados]) => {
      const grupo = [principal, ...relacionados].map(normalizar).filter(Boolean);
      const coincide = grupo.some((termino) => original === termino || palabras.includes(termino) || original.includes(termino));
      if (coincide) {
        grupo.forEach((termino) => ampliados.add(termino));
        const canonico = normalizar(principal);
        if (canonico && canonico !== original) equivalencias.add(principal);
      }
    });

    palabras.forEach((palabra) => {
      const correccion = encontrarCorreccion(palabra);
      if (correccion && correccion !== palabra) {
        ampliados.add(correccion);
        correcciones.push({ original: palabra, correccion });
      }
    });

    return { original, ampliados: [...ampliados], equivalencias: [...equivalencias], correcciones };
  };

  const puntuar = (recurso, analisis) => {
    if (!analisis.original) return 1;
    const titulo = normalizar(recurso.titulo);
    const modulo = normalizar(recurso.modulo);
    const categoria = normalizar(recurso.categoria);
    const tipo = normalizar(recurso.tipo);
    const descripcion = normalizar(recurso.descripcion);
    const etiquetas = normalizar(etiquetasTexto(recurso));
    let puntaje = 0;

    analisis.ampliados.forEach((termino) => {
      if (!termino) return;
      if (titulo === termino) puntaje += 18;
      else if (titulo.startsWith(termino)) puntaje += 12;
      else if (titulo.includes(termino)) puntaje += 8;
      if (modulo === termino) puntaje += 7;
      else if (modulo.includes(termino)) puntaje += 3;
      if (categoria.includes(termino)) puntaje += 5;
      if (tipo.includes(termino)) puntaje += 3;
      if (etiquetas.includes(termino)) puntaje += 5;
      if (descripcion.includes(termino)) puntaje += 2;
    });
    return puntaje;
  };

  const cerrarSugerencias = () => {
    elementos.listaSugerencias.hidden = true;
    elementos.entrada.setAttribute("aria-expanded", "false");
    elementos.entrada.setAttribute("aria-activedescendant", "");
    indiceActivo = -1;
  };

  const actualizarSugerenciaActiva = () => {
    const opciones = [...elementos.listaSugerencias.querySelectorAll('[role="option"]')];
    opciones.forEach((opcion, indice) => {
      const activa = indice === indiceActivo;
      opcion.classList.toggle("activo", activa);
      opcion.setAttribute("aria-selected", activa ? "true" : "false");
      if (activa) {
        elementos.entrada.setAttribute("aria-activedescendant", opcion.id);
        opcion.scrollIntoView({ block: "nearest" });
      }
    });
  };

  const crearOpcionFiltro = (valor) => {
    const opcion = document.createElement("option");
    opcion.value = valor;
    opcion.textContent = valor;
    return opcion;
  };

  const poblarFiltro = (select, valores) => {
    const textoInicial = select.options[0]?.textContent || "Todos";
    select.replaceChildren();
    const inicial = document.createElement("option");
    inicial.value = "";
    inicial.textContent = textoInicial;
    select.appendChild(inicial);
    valores.forEach((valor) => select.appendChild(crearOpcionFiltro(valor)));
  };

  const prepararFiltros = () => {
    poblarFiltro(elementos.filtroModulo, [...new Set(recursos.map((recurso) => recurso.modulo))].sort((a, b) => a.localeCompare(b, "es")));
    poblarFiltro(elementos.filtroCategoria, [...new Set(recursos.map((recurso) => recurso.categoria))].sort((a, b) => a.localeCompare(b, "es")));
    poblarFiltro(elementos.filtroTipo, [...new Set(recursos.map((recurso) => recurso.tipo))].sort((a, b) => a.localeCompare(b, "es")));
  };

  const estadoActual = () => ({
    q: elementos.entrada.value.trim(),
    modulo: elementos.filtroModulo.value,
    categoria: elementos.filtroCategoria.value,
    tipo: elementos.filtroTipo.value,
    favoritos: elementos.soloFavoritos.checked
  });

  const etiquetaEstado = (estado) => {
    const partes = [];
    if (estado.q) partes.push(`“${estado.q}”`);
    if (estado.modulo) partes.push(estado.modulo);
    if (estado.categoria) partes.push(estado.categoria);
    if (estado.tipo) partes.push(estado.tipo);
    if (estado.favoritos) partes.push("favoritos");
    return partes.join(" · ") || "Todos los recursos";
  };

  const registrarHistorial = () => {
    const estado = estadoActual();
    if (!estado.q && !estado.modulo && !estado.categoria && !estado.tipo && !estado.favoritos) return;
    const clave = JSON.stringify({ ...estado, q: normalizar(estado.q) });
    historial = historial.filter((item) => item.clave !== clave);
    historial.unshift({ clave, estado, fecha: new Date().toISOString() });
    historial = historial.slice(0, MAX_HISTORIAL);
    guardarJsonLocal(HISTORIAL_KEY, historial);
    renderizarHistorial();
  };

  const aplicarEstado = (estado) => {
    elementos.entrada.value = estado.q || "";
    elementos.filtroModulo.value = [...elementos.filtroModulo.options].some((opcion) => opcion.value === estado.modulo) ? estado.modulo : "";
    elementos.filtroCategoria.value = [...elementos.filtroCategoria.options].some((opcion) => opcion.value === estado.categoria) ? estado.categoria : "";
    elementos.filtroTipo.value = [...elementos.filtroTipo.options].some((opcion) => opcion.value === estado.tipo) ? estado.tipo : "";
    elementos.soloFavoritos.checked = Boolean(estado.favoritos);
  };

  const renderizarHistorial = () => {
    elementos.historial.replaceChildren();
    elementos.borrarHistorial.disabled = historial.length === 0;
    if (!historial.length) {
      const vacio = document.createElement("p");
      vacio.className = "vacio-pequeno";
      vacio.textContent = "Todavía no hay búsquedas recientes.";
      elementos.historial.appendChild(vacio);
      return;
    }
    historial.forEach((item) => {
      const boton = document.createElement("button");
      boton.type = "button";
      boton.textContent = etiquetaEstado(item.estado);
      boton.addEventListener("click", () => {
        aplicarEstado(item.estado);
        aplicarBusqueda({ actualizarDireccion: true });
        actualizarSugerencias();
        document.querySelector("#titulo-resultados").scrollIntoView({ behavior: "smooth", block: "start" });
      });
      elementos.historial.appendChild(boton);
    });
  };

  const actualizarFavoritos = () => {
    [...favoritos].forEach((id) => {
      if (!recursos.some((recurso) => recurso.id === id)) favoritos.delete(id);
    });
    guardarJsonLocal(FAVORITOS_KEY, [...favoritos]);
    elementos.contadorFavoritos.textContent = `${favoritos.size} ${favoritos.size === 1 ? "favorito" : "favoritos"}`;
    elementos.verFavoritos.disabled = favoritos.size === 0;
  };

  const alternarFavorito = (id) => {
    const recurso = recursos.find((item) => item.id === id);
    if (!recurso) return;
    if (favoritos.has(id)) favoritos.delete(id); else favoritos.add(id);
    guardarJsonLocal(FAVORITOS_KEY, [...favoritos]);
    actualizarFavoritos();
    aplicarBusqueda({ actualizarDireccion: false });
    elementos.estadoBuscador.textContent = favoritos.has(id)
      ? `${recurso.titulo} se añadió a favoritos.`
      : `${recurso.titulo} se retiró de favoritos.`;
  };

  const actualizarURL = () => {
    const estado = estadoActual();
    const parametros = new URLSearchParams();
    if (estado.q) parametros.set("q", estado.q);
    if (estado.modulo) parametros.set("modulo", estado.modulo);
    if (estado.categoria) parametros.set("categoria", estado.categoria);
    if (estado.tipo) parametros.set("tipo", estado.tipo);
    if (estado.favoritos) parametros.set("favoritos", "1");
    const nueva = `${window.location.pathname}${parametros.toString() ? `?${parametros}` : ""}${window.location.hash}`;
    window.history.replaceState(null, "", nueva);
  };

  const leerEstadoURL = () => {
    const parametros = new URLSearchParams(window.location.search);
    return {
      q: parametros.get("q") || "",
      modulo: parametros.get("modulo") || "",
      categoria: parametros.get("categoria") || "",
      tipo: parametros.get("tipo") || "",
      favoritos: parametros.get("favoritos") === "1"
    };
  };

  const actualizarEstadoCorreccion = (analisis) => {
    const mensajes = [];
    if (analisis.equivalencias.length) mensajes.push(`También se buscaron términos relacionados con: ${analisis.equivalencias.join(", ")}.`);
    if (analisis.correcciones.length) {
      mensajes.push(`Se consideraron posibles correcciones: ${analisis.correcciones.map((item) => `${item.original} → ${item.correccion}`).join(", ")}.`);
    }
    elementos.estadoCorreccion.hidden = mensajes.length === 0;
    elementos.estadoCorreccion.textContent = mensajes.join(" ");
  };

  const seleccionarSugerencia = (recurso) => {
    elementos.entrada.value = recurso.titulo;
    elementos.limpiar.hidden = false;
    cerrarSugerencias();
    aplicarBusqueda({ actualizarDireccion: true });
    registrarHistorial();
    elementos.estadoBuscador.textContent = `Recurso seleccionado: ${recurso.titulo}.`;
    elementos.listaResultados.querySelector("a")?.focus();
  };

  const renderizarSugerencias = () => {
    elementos.listaSugerencias.replaceChildren();
    if (!sugerencias.length) {
      cerrarSugerencias();
      return;
    }
    sugerencias.forEach((recurso, indice) => {
      const item = document.createElement("li");
      const boton = document.createElement("button");
      boton.type = "button";
      boton.id = `sugerencia-${indice}`;
      boton.setAttribute("role", "option");
      boton.setAttribute("aria-selected", "false");
      const modulo = document.createElement("span");
      modulo.className = "tipo";
      modulo.textContent = recurso.modulo;
      const texto = document.createElement("span");
      texto.className = "texto-sugerencia";
      const titulo = document.createElement("strong");
      titulo.textContent = recurso.titulo;
      const detalle = document.createElement("span");
      detalle.textContent = `${recurso.categoria} · ${recurso.tipo}`;
      texto.append(titulo, detalle);
      boton.append(modulo, texto);
      boton.addEventListener("mousedown", (evento) => evento.preventDefault());
      boton.addEventListener("click", () => seleccionarSugerencia(recurso));
      item.appendChild(boton);
      elementos.listaSugerencias.appendChild(item);
    });
    elementos.listaSugerencias.hidden = false;
    elementos.entrada.setAttribute("aria-expanded", "true");
    actualizarSugerenciaActiva();
  };

  const actualizarSugerencias = () => {
    const analisis = analizarConsulta(elementos.entrada.value);
    if (!analisis.original) {
      sugerencias = [];
      cerrarSugerencias();
      elementos.estadoBuscador.textContent = "Puede escribir una palabra o utilizar los filtros.";
      return;
    }
    sugerencias = recursos
      .map((recurso) => ({ recurso, puntaje: puntuar(recurso, analisis) }))
      .filter((resultado) => resultado.puntaje > 0)
      .sort((a, b) => b.puntaje - a.puntaje || a.recurso.titulo.localeCompare(b.recurso.titulo, "es"))
      .slice(0, MAX_SUGERENCIAS)
      .map((resultado) => resultado.recurso);
    indiceActivo = -1;
    renderizarSugerencias();
    elementos.estadoBuscador.textContent = sugerencias.length
      ? `${sugerencias.length} ${sugerencias.length === 1 ? "sugerencia disponible" : "sugerencias disponibles"}.`
      : "No se encontraron sugerencias. Revise los resultados o pruebe otra palabra.";
  };

  const crearResultado = (recurso) => {
    const articulo = document.createElement("article");
    articulo.className = `resultado-tarjeta${favoritos.has(recurso.id) ? " es-favorito" : ""}`;
    articulo.dataset.id = recurso.id;

    const cabecera = document.createElement("div");
    cabecera.className = "resultado-cabecera";
    const meta = document.createElement("div");
    meta.className = "resultado-meta";
    const modulo = document.createElement("span"); modulo.textContent = recurso.modulo;
    const tipo = document.createElement("span"); tipo.textContent = recurso.tipo;
    meta.append(modulo, tipo);

    const favorito = document.createElement("button");
    favorito.type = "button";
    favorito.className = "boton-favorito";
    favorito.textContent = favoritos.has(recurso.id) ? "★" : "☆";
    favorito.setAttribute("aria-pressed", favoritos.has(recurso.id) ? "true" : "false");
    favorito.setAttribute("aria-label", favoritos.has(recurso.id) ? `Quitar ${recurso.titulo} de favoritos` : `Añadir ${recurso.titulo} a favoritos`);
    favorito.addEventListener("click", () => alternarFavorito(recurso.id));
    cabecera.append(meta, favorito);

    const titulo = document.createElement("h3"); titulo.textContent = recurso.titulo;
    const categoria = document.createElement("p"); categoria.className = "resultado-categoria"; categoria.textContent = recurso.categoria;
    const descripcion = document.createElement("p"); descripcion.textContent = recurso.descripcion;
    const etiquetas = document.createElement("p");
    etiquetas.className = "resultado-etiquetas";
    const listaEtiquetas = Array.isArray(recurso.etiquetas) ? recurso.etiquetas.slice(0, 5) : [];
    etiquetas.textContent = listaEtiquetas.length ? `Temas: ${listaEtiquetas.join(", ")}` : "";

    const acciones = document.createElement("div"); acciones.className = "resultado-acciones";
    const enlace = document.createElement("a");
    enlace.className = "resultado-enlace";
    enlace.href = recurso.url;
    enlace.target = "_blank";
    enlace.rel = "noopener noreferrer";
    enlace.textContent = "Abrir recurso";
    enlace.setAttribute("aria-label", `Abrir ${recurso.titulo}`);
    enlace.addEventListener("click", registrarHistorial);
    acciones.appendChild(enlace);

    articulo.append(cabecera, titulo, categoria, descripcion);
    if (etiquetas.textContent) articulo.appendChild(etiquetas);
    articulo.appendChild(acciones);
    return articulo;
  };

  const descripcionFiltros = () => {
    const estado = estadoActual();
    const partes = [];
    if (estado.q) partes.push(`búsqueda “${estado.q}”`);
    if (estado.modulo) partes.push(`módulo ${estado.modulo}`);
    if (estado.categoria) partes.push(`categoría ${estado.categoria}`);
    if (estado.tipo) partes.push(`tipo ${estado.tipo}`);
    if (estado.favoritos) partes.push("solo favoritos");
    return partes.length ? `Filtros activos: ${partes.join("; ")}.` : "Se muestran todos los recursos del catálogo.";
  };

  const renderizarResultados = () => {
    elementos.listaResultados.replaceChildren();
    elementos.contador.textContent = `${resultadosActuales.length} ${resultadosActuales.length === 1 ? "resultado" : "resultados"}`;
    elementos.resumen.textContent = descripcionFiltros();
    if (!resultadosActuales.length) {
      const vacio = document.createElement("p");
      vacio.className = "resultado-vacio";
      vacio.textContent = elementos.soloFavoritos.checked && favoritos.size === 0
        ? "Todavía no ha marcado recursos como favoritos."
        : "No se encontraron recursos con la búsqueda y los filtros seleccionados.";
      elementos.listaResultados.appendChild(vacio);
      return;
    }
    resultadosActuales.forEach((recurso) => elementos.listaResultados.appendChild(crearResultado(recurso)));
  };

  const aplicarBusqueda = ({ actualizarDireccion = true } = {}) => {
    const analisis = analizarConsulta(elementos.entrada.value);
    const modulo = elementos.filtroModulo.value;
    const categoria = elementos.filtroCategoria.value;
    const tipo = elementos.filtroTipo.value;
    elementos.limpiar.hidden = !analisis.original;

    resultadosActuales = recursos
      .filter((recurso) => !modulo || recurso.modulo === modulo)
      .filter((recurso) => !categoria || recurso.categoria === categoria)
      .filter((recurso) => !tipo || recurso.tipo === tipo)
      .filter((recurso) => !elementos.soloFavoritos.checked || favoritos.has(recurso.id))
      .map((recurso) => ({ recurso, puntaje: puntuar(recurso, analisis) }))
      .filter((resultado) => !analisis.original || resultado.puntaje > 0)
      .sort((a, b) => {
        if (analisis.original && b.puntaje !== a.puntaje) return b.puntaje - a.puntaje;
        return a.recurso.titulo.localeCompare(b.recurso.titulo, "es");
      })
      .map((resultado) => resultado.recurso);

    actualizarEstadoCorreccion(analisis);
    renderizarResultados();
    if (actualizarDireccion) actualizarURL();
  };

  const habilitarInterfaz = () => {
    [elementos.entrada, elementos.filtroModulo, elementos.filtroCategoria, elementos.filtroTipo,
      elementos.soloFavoritos, elementos.restablecer, elementos.compartir].forEach((elemento) => { elemento.disabled = false; });
  };

  const copiarTexto = async (texto) => {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(texto);
      return;
    }
    const area = document.createElement("textarea");
    area.value = texto;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    const copiado = document.execCommand("copy");
    area.remove();
    if (!copiado) throw new Error("No se pudo copiar");
  };

  const mostrarErrorCarga = () => {
    elementos.estadoCatalogo.textContent = "No se pudo cargar el catálogo.";
    elementos.estadoCatalogo.classList.add("error");
    elementos.estadoBuscador.textContent = "Revise su conexión o recargue la página.";
    elementos.contador.textContent = "Error de carga";
    elementos.listaResultados.replaceChildren();
    const error = document.createElement("p");
    error.className = "resultado-vacio";
    error.textContent = "El archivo de recursos no está disponible en este momento.";
    elementos.listaResultados.appendChild(error);
  };

  const cargarCatalogo = async () => {
    try {
      const respuesta = await fetch(DATA_URL, { cache: "no-store" });
      if (!respuesta.ok) throw new Error(`HTTP ${respuesta.status}`);
      const datos = await respuesta.json();
      if (!Array.isArray(datos)) throw new Error("Formato de catálogo inválido");
      recursos = datos.filter(esRecursoValido);
      if (!recursos.length) throw new Error("Catálogo vacío");

      try {
        const respuestaSinonimos = await fetch(SINONIMOS_URL, { cache: "no-store" });
        if (respuestaSinonimos.ok) sinonimos = { ...sinonimosBase, ...(await respuestaSinonimos.json()) };
      } catch (error) {
        console.warn("Se utilizará el diccionario básico de sinónimos.", error);
      }

      prepararFiltros();
      construirVocabulario();
      habilitarInterfaz();
      actualizarFavoritos();
      renderizarHistorial();
      aplicarEstado(leerEstadoURL());
      aplicarBusqueda({ actualizarDireccion: false });
      elementos.estadoCatalogo.classList.remove("error");
      elementos.estadoCatalogo.textContent = `${recursos.length} recursos cargados`;
      elementos.estadoBuscador.textContent = "Puede escribir una palabra o utilizar los filtros.";
    } catch (error) {
      console.error("No se pudo cargar el catálogo de EVA:", error);
      mostrarErrorCarga();
    }
  };

  elementos.entrada.addEventListener("input", () => {
    actualizarSugerencias();
    aplicarBusqueda({ actualizarDireccion: true });
  });

  elementos.entrada.addEventListener("keydown", (evento) => {
    if (evento.key === "ArrowDown") {
      evento.preventDefault();
      if (elementos.listaSugerencias.hidden) actualizarSugerencias();
      if (!sugerencias.length) return;
      indiceActivo = (indiceActivo + 1) % sugerencias.length;
      actualizarSugerenciaActiva();
    }
    if (evento.key === "ArrowUp") {
      evento.preventDefault();
      if (!sugerencias.length) return;
      indiceActivo = indiceActivo <= 0 ? sugerencias.length - 1 : indiceActivo - 1;
      actualizarSugerenciaActiva();
    }
    if (evento.key === "Enter") {
      if (indiceActivo >= 0 && sugerencias[indiceActivo]) {
        evento.preventDefault();
        seleccionarSugerencia(sugerencias[indiceActivo]);
      } else {
        cerrarSugerencias();
        aplicarBusqueda({ actualizarDireccion: true });
        registrarHistorial();
      }
    }
    if (evento.key === "Escape") {
      cerrarSugerencias();
      elementos.estadoBuscador.textContent = "Lista de sugerencias cerrada.";
    }
  });

  elementos.limpiar.addEventListener("click", () => {
    elementos.entrada.value = "";
    cerrarSugerencias();
    aplicarBusqueda({ actualizarDireccion: true });
    elementos.estadoBuscador.textContent = "Búsqueda restablecida.";
    elementos.entrada.focus();
  });

  [elementos.filtroModulo, elementos.filtroCategoria, elementos.filtroTipo, elementos.soloFavoritos]
    .forEach((control) => control.addEventListener("change", () => {
      cerrarSugerencias();
      aplicarBusqueda({ actualizarDireccion: true });
    }));

  elementos.restablecer.addEventListener("click", () => {
    aplicarEstado({ q: "", modulo: "", categoria: "", tipo: "", favoritos: false });
    cerrarSugerencias();
    aplicarBusqueda({ actualizarDireccion: true });
    elementos.estadoBuscador.textContent = "Búsqueda y filtros restablecidos.";
    elementos.entrada.focus();
  });

  elementos.botonesRapidos.forEach((boton) => boton.addEventListener("click", () => {
    elementos.entrada.value = boton.dataset.consulta || "";
    actualizarSugerencias();
    aplicarBusqueda({ actualizarDireccion: true });
    registrarHistorial();
    elementos.entrada.focus();
  }));

  elementos.compartir.addEventListener("click", async () => {
    actualizarURL();
    registrarHistorial();
    try {
      await copiarTexto(window.location.href);
      elementos.estadoCompartir.textContent = "Enlace copiado. Puede enviarlo por WhatsApp, correo u otro medio.";
    } catch (error) {
      elementos.estadoCompartir.textContent = "No se pudo copiar automáticamente. Copie la dirección desde la barra del navegador.";
    }
  });

  elementos.borrarHistorial.addEventListener("click", () => {
    historial = [];
    localStorage.removeItem(HISTORIAL_KEY);
    renderizarHistorial();
    elementos.estadoBuscador.textContent = "Historial de búsquedas eliminado.";
  });

  elementos.verFavoritos.addEventListener("click", () => {
    elementos.soloFavoritos.checked = true;
    aplicarBusqueda({ actualizarDireccion: true });
    document.querySelector("#titulo-resultados").scrollIntoView({ behavior: "smooth", block: "start" });
  });

  document.addEventListener("click", (evento) => {
    if (!evento.target.closest(".campo-autocompletado")) cerrarSugerencias();
  });

  window.addEventListener("popstate", () => {
    aplicarEstado(leerEstadoURL());
    aplicarBusqueda({ actualizarDireccion: false });
  });

  cargarCatalogo();
})();