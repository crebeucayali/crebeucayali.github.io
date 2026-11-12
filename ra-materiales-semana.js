(() => {
  "use strict";
  const root = document.getElementById("ra-semana-eva");
  if (!root) return;
  const viewport = document.getElementById("ra-semana-visor");
  const heading = document.getElementById("ra-semana-titulo");
  const api = "https://dteimbhwtzghhsijeeld.supabase.co/rest/v1/ra_materiales_semana_publicos";
  const key = "sb_publishable_tHbo1jTeW_dC90hdA5DvyQ_a6LrfKpq";
  const catalogue = "https://crebeucayali.github.io/banco-digital-accesible/repositorio-accesible/";

  function imageURL(value) {
    const path = String(value || "").trim();
    if (/^assets\/[a-z0-9._/-]+\.(?:jpe?g|png|webp)$/i.test(path)) {
      return catalogue + path;
    }
    try {
      const url = new URL(path);
      if (url.protocol !== "https:" || url.username || url.password || url.search || url.hash) return null;
      const fromRA = url.hostname === "crebeucayali.github.io"
        && /^\/(?:repositorio-accesible|banco-digital-accesible\/repositorio-accesible)\/assets\/[a-z0-9._/-]+\.(?:jpe?g|png|webp)$/i.test(url.pathname);
      const fromStorage = url.hostname === "dteimbhwtzghhsijeeld.supabase.co"
        && /^\/storage\/v1\/object\/public\/eva-publico\/repositorio\/[a-z0-9._/-]+\.(?:jpe?g|png|webp)$/i.test(url.pathname);
      if (fromRA) return catalogue + url.pathname.replace(/^\/(?:repositorio-accesible|banco-digital-accesible\/repositorio-accesible)\//, "");
      return fromStorage ? url.href : null;
    } catch { return null; }
  }
  const categoryRoutes = Object.freeze({
    equipos_tecnologicos: "equipos-tecnologicos/",
    materiales_elaborados: "materiales-elaborados/",
    materiales_disponibles: "materiales-disponibles/"
  });

  async function materialLinks(row) {
    const ids = [1, 2, 3].map(number => Number(row["material_" + number + "_id"]));
    if (ids.some(id => !Number.isSafeInteger(id) || id <= 0)) return new Map();
    try {
      const url = new URL("https://dteimbhwtzghhsijeeld.supabase.co/rest/v1/repositorio_recursos");
      url.searchParams.set("select", "id,categoria,visible,estado_publicacion");
      url.searchParams.set("id", "in.(" + ids.join(",") + ")");
      url.searchParams.set("visible", "eq.true");
      url.searchParams.set("estado_publicacion", "eq.publicado");
      const response = await fetch(url.href, {
        headers: { apikey: key, Accept: "application/json" },
        credentials: "omit", cache: "no-store"
      });
      if (!response.ok) throw new Error("Catálogo de RA no disponible");
      const rows = await response.json();
      if (!Array.isArray(rows)) throw new Error("Datos de RA inesperados");
      return new Map(rows.filter(entry => ids.includes(Number(entry.id)) && categoryRoutes[entry.categoria])
        .map(entry => [Number(entry.id), catalogue + categoryRoutes[entry.categoria] + "#recurso-" + Number(entry.id)]));
    } catch {
      // En caso de fallo de consulta, el acceso general continúa disponible.
      return new Map();
    }
  }

  function card(name, image, alt, number, link) {
    const source = imageURL(image);
    if (!name || !alt || !source) return null;
    const item = document.createElement("article");
    item.className = "ra-semana-slide ra-semana-tarjeta ra-semana-tarjeta-resumida";
    item.setAttribute("aria-labelledby", "ra-semana-material-" + number);
    const imagebox = document.createElement("div");
    imagebox.className = "ra-semana-foto";
    const img = document.createElement("img");
    img.src = source;
    img.alt = alt;
    img.loading = number === 1 ? "eager" : "lazy";
    img.decoding = "async";
    img.addEventListener("error", () => {
      img.replaceWith(Object.assign(document.createElement("p"), {
        className: "ra-semana-foto-error",
        textContent: "Fotografía temporalmente no disponible"
      }));
    }, { once: true });
    const overlay = document.createElement("div");
    overlay.className = "ra-semana-overlay";
    const label = document.createElement("span");
    label.className = "ra-semana-indice";
    label.textContent = "RECURSO " + number + " DE 3";
    const title = document.createElement("h3");
    title.id = "ra-semana-material-" + number;
    title.textContent = name;
    overlay.append(label, title);
    imagebox.append(img, overlay);
    const detail = document.createElement("div");
    detail.className = "ra-semana-detalle";
    const a = document.createElement("a");
    a.className = "ra-semana-boton";
    a.href = link || catalogue;
    a.textContent = link ? "Ver material" : "Explorar repositorio";
    a.setAttribute("aria-label", (link ? "Ver ficha del material: " : "Explorar el repositorio para consultar: ") + name);
    detail.append(a);
    item.append(imagebox, detail);
    return item;
  }

  async function initialize(row) {
    const links = await materialLinks(row);
    const items = [];
    for (let number = 1; number <= 3; number++) {
      const item = card(
        String(row["titulo_" + number] || "").trim(),
        row["imagen_" + number],
        String(row["alt_" + number] || "").trim(),
        number,
        links.get(Number(row["material_" + number + "_id"]))
      );
      if (!item) return;
      items.push(item);
    }
    heading.textContent = row.etiqueta === "semana"
      ? "Materiales de la semana"
      : "Materiales destacados";
    viewport.replaceChildren(...items);
    root.hidden = false;
  }

  async function load() {
    try {
      const url = new URL(api);
      url.searchParams.set("select", "programacion_id,etiqueta,material_1_id,titulo_1,imagen_1,alt_1,material_2_id,titulo_2,imagen_2,alt_2,material_3_id,titulo_3,imagen_3,alt_3");
      url.searchParams.set("limit", "1");
      const response = await fetch(url.href, {
        method: "GET", headers: {apikey: key, Accept: "application/json"},
        credentials: "omit", cache: "no-store"
      });
      if (!response.ok) throw new Error("No se pudieron consultar los materiales.");
      const data = await response.json();
      if (!Array.isArray(data)) throw new Error("Respuesta pública inesperada.");
      if (data.length) await initialize(data[0]);
    } catch {
      root.hidden = true;
      viewport.replaceChildren();
    }
  }
  load();
})();
