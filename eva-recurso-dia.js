(() => {
  "use strict";
  const todayBox = document.getElementById("eva-recurso-hoy");
  const yesterdayBox = document.getElementById("eva-recurso-ayer");
  const todayBody = document.getElementById("eva-recurso-hoy-contenido");
  const yesterdayBody = document.getElementById("eva-recurso-ayer-contenido");
  if (!todayBox || !yesterdayBox || !todayBody || !yesterdayBody) return;

  const API = "https://dteimbhwtzghhsijeeld.supabase.co/rest/v1/";
  const PUBLIC_KEY = "sb_publishable_tHbo1jTeW_dC90hdA5DvyQ_a6LrfKpq";
  const ARASAAC = "https://arasaac.org/";
  const LICENSE = "https://creativecommons.org/licenses/by-nc-sa/4.0/deed.es";
  const MEA = "https://crebeucayali.github.io/materiales-educativos-accesibles/pictogramas/pictogramas.html";
  const BDA = "https://crebeucayali.github.io/banco-digital-accesible/lsp/";
  const activeQueries = new Map();
  let daySeen = "", generation = 0;

  function peruDay() {
    return new Intl.DateTimeFormat("sv-SE", {
      timeZone: "America/Lima", year: "numeric", month: "2-digit", day: "2-digit"
    }).format(new Date());
  }
  function previousDay(iso) {
    const [y, m, d] = iso.split("-").map(Number);
    return new Date(Date.UTC(y, m - 1, d - 1)).toISOString().slice(0, 10);
  }
  function readableDate(iso) {
    return new Intl.DateTimeFormat("es-PE", {
      timeZone: "America/Lima", year: "numeric", month: "long", day: "numeric"
    }).format(new Date(iso + "T12:00:00Z"));
  }
  function elem(name, className, content) {
    const el = document.createElement(name);
    if (className) el.className = className;
    if (content !== undefined) el.textContent = content;
    return el;
  }
  function safeArasaac(row) {
    if (!row || row.tipo !== "arasaac" || !Array.isArray(row.arasaac_ids) ||
        row.arasaac_ids.length < 1 || row.arasaac_ids.length > 3 ||
        row.licencia !== "CC BY-NC-SA 4.0") return false;
    try {
      const src = new URL(row.fuente_url);
      if (src.protocol !== "https:" || !["arasaac.org", "www.arasaac.org"].includes(src.hostname) ||
          src.username || src.password) return false;
    } catch { return false; }
    return row.arasaac_ids.every(id => Number.isSafeInteger(Number(id)) &&
      /^[1-9][0-9]*$/.test(String(id))) &&
      typeof row.titulo === "string" && row.titulo.trim().length > 0 &&
      typeof row.descripcion === "string" && row.descripcion.trim().length > 0 &&
      typeof row.texto_alternativo === "string" && row.texto_alternativo.trim().length > 0 &&
      typeof row.atribucion === "string" &&
      ["Sergio Palao", "ARASAAC", "Gobierno de Aragón"].every(part => row.atribucion.includes(part));
  }
  function empty(box, body) {
    body.replaceChildren();
    box.hidden = true;
  }
  function image(id, title, index) {
    const img = elem("img");
    img.src = "https://static.arasaac.org/pictograms/" + id + "/" + id + "_500.png";
    img.alt = title + ", pictograma " + (index + 1);
    img.loading = "lazy";
    img.decoding = "async";
    img.addEventListener("error", () => {
      img.replaceWith(elem("span", "eva-recurso-dia-imagen-error",
        "Imagen del pictograma temporalmente no disponible"));
    }, { once: true });
    return img;
  }
  function link(text, address) {
    const a = elem("a", "", text);
    a.href = address;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    return a;
  }
  function paint(box, body, record, expected, compact) {
    if (!safeArasaac(record) || record.fecha !== expected) {
      empty(box, body);
      return;
    }
    const gallery = elem("div", "eva-recurso-dia-fotos");
    gallery.style.setProperty("--eva-picto-count", String(record.arasaac_ids.length));
    for (let i = 0; i < record.arasaac_ids.length; i++)
      gallery.appendChild(image(record.arasaac_ids[i], record.titulo, i));
    const detail = elem("div", "eva-recurso-dia-detalles");
    const date = elem("p", "eva-recurso-dia-etiqueta", readableDate(record.fecha));
    const heading = elem(compact ? "h4" : "h3", "eva-recurso-dia-nombre", record.titulo);
    const desc = elem("p", "eva-recurso-dia-descripcion", record.descripcion);
    const credit = elem("p", "eva-recurso-dia-creditos", record.atribucion);
    const links = elem("div", "eva-recurso-dia-enlaces");
    links.append(link("Consultar en MEA", MEA), link("Fuente ARASAAC", ARASAAC),
      link("Licencia CC BY-NC-SA", LICENSE));
    detail.append(date, heading, desc, credit, links);
    body.replaceChildren(gallery, detail);
    box.hidden = false;
  }
  async function query(view, signal) {
    const url = new URL(view, API);
    url.searchParams.set("select",
      "fecha,tipo,arasaac_ids,titulo,descripcion,texto_alternativo,fuente_url,atribucion,licencia");
    url.searchParams.set("limit", "1");
    const response = await fetch(url.href, {
      method: "GET",
      headers: { "apikey": PUBLIC_KEY, "Accept": "application/json" },
      credentials: "omit",
      cache: "no-store",
      signal
    });
    if (!response.ok) throw new Error("No se pudo consultar el recurso diario.");
    const result = await response.json();
    if (!Array.isArray(result)) throw new Error("Respuesta del recurso diario no válida.");
    return result[0] || null;
  }
  function cancelQueries() {
    for (const controller of activeQueries.values()) controller.abort();
    activeQueries.clear();
  }
  async function refresh(force = false) {
    const today = peruDay();
    if (!force && today === daySeen) return;
    daySeen = today;
    const requestId = ++generation;
    cancelQueries();
    // Ocultar la fecha anterior al instante, para evitar contenido desfasado.
    empty(todayBox, todayBody);
    empty(yesterdayBox, yesterdayBody);
    const sources = [
      { view: "eva_recurso_dia_publico", box: todayBox, body: todayBody, date: today, compact: false },
      { view: "eva_recurso_ayer_publico", box: yesterdayBox, body: yesterdayBody,
        date: previousDay(today), compact: true }
    ];
    await Promise.all(sources.map(async item => {
      const controller = new AbortController();
      activeQueries.set(item.view, controller);
      try {
        const record = await query(item.view, controller.signal);
        if (generation !== requestId || today !== peruDay()) return;
        paint(item.box, item.body, record, item.date, item.compact);
      } catch {
        if (generation === requestId) empty(item.box, item.body);
      } finally {
        if (activeQueries.get(item.view) === controller) activeQueries.delete(item.view);
      }
    }));
    // Si se produjo el cambio de fecha mientras llegaban las respuestas, recalcular.
    if (generation === requestId && today !== peruDay()) refresh(true);
  }
  refresh();
  // Solo consulta de nuevo si cambió la fecha; sin consultas periódicas a Supabase.
  setInterval(() => { if (peruDay() !== daySeen) refresh(); }, 60000);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && peruDay() !== daySeen) refresh();
  });
  window.EvaRecursoDiaPublico = Object.freeze({ actualizar: () => refresh(true) });
})();