(() => {
  "use strict";
  const lateral = document.getElementById("eva-lecturas-lista");
  const destacado = document.getElementById("eva-lectura-contenido");
  const panel = document.getElementById("eva-lecturas-destacada");
  if (!lateral || !destacado || !panel) return;
  const origen = "https://crebeucayali.github.io/accesos-complementarios/lecturas-inclusivas/";
  const max = 3;
  const normalizar = texto => String(texto || "").replace(/\s+/g, " ").trim();
  const contenido = (tag, clase, texto) => {
    const el = document.createElement(tag);
    if (clase) el.className = clase;
    el.textContent = texto;
    return el;
  };
  const lista = [];
  let seleccionado = 0;
  function mostrar(numero) {
    const nota = lista[numero];
    if (!nota) return;
    seleccionado = numero;
    destacado.replaceChildren();
    destacado.append(
      contenido("p", "eva-lectura-categoria", nota.categoria),
      contenido("h3", "", nota.titulo),
      contenido("p", "eva-lectura-fecha", nota.fecha),
      contenido("p", "eva-lectura-resumen", nota.resumen)
    );
    const enlace = contenido("a", "eva-lectura-enlace", "Leer artículo completo");
    enlace.href = nota.url;
    destacado.appendChild(enlace);
    lateral.querySelectorAll("button").forEach((boton, idx) =>
      boton.setAttribute("aria-pressed", String(idx === seleccionado)));
  }
  function presentar() {
    lateral.replaceChildren();
    lista.forEach((nota, index) => {
      const li = document.createElement("li");
      const boton = contenido("button", "", nota.titulo);
      boton.type = "button";
      boton.setAttribute("aria-controls", "eva-lectura-contenido");
      boton.setAttribute("aria-pressed", String(index === 0));
      boton.appendChild(contenido("small", "", nota.fecha));
      boton.addEventListener("click", () => {
        mostrar(index);
        if (matchMedia("(max-width: 1050px)").matches)
          panel.scrollIntoView({ behavior: "auto", block: "start" });
      });
      li.appendChild(boton);
      lateral.appendChild(li);
    });
    mostrar(0);
    panel.hidden = false;
  }
  async function iniciar() {
    try {
      const respuesta = await fetch(origen, { credentials: "omit", cache: "no-store" });
      if (!respuesta.ok) throw Error("Lecturas no disponibles");
      const html = new DOMParser().parseFromString(await respuesta.text(), "text/html");
      for (const articulo of html.querySelectorAll(".lista-articulos .tarjeta-horizontal")) {
        const enlace = articulo.querySelector("a[href]");
        if (!enlace) continue;
        const url = new URL(enlace.getAttribute("href"), origen);
        if (url.origin !== location.origin || !url.pathname.startsWith("/accesos-complementarios/lecturas-inclusivas/articulos/")) continue;
        const titulo = normalizar(articulo.querySelector("h3")?.textContent);
        const resumen = normalizar(articulo.querySelector(".tarjeta-contenido > p:not(.tarjeta-etiqueta):not(.tarjeta-meta)")?.textContent);
        const categoria = normalizar(articulo.querySelector(".tarjeta-etiqueta")?.textContent) || "Lectura inclusiva";
        const fecha = normalizar(articulo.querySelector(".tarjeta-meta span:last-child")?.textContent);
        if (!titulo || !resumen || !fecha || !/\d{4}/.test(fecha)) continue;
        lista.push({ titulo, resumen, categoria, fecha, url: url.href });
        if (lista.length === max) break;
      }
      if (!lista.length) throw Error("Sin artículos");
      presentar();
    } catch {
      lateral.replaceChildren();
      lateral.appendChild(contenido("li", "", "Consulta las lecturas disponibles en AC."));
      panel.hidden = true;
    }
  }
  iniciar();
})();
