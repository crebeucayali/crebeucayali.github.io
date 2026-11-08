(() => {
  "use strict";
  const layout = document.getElementById("eva-distribucion");
  const aside = document.getElementById("eva-columna-lateral");
  if (!layout || !aside) return;

  const ENDPOINT = "https://dteimbhwtzghhsijeeld.supabase.co/rest/v1/";
  const PUBLIC_KEY = "sb_publishable_tHbo1jTeW_dC90hdA5DvyQ_a6LrfKpq";
  const CALENDAR = "https://crebeucayali.github.io/accesos-complementarios/recursos/calendario.html";
  const REPOSITORY = "https://crebeucayali.github.io/repositorio-accesible/";
  const NEWS = "https://crebeucayali.github.io/noti-inclusivos/";
  let started = false;

  function readableDate(iso) {
    const value = String(iso || "");
    if (!/^\d{4}-\d{2}-\d{2}(?:[T ]|$)/.test(value)) return "";
    const date = new Date(value.length === 10 ? value + "T12:00:00Z" : value.replace(" ", "T"));
    if (!Number.isFinite(date.getTime())) return "";
    return new Intl.DateTimeFormat("es-PE", {
      day: "numeric", month: "short", year: "numeric", timeZone: "America/Lima"
    }).format(date);
  }
  function dateTodayInPeru() {
    return new Intl.DateTimeFormat("sv-SE", {
      timeZone: "America/Lima", year: "numeric", month: "2-digit", day: "2-digit"
    }).format(new Date());
  }
  function safeLink(url, fallback) {
    try {
      const target = new URL(String(url || ""));
      if (target.protocol !== "https:" || target.hostname !== "crebeucayali.github.io"
        || target.username || target.password) return fallback;
      return target.href;
    } catch { return fallback; }
  }
  function clean(text, maxLength = 130) {
    return String(text || "").replace(/\s+/g, " ").trim().slice(0, maxLength);
  }
  function line(label, url, meta) {
    const li = document.createElement("li");
    const a = document.createElement("a");
    a.textContent = label;
    a.href = url;
    li.appendChild(a);
    if (meta) {
      const small = document.createElement("small");
      small.textContent = meta;
      li.appendChild(small);
    }
    return li;
  }
  function replaceList(id, items, emptyMessage) {
    const list = document.getElementById(id);
    if (!list) return;
    if (items.length) list.replaceChildren(...items);
    else {
      const li = document.createElement("li");
      li.textContent = emptyMessage;
      list.replaceChildren(li);
    }
  }
  async function request(table, params) {
    const url = new URL(table, ENDPOINT);
    for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
    const response = await fetch(url.href, {
      method: "GET",
      headers: { apikey: PUBLIC_KEY, Accept: "application/json" },
      credentials: "omit",
      cache: "no-store",
      signal: AbortSignal.timeout(12000)
    });
    if (!response.ok) throw new Error("No se pudo consultar contenido público de EVA");
    const result = await response.json();
    if (!Array.isArray(result)) throw new Error("Respuesta pública inesperada");
    return result;
  }
  function resources(rows) {
    return rows.filter(row => clean(row.titulo)).slice(0, 3).map(row => line(
      clean(row.titulo, 100),
      REPOSITORY,
      readableDate(row.created_at) ? "Registrado: " + readableDate(row.created_at) : ""
    ));
  }
  function news(rows) {
    return rows.filter(row => clean(row.titulo)).slice(0, 3).map(row => line(
      clean(row.titulo, 100),
      safeLink(row.enlace_url, NEWS),
      readableDate(row.created_at) ? "Publicado: " + readableDate(row.created_at) : ""
    ));
  }
  function upcoming(rows) {
    const today = dateTodayInPeru();
    return rows.filter(row => {
      const date = String(row.fecha || "");
      return date >= today && /^\d{4}-\d{2}-\d{2}$/.test(date);
    }).slice(0, 3).map(row => {
      const lines = Array.isArray(row.contenido_lineas) ? row.contenido_lineas : [];
      const name = lines.map(item => clean(item, 140)).filter(Boolean).at(-1);
      return line(name || "Actividad del calendario CREBE", CALENDAR,
        readableDate(row.fecha));
    });
  }
  async function loadSection(id, source, transform, empty) {
    try {
      const rows = await source();
      if (!layout.classList.contains("eva-layout-activo") || aside.hidden) return;
      replaceList(id, transform(rows), empty);
    } catch {
      if (layout.classList.contains("eva-layout-activo") && !aside.hidden)
        replaceList(id, [], "No se pudo actualizar este bloque. Consulta el enlace institucional.");
    }
  }

  // El arranque es explícito y está bloqueado mientras la fase 4 permanezca
  // desactivada. No se hacen solicitudes adicionales en la portada actual.
  function iniciar() {
    if (started || !layout.classList.contains("eva-layout-activo") || aside.hidden) return;
    started = true;
    loadSection("eva-lateral-recursos", () => request("repositorio_recursos", {
      select: "id,titulo,created_at",
      visible: "eq.true", estado_publicacion: "eq.publicado",
      order: "created_at.desc,id.desc", limit: "3"
    }), resources, "No hay recursos publicados disponibles.");
    loadSection("eva-lateral-noticias", () => request("noticias_destacadas", {
      select: "id,titulo,enlace_url,created_at",
      visible: "eq.true", estado_publicacion: "eq.publicado",
      order: "created_at.desc,id.desc", limit: "3"
    }), news, "No hay publicaciones disponibles.");
    loadSection("eva-lateral-agenda", () => request("calendario_publico", {
      select: "registro_id,fecha,contenido_lineas,orden",
      fecha: "gte." + dateTodayInPeru(),
      order: "fecha.asc,orden.asc",
      limit: "3"
    }), upcoming, "No hay próximas actividades anunciadas.");
  }

  // Fase 6 llamará a este método cuando active el diseño y retire hidden.
  window.EvaColumnaLateral = Object.freeze({ iniciar });
  iniciar();
})();
