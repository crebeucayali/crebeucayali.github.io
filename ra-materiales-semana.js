(() => {
  "use strict";
  const root = document.getElementById("ra-semana-eva");
  if (!root) return;
  const viewport = document.getElementById("ra-semana-visor");
  const heading = document.getElementById("ra-semana-titulo");
  const api = "https://dteimbhwtzghhsijeeld.supabase.co/rest/v1/ra_materiales_semana_publicos";
  const key = "sb_publishable_tHbo1jTeW_dC90hdA5DvyQ_a6LrfKpq";
  const catalogue = "https://crebeucayali.github.io/repositorio-accesible/";

  function imageURL(value) {
    const path = String(value || "").trim();
    if (/^assets\/[a-z0-9._/-]+\.(?:jpe?g|png|webp)$/i.test(path)) {
      return catalogue + path;
    }
    try {
      const url = new URL(path);
      if (url.protocol !== "https:" || url.username || url.password || url.search || url.hash) return null;
      const fromRA = url.hostname === "crebeucayali.github.io"
        && /^\/repositorio-accesible\/assets\/[a-z0-9._/-]+\.(?:jpe?g|png|webp)$/i.test(url.pathname);
      const fromStorage = url.hostname === "dteimbhwtzghhsijeeld.supabase.co"
        && /^\/storage\/v1\/object\/public\/eva-publico\/repositorio\/[a-z0-9._/-]+\.(?:jpe?g|png|webp)$/i.test(url.pathname);
      return fromRA || fromStorage ? url.href : null;
    } catch { return null; }
  }
  function card(name, description, image, alt, number) {
    const source = imageURL(image);
    if (!name || !description || !alt || !source) return null;
    const item = document.createElement("article");
    item.className = "ra-semana-slide ra-semana-tarjeta";
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
    const p = document.createElement("p");
    p.textContent = description;
    detail.append(p);
    item.append(imagebox, detail);
    return item;
  }

  function initialize(row) {
    const items = [];
    for (let number = 1; number <= 3; number++) {
      const item = card(
        String(row["titulo_" + number] || "").trim(),
        String(row["descripcion_" + number] || "").trim(),
        row["imagen_" + number],
        String(row["alt_" + number] || "").trim(),
        number
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
      url.searchParams.set("select", "programacion_id,etiqueta,titulo_1,descripcion_1,imagen_1,alt_1,titulo_2,descripcion_2,imagen_2,alt_2,titulo_3,descripcion_3,imagen_3,alt_3");
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
