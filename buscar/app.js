(() => {
  "use strict";

  const FUENTES_URL = "datos/fuentes.json?v=1";
  const SINONIMOS_URL = "datos/sinonimos.json?v=1";
  const HISTORIAL_KEY = "eva_buscador_historial_v1";
  const FAVORITOS_KEY = "eva_buscador_favoritos_v1";
  const TARJETAS_KEY = "eva_tarjetas_educativas_v1";
  const MAX_HISTORIAL = 8;
  const MAX_SUGERENCIAS = 7;

  const $ = (selector) => document.querySelector(selector);
  const elementos = {
    entrada: $("#buscador"), sugerencias: $("#lista-sugerencias"), estado: $("#estado-buscador"), correccion: $("#estado-correccion"), catalogo: $("#estado-catalogo"), limpiar: $("#limpiar"),
    modulo: $("#filtro-modulo"), categoria: $("#filtro-categoria"), tipo: $("#filtro-tipo"), soloFavoritos: $("#solo-favoritos"), restablecer: $("#restablecer-filtros"), compartir: $("#compartir-busqueda"), estadoCompartir: $("#estado-compartir"),
    contador: $("#contador-resultados"), resumen: $("#resumen-filtros"), resultados: $("#lista-resultados"), historial: $("#historial-busquedas"), borrarHistorial: $("#borrar-historial"), contadorFavoritos: $("#contador-favoritos"), verFavoritos: $("#ver-favoritos"),
    listaFuentes: $("#lista-fuentes"), fechaIndice: $("#fecha-indice"), botonesRapidos: document.querySelectorAll("[data-consulta]")
  };

  let recursos = [];
  let sinonimos = {};
  let vocabulario = new Set();
  let resultadosActuales = [];
  let sugerenciasActuales = [];
  let indiceActivo = -1;
  let historial = leerLocal(HISTORIAL_KEY, []);
  let favoritos = new Set(leerLocal(FAVORITOS_KEY, []));

  function leerLocal(clave, respaldo) {
    try { return JSON.parse(localStorage.getItem(clave) || "null") ?? respaldo; }
    catch { return respaldo; }
  }
  function guardarLocal(clave, datos) {
    try { localStorage.setItem(clave, JSON.stringify(datos)); return true; }
    catch { return false; }
  }
  function normalizar(texto = "") {
    return String(texto).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9ñ\s]/g, " ").replace(/\s+/g, " ").trim();
  }
  function palabras(texto) { return normalizar(texto).split(" ").filter((p) => p.length >= 2); }
  function etiquetasTexto(recurso) { return Array.isArray(recurso.etiquetas) ? recurso.etiquetas.join(" ") : String(recurso.etiquetas || ""); }
  function esRecursoValido(r) {
    return Boolean(r && typeof r.id === "string" && typeof r.titulo === "string" && typeof r.modulo === "string" && typeof r.categoria === "string" && typeof r.tipo === "string" && typeof r.descripcion === "string" && typeof r.url === "string");
  }

  async function obtenerJson(url, timeout = 8000) {
    const controlador = new AbortController();
    const temporizador = setTimeout(() => controlador.abort(), timeout);
    try {
      const respuesta = await fetch(url, { cache: "no-store", signal: controlador.signal });
      if (!respuesta.ok) throw new Error(`HTTP ${respuesta.status}`);
      return await respuesta.json();
    } finally { clearTimeout(temporizador); }
  }

  function recursosLocales() {
    const datos = leerLocal(TARJETAS_KEY, []);
    if (!Array.isArray(datos)) return [];
    return datos.filter((t) => t && t.id && t.frente && t.reverso).map((t) => ({
      id: `local-${t.id}`, titulo: t.frente, modulo: "LOCAL", categoria: t.categoria || "Tarjetas personales", tipo: "Tarjeta educativa personal",
      descripcion: t.reverso, etiquetas: [t.tipo || "tarjeta", "tarjetas educativas", t.textoAlternativo || ""].filter(Boolean),
      url: "/pruebas/tarjetas-educativas/#mis-tarjetas", fechaActualizacion: t.fechaActualizacion || t.fechaCreacion || "", fuente: "Tarjetas de este navegador", local: true
    }));
  }

  function renderizarFuentes(estados) {
    elementos.listaFuentes.replaceChildren();
    estados.forEach((estado) => {
      const li = document.createElement("li");
      li.className = estado.ok ? "cargada" : "error";
      li.textContent = estado.ok ? `${estado.nombre}: ${estado.cantidad} recursos cargados.` : `${estado.nombre}: no disponible; el buscador continúa con las demás fuentes.`;
      elementos.listaFuentes.appendChild(li);
    });
  }

  async function cargarFuentes() {
    const configuracion = await obtenerJson(FUENTES_URL);
    if (!Array.isArray(configuracion)) throw new Error("Configuración de fuentes inválida");
    const resultados = await Promise.allSettled(configuracion.map(async (fuente) => {
      const datos = await obtenerJson(fuente.url);
      if (!Array.isArray(datos)) throw new Error("Catálogo inválido");
      return { fuente, datos: datos.filter(esRecursoValido).map((r) => ({ ...r, fuente: fuente.nombre })) };
    }));

    const estados = [];
    const combinados = [];
    resultados.forEach((resultado, i) => {
      const fuente = configuracion[i];
      if (resultado.status === "fulfilled") {
        combinados.push(...resultado.value.datos);
        estados.push({ nombre: fuente.nombre, cantidad: resultado.value.datos.length, ok: true });
      } else {
        estados.push({ nombre: fuente.nombre, cantidad: 0, ok: false });
      }
    });

    const locales = recursosLocales();
    if (locales.length) {
      combinados.push(...locales);
      estados.push({ nombre: "Tarjetas personales", cantidad: locales.length, ok: true });
    }

    const unicos = new Map();
    combinados.forEach((r) => { if (!unicos.has(r.id)) unicos.set(r.id, r); });
    recursos = [...unicos.values()];
    renderizarFuentes(estados);
    const cargadas = estados.filter((e) => e.ok).length;
    elementos.catalogo.textContent = `${recursos.length} recursos · ${cargadas} fuentes activas`;
    elementos.fechaIndice.textContent = `Actualizado: ${new Date().toLocaleDateString("es-PE")}`;
    if (!recursos.length) throw new Error("No se pudo cargar ninguna fuente");
  }

  function distancia(a, b, limite = 2) {
    if (Math.abs(a.length - b.length) > limite) return limite + 1;
    let anterior = Array.from({ length: b.length + 1 }, (_, i) => i);
    for (let i = 1; i <= a.length; i += 1) {
      const actual = [i];
      let minimo = i;
      for (let j = 1; j <= b.length; j += 1) {
        const costo = a[i - 1] === b[j - 1] ? 0 : 1;
        const valor = Math.min(actual[j - 1] + 1, anterior[j] + 1, anterior[j - 1] + costo);
        actual.push(valor); minimo = Math.min(minimo, valor);
      }
      if (minimo > limite) return limite + 1;
      anterior = actual;
    }
    return anterior[b.length];
  }

  function construirVocabulario() {
    vocabulario = new Set();
    recursos.forEach((r) => palabras([r.titulo, r.modulo, r.categoria, r.tipo, r.descripcion, etiquetasTexto(r)].join(" ")).forEach((p) => { if (p.length >= 4) vocabulario.add(p); }));
    Object.entries(sinonimos).forEach(([principal, relacionados]) => [principal, ...relacionados].forEach((t) => palabras(t).forEach((p) => vocabulario.add(p))));
  }

  function corregir(palabra) {
    if (palabra.length < 4 || vocabulario.has(palabra)) return "";
    const limite = palabra.length <= 5 ? 1 : 2;
    let mejor = ""; let valorMejor = limite + 1;
    vocabulario.forEach((candidata) => {
      if (Math.abs(candidata.length - palabra.length) > limite) return;
      const valor = distancia(palabra, candidata, limite);
      if (valor < valorMejor) { mejor = candidata; valorMejor = valor; }
    });
    return valorMejor <= limite ? mejor : "";
  }

  function analizarConsulta(texto) {
    const original = normalizar(texto);
    const tokens = palabras(original);
    const ampliados = new Set(original ? [original, ...tokens] : []);
    const equivalencias = [];
    const correcciones = [];
    Object.entries(sinonimos).forEach(([principal, relacionados]) => {
      const grupo = [principal, ...relacionados].map(normalizar);
      if (grupo.some((t) => original === t || original.includes(t) || tokens.includes(t))) {
        grupo.forEach((t) => ampliados.add(t));
        if (normalizar(principal) !== original) equivalencias.push(principal);
      }
    });
    tokens.forEach((token) => {
      const c = corregir(token);
      if (c && c !== token) { ampliados.add(c); correcciones.push({ original: token, correccion: c }); }
    });
    return { original, ampliados: [...ampliados], equivalencias: [...new Set(equivalencias)], correcciones };
  }

  function puntuar(recurso, analisis) {
    if (!analisis.original) return 1;
    const campos = {
      titulo: normalizar(recurso.titulo), modulo: normalizar(recurso.modulo), categoria: normalizar(recurso.categoria), tipo: normalizar(recurso.tipo),
      descripcion: normalizar(recurso.descripcion), etiquetas: normalizar(etiquetasTexto(recurso))
    };
    let total = 0;
    analisis.ampliados.forEach((t) => {
      if (!t) return;
      if (campos.titulo === t) total += 18; else if (campos.titulo.startsWith(t)) total += 12; else if (campos.titulo.includes(t)) total += 8;
      if (campos.modulo === t) total += 7; else if (campos.modulo.includes(t)) total += 3;
      if (campos.categoria.includes(t)) total += 5;
      if (campos.tipo.includes(t)) total += 3;
      if (campos.etiquetas.includes(t)) total += 5;
      if (campos.descripcion.includes(t)) total += 2;
    });
    return total;
  }

  function poblarFiltro(select, valores) {
    const etiqueta = select.options[0]?.textContent || "Todos";
    select.replaceChildren();
    const inicial = document.createElement("option"); inicial.value = ""; inicial.textContent = etiqueta; select.appendChild(inicial);
    valores.forEach((v) => { const o = document.createElement("option"); o.value = v; o.textContent = v; select.appendChild(o); });
  }
  function prepararFiltros() {
    poblarFiltro(elementos.modulo, [...new Set(recursos.map((r) => r.modulo))].sort((a, b) => a.localeCompare(b, "es")));
    poblarFiltro(elementos.categoria, [...new Set(recursos.map((r) => r.categoria))].sort((a, b) => a.localeCompare(b, "es")));
    poblarFiltro(elementos.tipo, [...new Set(recursos.map((r) => r.tipo))].sort((a, b) => a.localeCompare(b, "es")));
  }

  function estadoActual() { return { q: elementos.entrada.value.trim(), modulo: elementos.modulo.value, categoria: elementos.categoria.value, tipo: elementos.tipo.value, favoritos: elementos.soloFavoritos.checked }; }
  function aplicarEstado(e) {
    elementos.entrada.value = e.q || "";
    [ [elementos.modulo, e.modulo], [elementos.categoria, e.categoria], [elementos.tipo, e.tipo] ].forEach(([s, v]) => { s.value = [...s.options].some((o) => o.value === v) ? v : ""; });
    elementos.soloFavoritos.checked = Boolean(e.favoritos);
  }
  function actualizarURL() {
    const e = estadoActual(); const p = new URLSearchParams();
    if (e.q) p.set("q", e.q); if (e.modulo) p.set("modulo", e.modulo); if (e.categoria) p.set("categoria", e.categoria); if (e.tipo) p.set("tipo", e.tipo); if (e.favoritos) p.set("favoritos", "1");
    history.replaceState(null, "", `${location.pathname}${p.toString() ? `?${p}` : ""}${location.hash}`);
  }
  function leerURL() { const p = new URLSearchParams(location.search); return { q: p.get("q") || "", modulo: p.get("modulo") || "", categoria: p.get("categoria") || "", tipo: p.get("tipo") || "", favoritos: p.get("favoritos") === "1" }; }

  function cerrarSugerencias() { elementos.sugerencias.hidden = true; elementos.entrada.setAttribute("aria-expanded", "false"); elementos.entrada.setAttribute("aria-activedescendant", ""); indiceActivo = -1; }
  function actualizarActivo() {
    [...elementos.sugerencias.querySelectorAll('[role="option"]')].forEach((o, i) => { const activo = i === indiceActivo; o.classList.toggle("activo", activo); o.setAttribute("aria-selected", activo ? "true" : "false"); if (activo) { elementos.entrada.setAttribute("aria-activedescendant", o.id); o.scrollIntoView({ block: "nearest" }); } });
  }
  function seleccionarSugerencia(r) { elementos.entrada.value = r.titulo; cerrarSugerencias(); aplicarBusqueda(true); registrarHistorial(); elementos.resultados.querySelector("a")?.focus(); }
  function actualizarSugerencias() {
    const analisis = analizarConsulta(elementos.entrada.value);
    if (!analisis.original) { sugerenciasActuales = []; cerrarSugerencias(); return; }
    sugerenciasActuales = recursos.map((r) => ({ r, p: puntuar(r, analisis) })).filter((x) => x.p > 0).sort((a, b) => b.p - a.p || a.r.titulo.localeCompare(b.r.titulo, "es")).slice(0, MAX_SUGERENCIAS).map((x) => x.r);
    elementos.sugerencias.replaceChildren();
    sugerenciasActuales.forEach((r, i) => {
      const li = document.createElement("li"); const b = document.createElement("button"); b.type = "button"; b.id = `sugerencia-${i}`; b.setAttribute("role", "option"); b.setAttribute("aria-selected", "false");
      const m = document.createElement("span"); m.className = "tipo"; m.textContent = r.modulo;
      const t = document.createElement("span"); t.className = "texto-sugerencia"; const s = document.createElement("strong"); s.textContent = r.titulo; const d = document.createElement("span"); d.textContent = `${r.categoria} · ${r.tipo}`; t.append(s, d); b.append(m, t);
      b.addEventListener("mousedown", (e) => e.preventDefault()); b.addEventListener("click", () => seleccionarSugerencia(r)); li.appendChild(b); elementos.sugerencias.appendChild(li);
    });
    elementos.sugerencias.hidden = sugerenciasActuales.length === 0; elementos.entrada.setAttribute("aria-expanded", sugerenciasActuales.length ? "true" : "false"); indiceActivo = -1;
  }

  function actualizarCorreccion(analisis) {
    const mensajes = [];
    if (analisis.equivalencias.length) mensajes.push(`También se buscaron términos relacionados con: ${analisis.equivalencias.join(", ")}.`);
    if (analisis.correcciones.length) mensajes.push(`Se consideraron posibles correcciones: ${analisis.correcciones.map((x) => `${x.original} → ${x.correccion}`).join(", ")}.`);
    elementos.correccion.hidden = mensajes.length === 0; elementos.correccion.textContent = mensajes.join(" ");
  }

  function crearResultado(r) {
    const a = document.createElement("article"); a.className = "resultado"; a.dataset.id = r.id;
    const meta = document.createElement("div"); meta.className = "resultado-meta"; [r.modulo, r.tipo, r.fuente || "EVA"].forEach((v) => { const s = document.createElement("span"); s.textContent = v; meta.appendChild(s); });
    const h = document.createElement("h3"); h.textContent = r.titulo;
    const c = document.createElement("p"); c.className = "resultado-categoria"; c.textContent = r.categoria;
    const d = document.createElement("p"); d.textContent = r.descripcion;
    const acciones = document.createElement("div"); acciones.className = "resultado-acciones";
    const enlace = document.createElement("a"); enlace.className = "resultado-enlace"; enlace.href = r.url; enlace.textContent = "Abrir recurso"; enlace.setAttribute("aria-label", `Abrir ${r.titulo}`); if (/^https?:/.test(r.url)) { enlace.target = "_blank"; enlace.rel = "noopener noreferrer"; }
    const fav = document.createElement("button"); fav.type = "button"; fav.className = "favorito"; fav.dataset.id = r.id; fav.setAttribute("aria-pressed", favoritos.has(r.id) ? "true" : "false"); fav.textContent = favoritos.has(r.id) ? "★ Favorito" : "☆ Guardar"; fav.setAttribute("aria-label", favoritos.has(r.id) ? `Quitar ${r.titulo} de favoritos` : `Guardar ${r.titulo} como favorito`);
    fav.addEventListener("click", () => alternarFavorito(r.id)); acciones.append(enlace, fav); a.append(meta, h, c, d, acciones); return a;
  }

  function descripcionFiltros() {
    const e = estadoActual(); const partes = [];
    if (e.q) partes.push(`búsqueda “${e.q}”`); if (e.modulo) partes.push(`módulo ${e.modulo}`); if (e.categoria) partes.push(`categoría ${e.categoria}`); if (e.tipo) partes.push(`tipo ${e.tipo}`); if (e.favoritos) partes.push("solo favoritos");
    return partes.length ? `Filtros activos: ${partes.join("; ")}.` : "Se muestran todos los recursos disponibles.";
  }

  function renderizarResultados() {
    elementos.resultados.replaceChildren(); elementos.contador.textContent = `${resultadosActuales.length} ${resultadosActuales.length === 1 ? "resultado" : "resultados"}`; elementos.resumen.textContent = descripcionFiltros();
    if (!resultadosActuales.length) { const p = document.createElement("p"); p.className = "vacio"; p.textContent = "No se encontraron recursos con la búsqueda y los filtros seleccionados."; elementos.resultados.appendChild(p); return; }
    resultadosActuales.forEach((r) => elementos.resultados.appendChild(crearResultado(r)));
  }

  function aplicarBusqueda(actualizarDireccion = false) {
    const analisis = analizarConsulta(elementos.entrada.value); actualizarCorreccion(analisis);
    resultadosActuales = recursos.filter((r) => !elementos.modulo.value || r.modulo === elementos.modulo.value).filter((r) => !elementos.categoria.value || r.categoria === elementos.categoria.value).filter((r) => !elementos.tipo.value || r.tipo === elementos.tipo.value).filter((r) => !elementos.soloFavoritos.checked || favoritos.has(r.id)).map((r) => ({ r, p: puntuar(r, analisis) })).filter((x) => !analisis.original || x.p > 0).sort((a, b) => analisis.original && b.p !== a.p ? b.p - a.p : a.r.titulo.localeCompare(b.r.titulo, "es")).map((x) => x.r);
    elementos.limpiar.hidden = !analisis.original; renderizarResultados(); if (actualizarDireccion) actualizarURL();
    elementos.estado.textContent = analisis.original ? `${resultadosActuales.length} resultados para la consulta.` : "Puede escribir una palabra o utilizar los filtros.";
  }

  function etiquetaHistorial(e) { return [e.q ? `“${e.q}”` : "", e.modulo, e.categoria, e.tipo, e.favoritos ? "favoritos" : ""].filter(Boolean).join(" · ") || "Todos los recursos"; }
  function registrarHistorial() {
    const e = estadoActual(); if (!e.q && !e.modulo && !e.categoria && !e.tipo && !e.favoritos) return;
    const clave = JSON.stringify({ ...e, q: normalizar(e.q) }); historial = historial.filter((x) => x.clave !== clave); historial.unshift({ clave, estado: e, fecha: new Date().toISOString() }); historial = historial.slice(0, MAX_HISTORIAL); guardarLocal(HISTORIAL_KEY, historial); renderizarHistorial();
  }
  function renderizarHistorial() {
    elementos.historial.replaceChildren(); elementos.borrarHistorial.disabled = historial.length === 0;
    if (!historial.length) { const p = document.createElement("p"); p.className = "vacio-pequeno"; p.textContent = "Todavía no hay búsquedas recientes."; elementos.historial.appendChild(p); return; }
    historial.forEach((item) => { const b = document.createElement("button"); b.type = "button"; b.textContent = etiquetaHistorial(item.estado); b.addEventListener("click", () => { aplicarEstado(item.estado); aplicarBusqueda(true); actualizarSugerencias(); $("#titulo-resultados").scrollIntoView({ behavior: "smooth", block: "start" }); }); elementos.historial.appendChild(b); });
  }
  function actualizarFavoritos() {
    [...favoritos].forEach((id) => { if (!recursos.some((r) => r.id === id)) favoritos.delete(id); }); guardarLocal(FAVORITOS_KEY, [...favoritos]); elementos.contadorFavoritos.textContent = `${favoritos.size} ${favoritos.size === 1 ? "favorito" : "favoritos"}`; elementos.verFavoritos.disabled = favoritos.size === 0;
  }
  function alternarFavorito(id) { if (favoritos.has(id)) favoritos.delete(id); else favoritos.add(id); guardarLocal(FAVORITOS_KEY, [...favoritos]); actualizarFavoritos(); aplicarBusqueda(false); }

  async function copiar(texto) { if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(texto); const t = document.createElement("textarea"); t.value = texto; t.style.position = "fixed"; t.style.opacity = "0"; document.body.appendChild(t); t.select(); document.execCommand("copy"); t.remove(); }
  function habilitar() { [elementos.entrada, elementos.modulo, elementos.categoria, elementos.tipo, elementos.soloFavoritos, elementos.restablecer, elementos.compartir].forEach((e) => { e.disabled = false; }); }

  function configurarEventos() {
    elementos.entrada.addEventListener("input", () => { actualizarSugerencias(); aplicarBusqueda(true); });
    elementos.entrada.addEventListener("keydown", (e) => {
      if (e.key === "ArrowDown") { e.preventDefault(); if (elementos.sugerencias.hidden) actualizarSugerencias(); if (!sugerenciasActuales.length) return; indiceActivo = (indiceActivo + 1) % sugerenciasActuales.length; actualizarActivo(); }
      if (e.key === "ArrowUp") { e.preventDefault(); if (!sugerenciasActuales.length) return; indiceActivo = indiceActivo <= 0 ? sugerenciasActuales.length - 1 : indiceActivo - 1; actualizarActivo(); }
      if (e.key === "Enter") { if (indiceActivo >= 0 && sugerenciasActuales[indiceActivo]) { e.preventDefault(); seleccionarSugerencia(sugerenciasActuales[indiceActivo]); } else { cerrarSugerencias(); aplicarBusqueda(true); registrarHistorial(); } }
      if (e.key === "Escape") { cerrarSugerencias(); elementos.estado.textContent = "Lista de sugerencias cerrada."; }
    });
    elementos.limpiar.addEventListener("click", () => { elementos.entrada.value = ""; cerrarSugerencias(); aplicarBusqueda(true); elementos.entrada.focus(); });
    [elementos.modulo, elementos.categoria, elementos.tipo, elementos.soloFavoritos].forEach((e) => e.addEventListener("change", () => { cerrarSugerencias(); aplicarBusqueda(true); }));
    elementos.restablecer.addEventListener("click", () => { aplicarEstado({}); cerrarSugerencias(); aplicarBusqueda(true); elementos.entrada.focus(); });
    elementos.botonesRapidos.forEach((b) => b.addEventListener("click", () => { elementos.entrada.value = b.dataset.consulta || ""; actualizarSugerencias(); aplicarBusqueda(true); registrarHistorial(); elementos.entrada.focus(); }));
    elementos.compartir.addEventListener("click", async () => { actualizarURL(); registrarHistorial(); try { await copiar(location.href); elementos.estadoCompartir.textContent = "Enlace copiado."; } catch { elementos.estadoCompartir.textContent = "Copie la dirección desde la barra del navegador."; } });
    elementos.borrarHistorial.addEventListener("click", () => { historial = []; localStorage.removeItem(HISTORIAL_KEY); renderizarHistorial(); });
    elementos.verFavoritos.addEventListener("click", () => { elementos.soloFavoritos.checked = true; aplicarBusqueda(true); $("#titulo-resultados").scrollIntoView({ behavior: "smooth", block: "start" }); });
    document.addEventListener("click", (e) => { if (!e.target.closest(".campo-autocompletado")) cerrarSugerencias(); });
    window.addEventListener("popstate", () => { aplicarEstado(leerURL()); aplicarBusqueda(false); });
  }

  async function iniciar() {
    renderizarHistorial();
    try {
      const [_, sinonimosCargados] = await Promise.all([cargarFuentes(), obtenerJson(SINONIMOS_URL).catch(() => ({}))]);
      sinonimos = sinonimosCargados && typeof sinonimosCargados === "object" ? sinonimosCargados : {};
      prepararFiltros(); construirVocabulario(); habilitar(); actualizarFavoritos(); aplicarEstado(leerURL()); aplicarBusqueda(false); configurarEventos();
    } catch (error) {
      console.error(error); elementos.catalogo.textContent = "No se pudo cargar el buscador"; elementos.catalogo.classList.add("error"); elementos.estado.textContent = "Recargue la página o inténtelo más tarde."; elementos.contador.textContent = "Error"; elementos.resultados.innerHTML = '<p class="vacio">No se pudo cargar ninguna fuente del catálogo.</p>';
    }
  }

  iniciar();
})();