(() => {
  "use strict";
  const root = document.getElementById("ra-semana-eva");
  if (!root) return;
  const viewport = document.getElementById("ra-semana-visor");
  const counter = document.getElementById("ra-semana-contador");
  const heading = document.getElementById("ra-semana-titulo");
  const previous = document.getElementById("ra-semana-anterior");
  const next = document.getElementById("ra-semana-siguiente");
  const toggle = document.getElementById("ra-semana-pausa");
  const pagination = document.getElementById("ra-semana-puntos");
  const api = "https://dteimbhwtzghhsijeeld.supabase.co/rest/v1/ra_materiales_semana_publicos";
  const key = "sb_publishable_tHbo1jTeW_dC90hdA5DvyQ_a6LrfKpq";
  const contact = "https://crebeucayali.github.io/accesos-complementarios/paginas/contacto.html";
  const catalogue = "https://crebeucayali.github.io/repositorio-accesible/";
  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  const INTERVAL = 8000;
  let slides = [], buttons = [], current = 0, clock = null, playing = !media.matches, hover = false, focused = false;
  let visible = true;

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
  function anchor(text, url, className) {
    const a = document.createElement("a");
    a.href = url;
    a.className = className;
    a.textContent = text;
    return a;
  }
  function card(name, description, image, alt, number) {
    if (!name || !description || !alt || !imageURL(image)) return null;
    const item = document.createElement("article");
    item.className = "ra-semana-slide";
    item.setAttribute("aria-label", "Material " + number + " de 3: " + name);
    const imagebox = document.createElement("div");
    imagebox.className = "ra-semana-foto";
    const img = document.createElement("img");
    img.src = imageURL(image);
    img.alt = alt;
    img.loading = number === 1 ? "eager" : "lazy";
    img.decoding = "async";
    img.addEventListener("error", () => {
      img.replaceWith(Object.assign(document.createElement("p"), {
        className: "ra-semana-foto-error", textContent: "Fotografía temporalmente no disponible"
      }));
    }, { once: true });
    imagebox.append(img);
    const detail = document.createElement("div");
    detail.className = "ra-semana-detalle";
    const index = document.createElement("span");
    index.className = "ra-semana-indice";
    index.textContent = "RECURSO " + number + " DE 3";
    const title = document.createElement("h3");
    title.textContent = name;
    const p = document.createElement("p");
    p.textContent = description;
    const actions = document.createElement("div");
    actions.className = "ra-semana-enlaces";
    actions.append(anchor("Explorar el repositorio", catalogue, "ra-semana-boton"),
      anchor("Consultar al CREBE", contact, "ra-semana-enlace"));
    detail.append(index, title, p, actions);
    item.append(imagebox, detail);
    return item;
  }
  function stop() {
    if (clock !== null) window.clearInterval(clock);
    clock = null;
  }
  function show(n, announce = false) {
    if (!slides.length) return;
    current = (n + slides.length) % slides.length;
    slides.forEach((slide, i) => {
      slide.hidden = i !== current;
      slide.setAttribute("aria-hidden", String(i !== current));
    });
    buttons.forEach((button, i) => {
      button.setAttribute("aria-current", i === current ? "true" : "false");
      button.setAttribute("aria-label", "Mostrar material " + (i + 1) + " de " + slides.length
        + (i === current ? ", seleccionado" : ""));
    });
    counter.textContent = "Material " + (current + 1) + " de " + slides.length;
    if (announce) {
      const status = document.getElementById("ra-semana-anuncio");
      status.textContent = "Material " + (current + 1) + ": "
        + slides[current].querySelector("h3").textContent;
    }
  }
  function pause() { playing = false; stop(); updateButton(); }
  function updateButton() {
    toggle.textContent = playing ? "Pausar rotación" : "Reanudar rotación";
    toggle.setAttribute("aria-label", playing ? "Pausar carrusel de materiales" : "Reanudar carrusel de materiales");
    toggle.setAttribute("aria-pressed", String(!playing));
  }
  function start() {
    stop();
    if (!playing || hover || (focused && document.activeElement !== toggle) || !visible || slides.length < 2 || document.hidden) return;
    clock = window.setInterval(() => show(current + 1), INTERVAL);
  }
  function manual(n) {
    pause();
    show(n, true);
  }
  function initialize(row) {
    const draft = [];
    for (let n = 1; n <= 3; n++) {
      const item = card(
        String(row["titulo_" + n] || "").trim(),
        String(row["descripcion_" + n] || "").trim(),
        row["imagen_" + n],
        String(row["alt_" + n] || "").trim(),
        n
      );
      if (!item) return;
      draft.push(item);
    }
    slides = draft;
    viewport.replaceChildren(...slides);
    pagination.replaceChildren();
    buttons = slides.map((_, i) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "ra-semana-punto";
      button.addEventListener("click", () => manual(i));
      pagination.append(button);
      return button;
    });
    const weekly = row.etiqueta === "semana";
    heading.textContent = weekly ? "Materiales de la semana" : "Materiales destacados";
    root.hidden = false;
    show(0);
    updateButton();
    start();
  }
  previous.addEventListener("click", () => manual(current - 1));
  next.addEventListener("click", () => manual(current + 1));
  toggle.addEventListener("click", () => {
    playing = !playing;
    updateButton();
    start();
  });
  root.addEventListener("mouseenter", () => { hover = true; stop(); });
  root.addEventListener("mouseleave", () => { hover = false; start(); });
  root.addEventListener("focusin", () => { focused = true; stop(); });
  root.addEventListener("focusout", event => {
    if (!root.contains(event.relatedTarget)) { focused = false; start(); }
  });
  root.addEventListener("keydown", event => {
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      manual(current + (event.key === "ArrowRight" ? 1 : -1));
    }
  });
  document.addEventListener("visibilitychange", start);
  const motionChanged = () => {
    if (media.matches) { pause(); }
    else start();
  };
  if (media.addEventListener) media.addEventListener("change", motionChanged);
  else if (media.addListener) media.addListener(motionChanged);
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(entries => {
      visible = entries[0]?.isIntersecting ?? false;
      start();
    }, {threshold: 0.15});
    observer.observe(root);
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
      stop();
    }
  }
  load();
})();
