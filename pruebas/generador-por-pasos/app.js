(() => {
  "use strict";

  const formulario = document.querySelector("#formulario-generador");
  const paneles = [...document.querySelectorAll(".paso-panel")];
  const indicadores = [...document.querySelectorAll(".pasos li")];
  const progreso = document.querySelector("#progreso");
  const progresoTexto = document.querySelector("#progreso-texto");
  const anterior = document.querySelector("#anterior");
  const siguiente = document.querySelector("#siguiente");
  const finalizar = document.querySelector("#finalizar");
  const estado = document.querySelector("#estado-formulario");
  const vista = document.querySelector("#vista-previa");
  let pasoActual = 1;

  const anunciar = (mensaje) => {
    estado.textContent = "";
    window.setTimeout(() => {
      estado.textContent = mensaje;
    }, 30);
  };

  const datos = () => ({
    tipo: formulario.elements.tipo.value || "Material educativo",
    titulo: formulario.elements.titulo.value.trim() || "Sin título",
    descripcion: formulario.elements.descripcion.value.trim() || "Sin descripción.",
    alternativo: formulario.elements.alternativo.value.trim(),
    tamano: formulario.elements.tamano.value,
    alineacion: formulario.elements.alineacion.value,
    borde: formulario.elements.borde.checked
  });

  const actualizarVista = () => {
    const contenido = datos();
    vista.className = "vista-previa";
    if (contenido.tamano !== "normal") vista.classList.add(contenido.tamano);
    if (contenido.alineacion === "centro") vista.classList.add("centro");
    if (contenido.borde) vista.classList.add("destacada");

    vista.innerHTML = `
      <p class="vista-tipo">${contenido.tipo}</p>
      <h3>${contenido.titulo}</h3>
      <p>${contenido.descripcion}</p>
      ${contenido.alternativo ? `<p class="vista-alternativo"><strong>Descripción accesible:</strong> ${contenido.alternativo}</p>` : ""}
    `;
  };

  const validarPaso = () => {
    const panel = paneles[pasoActual - 1];
    const campos = [...panel.querySelectorAll("input, textarea, select")];

    for (const campo of campos) {
      if (!campo.checkValidity()) {
        campo.reportValidity();
        anunciar("Complete los campos obligatorios antes de continuar.");
        return false;
      }
    }
    return true;
  };

  const mostrarPaso = (numero) => {
    pasoActual = numero;
    paneles.forEach((panel, indice) => {
      panel.hidden = indice !== pasoActual - 1;
    });

    indicadores.forEach((indicador, indice) => {
      const activo = indice === pasoActual - 1;
      indicador.classList.toggle("activo", activo);
      if (activo) indicador.setAttribute("aria-current", "step");
      else indicador.removeAttribute("aria-current");
    });

    progreso.value = pasoActual;
    progreso.textContent = `${pasoActual} de 4`;
    progresoTexto.textContent = `Paso ${pasoActual} de 4`;
    anterior.hidden = pasoActual === 1;
    siguiente.hidden = pasoActual === 4;
    finalizar.hidden = pasoActual !== 4;

    if (pasoActual === 4) actualizarVista();

    const leyenda = paneles[pasoActual - 1].querySelector("legend");
    leyenda?.focus?.();
    paneles[pasoActual - 1].setAttribute("tabindex", "-1");
    paneles[pasoActual - 1].focus();
    anunciar(`Paso ${pasoActual} de 4 listo.`);
  };

  siguiente.addEventListener("click", () => {
    if (!validarPaso()) return;
    if (pasoActual < 4) mostrarPaso(pasoActual + 1);
  });

  anterior.addEventListener("click", () => {
    if (pasoActual > 1) mostrarPaso(pasoActual - 1);
  });

  formulario.addEventListener("input", () => {
    if (pasoActual === 4) actualizarVista();
  });

  formulario.addEventListener("submit", (evento) => {
    evento.preventDefault();
    actualizarVista();
    vista.focus();
    anunciar("Prueba finalizada. La tarjeta educativa se generó correctamente en la vista previa.");
  });

  mostrarPaso(1);
})();
