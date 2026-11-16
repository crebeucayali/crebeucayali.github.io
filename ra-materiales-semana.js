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

  // La vista pública semanal ya incluye las categorías verificadas por RLS.
  // Evita una segunda consulta y nunca reemplaza una ficha por la portada de RA.
  function materialLinks(row) {
    const links = new Map();
    for (let number = 1; number <= 3; number++) {
      const id = Number(row["material_" + number + "_id"]);
      const categoria = row["categoria_" + number];
      if (Number.isSafeInteger(id) && id > 0 &&
          Object.prototype.hasOwnProperty.call(categoryRoutes, categoria)) {
        links.set(id, catalogue + categoryRoutes[categoria] + "#recurso-" + id);
      }
    }
    return links;
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

    const sign = document.createElement("span");
    sign.className = "ra-semana-signo";
    sign.setAttribute("aria-hidden", "true");
    img.addEventListener("error", () => sign.remove(), { once: true });
    imagebox.append(img, sign);

    const detail = document.createElement("div");
    detail.className = "ra-semana-detalle";
    const content = document.createElement("div");
    content.className = "ra-semana-contenido";
    content.appendChild(overlay);
    if (link) {
      const a = document.createElement("a");
      a.className = "ra-semana-boton";
      a.href = link;
      a.textContent = "Ver material";
      a.setAttribute("aria-label", "Ver ficha del material: " + name);
      content.appendChild(a);
    }
    detail.append(content);
    item.append(imagebox, detail);
    return item;
  }

  function initialize(row) {
    const links = materialLinks(row);
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
      url.searchParams.set("select", "programacion_id,etiqueta,material_1_id,titulo_1,imagen_1,alt_1,material_2_id,titulo_2,imagen_2,alt_2,material_3_id,titulo_3,imagen_3,alt_3,categoria_1,categoria_2,categoria_3");
      url.searchParams.set("limit", "1");
      const response = await fetch(url.href, {
        method: "GET", headers: {apikey: key, Accept: "application/json"},
        credentials: "omit", cache: "no-store"
      });
      if (!response.ok) throw new Error("No se pudieron consultar los materiales.");
      const data = await response.json();
      if (!Array.isArray(data)) throw new Error("Respuesta pública inesperada.");
      if (data.length) initialize(data[0]);
    } catch {
      root.hidden = true;
      viewport.replaceChildren();
    }
  }
  load();
})();
