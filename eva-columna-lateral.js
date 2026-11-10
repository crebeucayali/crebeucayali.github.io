(() => {
  "use strict";
  const layout = document.getElementById("eva-distribucion");
  const aside = document.getElementById("eva-columna-lateral");
  if (!layout || !aside) return;
  const ENDPOINT = "https://dteimbhwtzghhsijeeld.supabase.co/rest/v1/";
  const PUBLIC_KEY = "sb_publishable_tHbo1jTeW_dC90hdA5DvyQ_a6LrfKpq";
  const ROOT = "https://crebeucayali.github.io/";
  const REPOSITORY = ROOT + "repositorio-accesible/";
  const NEWS = ROOT + "noti-inclusivos/";
  const CALENDAR = ROOT + "accesos-complementarios/recursos/calendario.html";
  const PAGE_SIZE = 5;
  const INITIAL_SIZE = 3;
  const sections = [
    { id: "eva-lateral-digitales", table: null, empty: "No hay recursos educativos publicados." },
    { id: "eva-lateral-noticias", table: "noticias_destacadas", empty: "No hay novedades publicadas." },
    { id: "eva-lateral-recursos", table: "repositorio_recursos", empty: "No hay materiales publicados." },
    { id: "eva-lateral-agenda", table: "calendario_publico", empty: "No hay actividades programadas." }
  ];
  let started = false;
  const state = new Map();

  function clean(value, limit = 130) {
    return String(value || "").replace(/\s+/g, " ").trim().slice(0, limit);
  }
  function safeLink(value, fallback) {
    try {
      const url = new URL(String(value || ""));
      if (url.protocol !== "https:" || url.hostname !== "crebeucayali.github.io" || url.username || url.password) return fallback;
      return url.href;
    } catch { return fallback; }
  }
  function dateTodayInPeru() {
    return new Intl.DateTimeFormat("sv-SE", {
      timeZone: "America/Lima", year: "numeric", month: "2-digit", day: "2-digit"
    }).format(new Date());
  }
  function readableDate(iso) {
    const value = String(iso || "");
    if (!/^\d{4}-\d{2}-\d{2}(?:[T ]|$)/.test(value)) return "";
    const d = new Date(value.length === 10 ? value + "T12:00:00Z" : value.replace(" ", "T"));
    if (!Number.isFinite(d.getTime())) return "";
    return new Intl.DateTimeFormat("es-PE", { day: "numeric", month: "short", year: "numeric", timeZone: "America/Lima" }).format(d);
  }
  function line(label, url, meta) {
    const li = document.createElement("li");
    const a = document.createElement("a");
    a.textContent = clean(label, 100);
    a.href = url;
    li.appendChild(a);
    if (meta) {
      const small = document.createElement("small");
      small.textContent = clean(meta, 160);
      li.appendChild(small);
    }
    return li;
  }
  function configure(section) {
    const element = document.getElementById(section.id);
    if (!element) return;
    const block = element.closest(".eva-lateral-bloque");
    const controls = document.createElement("div");
    controls.className = "eva-lateral-controles";
    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "eva-lateral-toggle";
    toggle.textContent = "Ver más";
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-controls", section.id);
    const nav = document.createElement("nav");
    nav.className = "eva-lateral-paginas";
    nav.setAttribute("aria-label", "Páginas de " + (block?.querySelector("h3")?.textContent || "publicaciones"));
    nav.hidden = true;
    controls.append(toggle, nav);
    element.insertAdjacentElement("afterend", controls);
    element.setAttribute("aria-live", "polite");
    const item = { ...section, element, block, toggle, nav, expanded: false, page: 1, total: 0, loading: false, cache: null, requestId: 0 };
    state.set(section.id, item);
    toggle.addEventListener("click", () => {
      if (item.loading) return;
      item.expanded = !item.expanded;
      item.page = 1;
      item.toggle.setAttribute("aria-expanded", String(item.expanded));
      item.toggle.textContent = item.expanded ? "Mostrar menos" : "Ver más";
      render(item);
    });
  }
  async function query(table, params) {
    const url = new URL(table, ENDPOINT);
    for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
    const response = await fetch(url.href, {
      method: "GET",
      headers: { apikey: PUBLIC_KEY, Accept: "application/json", Prefer: "count=exact" },
      credentials: "omit", cache: "no-store", signal: AbortSignal.timeout(12000)
    });
    if (!response.ok) throw new Error("No se pudo consultar contenido público de EVA");
    const rows = await response.json();
    if (!Array.isArray(rows)) throw new Error("Formato de respuesta inesperado");
    const match = /\/(\d+|\*)$/.exec(response.headers.get("content-range") || "");
    return { rows, total: match && match[1] !== "*" ? Number(match[1]) : null };
  }
  async function fetchRows(item, amount, offset) {
    if (item.table === null) {
      if (!item.cache) {
        const response = await fetch(ROOT + "recursos-educativos.json", {
          credentials: "omit", cache: "no-store", signal: AbortSignal.timeout(12000)
        });
        if (!response.ok) throw new Error("Catálogo educativo no disponible");
        const json = await response.json();
        if (!Array.isArray(json.recursos)) throw new Error("Catálogo JSON incorrecto");
        item.cache = json.recursos.filter(row => row && row.visible === true && clean(row.titulo) && row.url)
          .sort((a, b) => String(b.fecha_publicacion || "").localeCompare(String(a.fecha_publicacion || "")));
      }
      return { rows: item.cache.slice(offset, offset + amount), total: item.cache.length };
    }
    const params = { limit: String(amount), offset: String(offset) };
    if (item.table === "calendario_publico") {
      Object.assign(params, {
        select: "registro_id,fecha,contenido_lineas,orden",
        fecha: "gte." + dateTodayInPeru(),
        order: "fecha.asc,orden.asc"
      });
    } else {
      Object.assign(params, {
        select: item.table === "repositorio_recursos" ? "id,titulo,created_at" : "id,titulo,enlace_url,created_at",
        visible: "eq.true", estado_publicacion: "eq.publicado",
        order: "created_at.desc,id.desc"
      });
    }
    return query(item.table, params);
  }
  function makeItem(row, table) {
    if (table === null) return line(row.titulo, safeLink(row.url, ROOT), clean(row.modulo || "Recurso educativo") +
      (readableDate(row.fecha_publicacion) ? " · Publicado: " + readableDate(row.fecha_publicacion) : ""));
    if (table === "repositorio_recursos") return line(row.titulo, REPOSITORY,
      readableDate(row.created_at) ? "Registrado: " + readableDate(row.created_at) : "");
    if (table === "noticias_destacadas") return line(row.titulo, safeLink(row.enlace_url, NEWS),
      readableDate(row.created_at) ? "Registrado: " + readableDate(row.created_at) : "");
    const lines = Array.isArray(row.contenido_lineas) ? row.contenido_lineas : [];
    return line(lines.map(x => clean(x, 140)).filter(Boolean).at(-1) || "Actividad del calendario CREBE",
      CALENDAR, readableDate(row.fecha));
  }
  function pageButton(text, page, disabled, current, item) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = text;
    button.disabled = disabled;
    if (current) button.setAttribute("aria-current", "page");
    button.setAttribute("aria-label", current ? "Página " + page + ", actual" : "Ir a la página " + page);
    button.addEventListener("click", () => { item.page = page; render(item, true); });
    return button;
  }
  function navigation(item) {
    item.nav.replaceChildren();
    if (!item.expanded || item.total <= PAGE_SIZE) { item.nav.hidden = true; return; }
    item.nav.hidden = false;
    const pages = Math.ceil(item.total / PAGE_SIZE);
    item.nav.append(pageButton("‹", Math.max(1, item.page - 1), item.page === 1, false, item));
    const start = Math.max(1, Math.min(item.page - 1, pages - 2));
    const end = Math.min(pages, start + 2);
    for (let n = start; n <= end; n++) item.nav.append(pageButton(String(n), n, false, n === item.page, item));
    item.nav.append(pageButton("›", Math.min(pages, item.page + 1), item.page === pages, false, item));
    const summary = document.createElement("small");
    summary.textContent = "Página " + item.page + " de " + pages;
    item.nav.append(summary);
  }
  async function render(item, focusList = false) {
    const id = ++item.requestId;
    const amount = item.expanded ? PAGE_SIZE : INITIAL_SIZE;
    const offset = item.expanded ? (item.page - 1) * PAGE_SIZE : 0;
    item.loading = true;
    item.toggle.disabled = true;
    item.element.setAttribute("aria-busy", "true");
    try {
      const result = await fetchRows(item, amount, offset);
      if (id !== item.requestId) return;
      const nodes = result.rows.map(row => makeItem(row, item.table));
      if (!nodes.length) {
        const li = document.createElement("li");
        li.textContent = item.empty;
        nodes.push(li);
      }
      item.element.replaceChildren(...nodes);
      item.total = result.total === null ? Math.max(offset + result.rows.length, offset + amount + (result.rows.length === amount ? 1 : 0)) : result.total;
      item.toggle.hidden = item.total <= INITIAL_SIZE;
      navigation(item);
      if (focusList) {
        item.element.setAttribute("tabindex", "-1");
        item.element.focus({ preventScroll: true });
      }
    } catch {
      if (id === item.requestId) {
        const li = document.createElement("li");
        li.textContent = "No se pudo actualizar este bloque. Consulta el enlace institucional.";
        item.element.replaceChildren(li);
        item.nav.hidden = true;
      }
    } finally {
      if (id === item.requestId) {
        item.loading = false;
        item.toggle.disabled = false;
        item.element.removeAttribute("aria-busy");
      }
    }
  }
  function iniciar() {
    if (started || !layout.classList.contains("eva-layout-activo") || aside.hidden) return;
    started = true;
    sections.forEach(configure);
    state.forEach(item => render(item));
  }
  window.EvaColumnaLateral = Object.freeze({ iniciar });
  iniciar();
})();
