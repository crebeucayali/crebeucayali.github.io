(() => {
  "use strict";

  const TARJETAS_KEY = "eva_tarjetas_educativas_v1";
  const SECUENCIAS_KEY = "eva_tarjetas_secuencias_v1";
  const MAX_IMPORT_BYTES = 30 * 1024 * 1024;

  const tipos = {
    pregunta: { nombre: "Pregunta y respuesta", etiqueta: "Respuesta" },
    concepto: { nombre: "Concepto", etiqueta: "Explicación" },
    rutina: { nombre: "Rutina o instrucción", etiqueta: "Instrucción" }
  };

  const plantillas = new Set(["clasica", "visual", "contraste"]);

  const elementos = {
    escuchar: document.querySelector("#escuchar-tarjeta"),
    pausar: document.querySelector("#pausar-lectura"),
    detener: document.querySelector("#detener-lectura"),
    velocidad: document.querySelector("#velocidad-lectura"),
    estadoVoz: document.querySelector("#estado-voz"),
    imprimirActual: document.querySelector("#imprimir-actual"),
    contenidoImpresion: document.querySelector("#contenido-impresion"),
    porHoja: document.querySelector("#tarjetas-por-hoja"),
    imprimirColeccion: document.querySelector("#imprimir-coleccion"),
    estadoImpresion: document.querySelector("#estado-impresion"),
    exportarImagenes: document.querySelector("#exportar-imagenes"),
    exportar: document.querySelector("#exportar-coleccion"),
    archivoImportacion: document.querySelector("#archivo-importacion"),
    modoImportacion: document.querySelector("#modo-importacion"),
    importar: document.querySelector("#importar-coleccion"),
    estadoTransferencia: document.querySelector("#estado-transferencia"),
    zonaImpresion: document.querySelector("#zona-impresion"),
    formularioSecuencia: document.querySelector("#formulario-secuencia"),
    secuenciaId: document.querySelector("#secuencia-id"),
    nombreSecuencia: document.querySelector("#nombre-secuencia"),
    selectorSecuencia: document.querySelector("#selector-tarjetas-secuencia"),
    guardarSecuencia: document.querySelector("#guardar-secuencia"),
    cancelarSecuencia: document.querySelector("#cancelar-secuencia"),
    estadoSecuencia: document.querySelector("#estado-secuencia"),
    listaSecuencias: document.querySelector("#lista-secuencias"),
    visorSecuencia: document.querySelector("#visor-secuencia"),
    tituloVisor: document.querySelector("#titulo-visor-secuencia"),
    progresoSecuencia: document.querySelector("#progreso-secuencia"),
    tarjetaSecuencia: document.querySelector("#tarjeta-secuencia"),
    categoriaSecuencia: document.querySelector("#categoria-secuencia"),
    tipoSecuencia: document.querySelector("#tipo-secuencia"),
    contenedorImagenSecuencia: document.querySelector("#contenedor-imagen-secuencia"),
    imagenSecuencia: document.querySelector("#imagen-secuencia"),
    frenteSecuencia: document.querySelector("#frente-secuencia"),
    reversoSecuencia: document.querySelector("#reverso-secuencia"),
    etiquetaReversoSecuencia: document.querySelector("#etiqueta-reverso-secuencia"),
    textoReversoSecuencia: document.querySelector("#texto-reverso-secuencia"),
    anteriorSecuencia: document.querySelector("#anterior-secuencia"),
    mostrarSecuencia: document.querySelector("#mostrar-secuencia"),
    siguienteSecuencia: document.querySelector("#siguiente-secuencia"),
    cerrarVisor: document.querySelector("#cerrar-visor-secuencia"),
    listaPersonales: document.querySelector("#lista-personales")
  };

  let secuencias = [];
  let secuenciaActiva = null;
  let tarjetasSecuenciaActiva = [];
  let indiceSecuencia = 0;
  let reversoSecuenciaVisible = false;
  let observadorProgramado = false;

  const crearId = (prefijo) => {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return `${prefijo}-${window.crypto.randomUUID()}`;
    }
    return `${prefijo}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  };

  const anunciar = (elemento, mensaje, clase = "") => {
    if (!elemento) return;
    elemento.className = `estado-formulario${clase ? ` ${clase}` : ""}`;
    elemento.textContent = "";
    window.setTimeout(() => {
      elemento.textContent = mensaje;
    }, 30);
  };

  const esTarjetaValida = (tarjeta) => Boolean(
    tarjeta &&
    tipos[tarjeta.tipo] &&
    typeof tarjeta.categoria === "string" &&
    typeof tarjeta.frente === "string" &&
    typeof tarjeta.reverso === "string"
  );

  const normalizarTarjeta = (tarjeta, idForzado = "") => {
    const imagenValida = typeof tarjeta.imagen === "string" && tarjeta.imagen.startsWith("data:image/");
    const alternativo = typeof tarjeta.textoAlternativo === "string" ? tarjeta.textoAlternativo.trim() : "";
    return {
      id: idForzado || (typeof tarjeta.id === "string" && tarjeta.id ? tarjeta.id : crearId("tarjeta")),
      origen: "personal",
      tipo: tipos[tarjeta.tipo] ? tarjeta.tipo : "pregunta",
      categoria: tarjeta.categoria.trim().slice(0, 40),
      plantilla: plantillas.has(tarjeta.plantilla) ? tarjeta.plantilla : "clasica",
      frente: tarjeta.frente.trim().slice(0, 120),
      reverso: tarjeta.reverso.trim().slice(0, 420),
      imagen: imagenValida && alternativo ? tarjeta.imagen : "",
      textoAlternativo: imagenValida && alternativo ? alternativo.slice(0, 160) : "",
      favorita: Boolean(tarjeta.favorita),
      fechaCreacion: typeof tarjeta.fechaCreacion === "string" ? tarjeta.fechaCreacion : new Date().toISOString(),
      fechaActualizacion: new Date().toISOString()
    };
  };

  const leerTarjetas = () => {
    try {
      const datos = JSON.parse(localStorage.getItem(TARJETAS_KEY) || "[]");
      return Array.isArray(datos) ? datos.filter(esTarjetaValida).map((tarjeta) => normalizarTarjeta(tarjeta)) : [];
    } catch (error) {
      return [];
    }
  };

  const guardarTarjetas = (tarjetas) => {
    localStorage.setItem(TARJETAS_KEY, JSON.stringify(tarjetas));
  };

  const esSecuenciaValida = (secuencia) => Boolean(
    secuencia &&
    typeof secuencia.id === "string" &&
    typeof secuencia.nombre === "string" &&
    Array.isArray(secuencia.tarjetaIds)
  );

  const leerSecuencias = () => {
    try {
      const datos = JSON.parse(localStorage.getItem(SECUENCIAS_KEY) || "[]");
      return Array.isArray(datos)
        ? datos.filter(esSecuenciaValida).map((secuencia) => ({
            id: secuencia.id,
            nombre: secuencia.nombre.trim().slice(0, 80),
            tarjetaIds: secuencia.tarjetaIds.filter((id) => typeof id === "string"),
            fechaCreacion: secuencia.fechaCreacion || new Date().toISOString(),
            fechaActualizacion: secuencia.fechaActualizacion || new Date().toISOString()
          }))
        : [];
    } catch (error) {
      return [];
    }
  };

  const guardarSecuencias = () => {
    localStorage.setItem(SECUENCIAS_KEY, JSON.stringify(secuencias));
  };

  const sanitizarSecuencias = () => {
    const ids = new Set(leerTarjetas().map((tarjeta) => tarjeta.id));
    let cambio = false;
    secuencias = secuencias
      .map((secuencia) => {
        const tarjetaIds = secuencia.tarjetaIds.filter((id, indice, lista) => ids.has(id) && lista.indexOf(id) === indice);
        if (tarjetaIds.length !== secuencia.tarjetaIds.length) cambio = true;
        return { ...secuencia, tarjetaIds };
      })
      .filter((secuencia) => {
        if (secuencia.tarjetaIds.length === 0) cambio = true;
        return secuencia.tarjetaIds.length > 0;
      });
    if (cambio) guardarSecuencias();
  };

  const obtenerTarjetaActual = () => {
    const imagen = document.querySelector("#imagen-practica");
    return {
      id: crearId("actual"),
      tipo: "pregunta",
      categoria: document.querySelector("#categoria")?.textContent.trim() || "Tarjeta",
      frente: document.querySelector("#pregunta")?.textContent.trim() || "Contenido",
      reverso: document.querySelector("#texto-respuesta")?.textContent.trim() || "",
      etiqueta: document.querySelector("#etiqueta-respuesta")?.textContent.trim() || "Respuesta",
      imagen: imagen?.getAttribute("src") || "",
      textoAlternativo: imagen?.alt || ""
    };
  };

  const textoTarjetaActual = () => {
    const tarjeta = obtenerTarjetaActual();
    const partes = [
      tarjeta.categoria,
      tarjeta.frente,
      tarjeta.textoAlternativo ? `Descripción de la imagen: ${tarjeta.textoAlternativo}` : "",
      `${tarjeta.etiqueta}: ${tarjeta.reverso}`
    ];
    return partes.filter(Boolean).join(". ");
  };

  const configurarVoz = () => {
    if (!("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) {
      elementos.escuchar.disabled = true;
      elementos.pausar.disabled = true;
      elementos.detener.disabled = true;
      anunciar(elementos.estadoVoz, "La lectura en voz alta no está disponible en este navegador.", "error");
      return;
    }

    elementos.escuchar.addEventListener("click", () => {
      window.speechSynthesis.cancel();
      const texto = textoTarjetaActual();
      if (!texto.trim()) {
        anunciar(elementos.estadoVoz, "No hay contenido disponible para leer.", "error");
        return;
      }
      const lectura = new SpeechSynthesisUtterance(texto);
      lectura.lang = "es-PE";
      lectura.rate = Number(elementos.velocidad.value) || 1;
      lectura.onstart = () => {
        elementos.pausar.disabled = false;
        elementos.detener.disabled = false;
        elementos.pausar.textContent = "Pausar";
        anunciar(elementos.estadoVoz, "Lectura en curso.");
      };
      lectura.onend = () => {
        elementos.pausar.disabled = true;
        elementos.detener.disabled = true;
        elementos.pausar.textContent = "Pausar";
        anunciar(elementos.estadoVoz, "Lectura finalizada.", "exito");
      };
      lectura.onerror = () => {
        elementos.pausar.disabled = true;
        elementos.detener.disabled = true;
        anunciar(elementos.estadoVoz, "No se pudo completar la lectura.", "error");
      };
      window.speechSynthesis.speak(lectura);
    });

    elementos.pausar.addEventListener("click", () => {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
        elementos.pausar.textContent = "Pausar";
        anunciar(elementos.estadoVoz, "Lectura reanudada.");
      } else {
        window.speechSynthesis.pause();
        elementos.pausar.textContent = "Reanudar";
        anunciar(elementos.estadoVoz, "Lectura pausada.");
      }
    });

    elementos.detener.addEventListener("click", () => {
      window.speechSynthesis.cancel();
      elementos.pausar.disabled = true;
      elementos.detener.disabled = true;
      elementos.pausar.textContent = "Pausar";
      anunciar(elementos.estadoVoz, "Lectura detenida.");
    });

    window.addEventListener("beforeunload", () => window.speechSynthesis.cancel());
  };

  const crearTarjetaImpresion = (tarjeta) => {
    const articulo = document.createElement("article");
    articulo.className = "tarjeta-impresion";

    const meta = document.createElement("p");
    meta.className = "meta-impresion";
    meta.textContent = `${tarjeta.categoria || "Sin categoría"} · ${tipos[tarjeta.tipo]?.nombre || "Tarjeta educativa"}`;
    articulo.appendChild(meta);

    if (tarjeta.imagen) {
      const imagen = document.createElement("img");
      imagen.src = tarjeta.imagen;
      imagen.alt = tarjeta.textoAlternativo || "";
      articulo.appendChild(imagen);
      if (tarjeta.textoAlternativo) {
        const descripcion = document.createElement("p");
        descripcion.className = "descripcion-imagen";
        descripcion.textContent = `Descripción de imagen: ${tarjeta.textoAlternativo}`;
        articulo.appendChild(descripcion);
      }
    }

    const titulo = document.createElement("h2");
    titulo.textContent = tarjeta.frente;
    articulo.appendChild(titulo);

    const respuesta = document.createElement("div");
    respuesta.className = "respuesta-impresion";
    const etiqueta = document.createElement("strong");
    etiqueta.textContent = tarjeta.etiqueta || tipos[tarjeta.tipo]?.etiqueta || "Contenido";
    const texto = document.createElement("span");
    texto.textContent = tarjeta.reverso;
    respuesta.append(etiqueta, texto);
    articulo.appendChild(respuesta);

    return articulo;
  };

  const limpiarZonaImpresion = () => {
    elementos.zonaImpresion.replaceChildren();
    elementos.zonaImpresion.hidden = true;
    elementos.zonaImpresion.setAttribute("aria-hidden", "true");
  };

  const imprimirTarjetas = (tarjetas, titulo, porHoja = "4") => {
    if (!tarjetas.length) {
      anunciar(elementos.estadoImpresion, "No hay tarjetas disponibles para imprimir.", "error");
      return;
    }

    elementos.zonaImpresion.replaceChildren();
    elementos.zonaImpresion.dataset.porHoja = porHoja;

    const encabezado = document.createElement("h1");
    encabezado.className = "titulo-coleccion-impresion";
    encabezado.textContent = titulo;
    elementos.zonaImpresion.appendChild(encabezado);

    tarjetas.forEach((tarjeta) => elementos.zonaImpresion.appendChild(crearTarjetaImpresion(tarjeta)));
    elementos.zonaImpresion.hidden = false;
    elementos.zonaImpresion.setAttribute("aria-hidden", "false");
    anunciar(elementos.estadoImpresion, `${tarjetas.length} tarjetas preparadas para imprimir.`, "exito");
    window.setTimeout(() => window.print(), 60);
  };

  const configurarImpresion = () => {
    elementos.imprimirActual.addEventListener("click", () => {
      imprimirTarjetas([obtenerTarjetaActual()], "Tarjeta educativa EVA", "1");
    });

    elementos.imprimirColeccion.addEventListener("click", () => {
      const tarjetas = leerTarjetas();
      let seleccion = tarjetas;
      let titulo = "Mis tarjetas educativas";

      if (elementos.contenidoImpresion.value === "favoritas") {
        seleccion = tarjetas.filter((tarjeta) => tarjeta.favorita);
        titulo = "Tarjetas favoritas";
      }

      if (elementos.contenidoImpresion.value === "filtradas") {
        const idsVisibles = [...document.querySelectorAll("#lista-personales .tarjeta-guardada[data-id]")]
          .map((articulo) => articulo.dataset.id);
        seleccion = idsVisibles.map((id) => tarjetas.find((tarjeta) => tarjeta.id === id)).filter(Boolean);
        titulo = "Tarjetas filtradas";
      }

      imprimirTarjetas(seleccion, titulo, elementos.porHoja.value);
    });

    window.addEventListener("afterprint", limpiarZonaImpresion);
  };

  const descargarJson = (datos, nombre) => {
    const blob = new Blob([JSON.stringify(datos, null, 2)], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const enlace = document.createElement("a");
    enlace.href = url;
    enlace.download = nombre;
    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const configurarTransferencia = () => {
    elementos.exportar.addEventListener("click", () => {
      const incluirImagenes = elementos.exportarImagenes.checked;
      const tarjetas = leerTarjetas().map((tarjeta) => incluirImagenes
        ? tarjeta
        : { ...tarjeta, imagen: "", textoAlternativo: "" });

      const respaldo = {
        formato: "eva-tarjetas-educativas",
        version: 1,
        fechaExportacion: new Date().toISOString(),
        incluyeImagenes: incluirImagenes,
        tarjetas,
        secuencias
      };

      const fecha = new Date().toISOString().slice(0, 10);
      descargarJson(respaldo, `eva-tarjetas-${fecha}.json`);
      anunciar(elementos.estadoTransferencia, `Respaldo descargado con ${tarjetas.length} tarjetas y ${secuencias.length} secuencias.`, "exito");
    });

    elementos.archivoImportacion.addEventListener("change", () => {
      const archivo = elementos.archivoImportacion.files?.[0];
      anunciar(
        elementos.estadoTransferencia,
        archivo ? `Archivo seleccionado: ${archivo.name}` : "No se ha seleccionado ningún archivo."
      );
    });

    elementos.importar.addEventListener("click", async () => {
      const archivo = elementos.archivoImportacion.files?.[0];
      if (!archivo) {
        anunciar(elementos.estadoTransferencia, "Seleccione un archivo JSON antes de importar.", "error");
        elementos.archivoImportacion.focus();
        return;
      }
      if (archivo.size > MAX_IMPORT_BYTES) {
        anunciar(elementos.estadoTransferencia, "El archivo supera el límite de 30 MB.", "error");
        return;
      }

      try {
        const texto = await archivo.text();
        const datos = JSON.parse(texto);
        const tarjetasImportadas = Array.isArray(datos) ? datos : datos.tarjetas;
        const secuenciasImportadas = Array.isArray(datos?.secuencias) ? datos.secuencias : [];

        if (!Array.isArray(tarjetasImportadas)) {
          throw new Error("El archivo no contiene una colección de tarjetas válida.");
        }

        const modo = elementos.modoImportacion.value;
        if (modo === "reemplazar" && !window.confirm("¿Reemplazar todas las tarjetas y secuencias personales de este navegador?")) {
          return;
        }

        const tarjetasAnteriores = localStorage.getItem(TARJETAS_KEY);
        const secuenciasAnteriores = localStorage.getItem(SECUENCIAS_KEY);
        const existentes = modo === "combinar" ? leerTarjetas() : [];
        const idsUsados = new Set(existentes.map((tarjeta) => tarjeta.id));
        const mapaIds = new Map();
        const nuevas = [];

        tarjetasImportadas.filter(esTarjetaValida).forEach((tarjetaOriginal) => {
          const idAnterior = typeof tarjetaOriginal.id === "string" && tarjetaOriginal.id
            ? tarjetaOriginal.id
            : crearId("importada");
          let idNuevo = idAnterior;
          while (idsUsados.has(idNuevo)) idNuevo = crearId("tarjeta");
          idsUsados.add(idNuevo);
          mapaIds.set(idAnterior, idNuevo);
          nuevas.push(normalizarTarjeta(tarjetaOriginal, idNuevo));
        });

        const secuenciasBase = modo === "combinar" ? [...secuencias] : [];
        const idsSecuencia = new Set(secuenciasBase.map((secuencia) => secuencia.id));
        const secuenciasNuevas = secuenciasImportadas
          .filter(esSecuenciaValida)
          .map((secuencia) => {
            let id = secuencia.id;
            while (idsSecuencia.has(id)) id = crearId("secuencia");
            idsSecuencia.add(id);
            const tarjetaIds = secuencia.tarjetaIds
              .map((tarjetaId) => mapaIds.get(tarjetaId))
              .filter(Boolean);
            return {
              id,
              nombre: secuencia.nombre.trim().slice(0, 80),
              tarjetaIds,
              fechaCreacion: secuencia.fechaCreacion || new Date().toISOString(),
              fechaActualizacion: new Date().toISOString()
            };
          })
          .filter((secuencia) => secuencia.tarjetaIds.length > 0);

        try {
          guardarTarjetas([...existentes, ...nuevas]);
          secuencias = [...secuenciasBase, ...secuenciasNuevas];
          guardarSecuencias();
        } catch (error) {
          if (tarjetasAnteriores === null) localStorage.removeItem(TARJETAS_KEY);
          else localStorage.setItem(TARJETAS_KEY, tarjetasAnteriores);
          if (secuenciasAnteriores === null) localStorage.removeItem(SECUENCIAS_KEY);
          else localStorage.setItem(SECUENCIAS_KEY, secuenciasAnteriores);
          throw new Error("No hay suficiente espacio para guardar la colección importada.");
        }

        anunciar(
          elementos.estadoTransferencia,
          `Importación completada: ${nuevas.length} tarjetas y ${secuenciasNuevas.length} secuencias.`,
          "exito"
        );
        window.setTimeout(() => window.location.reload(), 350);
      } catch (error) {
        anunciar(elementos.estadoTransferencia, error.message || "No se pudo importar el archivo.", "error");
      }
    });
  };

  const tarjetasPorId = () => new Map(leerTarjetas().map((tarjeta) => [tarjeta.id, tarjeta]));

  const obtenerSeleccionEditor = () => [...elementos.selectorSecuencia.querySelectorAll('input[type="checkbox"]:checked')]
    .map((casilla) => casilla.value);

  const renderizarSelectorSecuencia = (ordenPreferido = null) => {
    const tarjetas = leerTarjetas();
    const seleccionActual = new Set(
      ordenPreferido || obtenerSeleccionEditor()
    );
    elementos.selectorSecuencia.replaceChildren();

    if (tarjetas.length === 0) {
      const vacio = document.createElement("p");
      vacio.className = "vacio";
      vacio.textContent = "Primero cree al menos dos tarjetas personales.";
      elementos.selectorSecuencia.appendChild(vacio);
      elementos.guardarSecuencia.disabled = true;
      anunciar(elementos.estadoSecuencia, "Cree al menos dos tarjetas personales antes de formar una secuencia.");
      return;
    }

    const posicion = new Map((ordenPreferido || []).map((id, indice) => [id, indice]));
    tarjetas.sort((a, b) => {
      const pa = posicion.has(a.id) ? posicion.get(a.id) : Number.MAX_SAFE_INTEGER;
      const pb = posicion.has(b.id) ? posicion.get(b.id) : Number.MAX_SAFE_INTEGER;
      return pa - pb;
    });

    tarjetas.forEach((tarjeta) => {
      const etiqueta = document.createElement("label");
      etiqueta.className = "opcion-secuencia";
      const casilla = document.createElement("input");
      casilla.type = "checkbox";
      casilla.value = tarjeta.id;
      casilla.checked = seleccionActual.has(tarjeta.id);
      const texto = document.createElement("span");
      const titulo = document.createElement("strong");
      titulo.textContent = tarjeta.frente;
      const detalle = document.createElement("small");
      detalle.textContent = `${tarjeta.categoria} · ${tipos[tarjeta.tipo].nombre}`;
      texto.append(titulo, detalle);
      etiqueta.append(casilla, texto);
      elementos.selectorSecuencia.appendChild(etiqueta);
    });

    elementos.guardarSecuencia.disabled = tarjetas.length < 2;
    if (tarjetas.length < 2) {
      anunciar(elementos.estadoSecuencia, "Se necesitan al menos dos tarjetas personales para crear una secuencia.");
    } else if (!elementos.secuenciaId.value) {
      anunciar(elementos.estadoSecuencia, "Seleccione dos o más tarjetas y escriba un nombre.");
    }
  };

  const limpiarEditorSecuencia = () => {
    elementos.formularioSecuencia.reset();
    elementos.secuenciaId.value = "";
    elementos.guardarSecuencia.textContent = "Guardar secuencia";
    elementos.cancelarSecuencia.hidden = true;
    renderizarSelectorSecuencia([]);
    anunciar(elementos.estadoSecuencia, "Seleccione dos o más tarjetas y escriba un nombre.");
  };

  const moverPaso = (secuenciaId, indice, direccion) => {
    const secuencia = secuencias.find((item) => item.id === secuenciaId);
    if (!secuencia) return;
    const destino = indice + direccion;
    if (destino < 0 || destino >= secuencia.tarjetaIds.length) return;
    [secuencia.tarjetaIds[indice], secuencia.tarjetaIds[destino]] = [
      secuencia.tarjetaIds[destino],
      secuencia.tarjetaIds[indice]
    ];
    secuencia.fechaActualizacion = new Date().toISOString();
    guardarSecuencias();
    renderizarSecuencias();
    anunciar(elementos.estadoSecuencia, `Orden actualizado en “${secuencia.nombre}”.`, "exito");
  };

  const editarSecuencia = (id) => {
    const secuencia = secuencias.find((item) => item.id === id);
    if (!secuencia) return;
    elementos.secuenciaId.value = secuencia.id;
    elementos.nombreSecuencia.value = secuencia.nombre;
    elementos.guardarSecuencia.textContent = "Guardar cambios";
    elementos.cancelarSecuencia.hidden = false;
    renderizarSelectorSecuencia(secuencia.tarjetaIds);
    anunciar(elementos.estadoSecuencia, "Edición de secuencia activa.");
    elementos.formularioSecuencia.scrollIntoView({ behavior: "smooth", block: "start" });
    window.setTimeout(() => elementos.nombreSecuencia.focus(), 300);
  };

  const eliminarSecuencia = (id) => {
    const secuencia = secuencias.find((item) => item.id === id);
    if (!secuencia || !window.confirm(`¿Eliminar la secuencia “${secuencia.nombre}”?`)) return;
    secuencias = secuencias.filter((item) => item.id !== id);
    guardarSecuencias();
    if (elementos.secuenciaId.value === id) limpiarEditorSecuencia();
    if (secuenciaActiva?.id === id) cerrarVisorSecuencia();
    renderizarSecuencias();
    anunciar(elementos.estadoSecuencia, `Se eliminó la secuencia “${secuencia.nombre}”.`);
  };

  const imprimirSecuencia = (id) => {
    const secuencia = secuencias.find((item) => item.id === id);
    if (!secuencia) return;
    const mapa = tarjetasPorId();
    const tarjetas = secuencia.tarjetaIds.map((tarjetaId) => mapa.get(tarjetaId)).filter(Boolean);
    imprimirTarjetas(tarjetas, secuencia.nombre, elementos.porHoja.value);
  };

  const aplicarPlantillaSecuencia = (plantilla) => {
    elementos.tarjetaSecuencia.classList.remove("plantilla-clasica", "plantilla-visual", "plantilla-contraste");
    elementos.tarjetaSecuencia.classList.add(`plantilla-${plantillas.has(plantilla) ? plantilla : "clasica"}`);
  };

  const mostrarImagenSecuencia = (tarjeta) => {
    if (tarjeta.imagen) {
      elementos.imagenSecuencia.src = tarjeta.imagen;
      elementos.imagenSecuencia.alt = tarjeta.textoAlternativo;
      elementos.contenedorImagenSecuencia.hidden = false;
    } else {
      elementos.contenedorImagenSecuencia.hidden = true;
      elementos.imagenSecuencia.removeAttribute("src");
      elementos.imagenSecuencia.alt = "";
    }
  };

  const renderizarPasoSecuencia = () => {
    const tarjeta = tarjetasSecuenciaActiva[indiceSecuencia];
    if (!tarjeta) {
      cerrarVisorSecuencia();
      return;
    }

    reversoSecuenciaVisible = false;
    elementos.reversoSecuencia.hidden = true;
    elementos.mostrarSecuencia.setAttribute("aria-expanded", "false");
    elementos.mostrarSecuencia.textContent = `Mostrar ${tipos[tarjeta.tipo].etiqueta.toLowerCase()}`;
    elementos.progresoSecuencia.textContent = `Paso ${indiceSecuencia + 1} de ${tarjetasSecuenciaActiva.length}`;
    elementos.categoriaSecuencia.textContent = tarjeta.categoria;
    elementos.tipoSecuencia.textContent = tipos[tarjeta.tipo].nombre;
    elementos.frenteSecuencia.textContent = tarjeta.frente;
    elementos.etiquetaReversoSecuencia.textContent = tipos[tarjeta.tipo].etiqueta;
    elementos.textoReversoSecuencia.textContent = tarjeta.reverso;
    mostrarImagenSecuencia(tarjeta);
    aplicarPlantillaSecuencia(tarjeta.plantilla);
    elementos.anteriorSecuencia.disabled = indiceSecuencia === 0;
    elementos.siguienteSecuencia.disabled = indiceSecuencia === tarjetasSecuenciaActiva.length - 1;
  };

  const practicarSecuencia = (id) => {
    const secuencia = secuencias.find((item) => item.id === id);
    if (!secuencia) return;
    const mapa = tarjetasPorId();
    const tarjetas = secuencia.tarjetaIds.map((tarjetaId) => mapa.get(tarjetaId)).filter(Boolean);
    if (!tarjetas.length) {
      anunciar(elementos.estadoSecuencia, "La secuencia no contiene tarjetas disponibles.", "error");
      return;
    }
    secuenciaActiva = secuencia;
    tarjetasSecuenciaActiva = tarjetas;
    indiceSecuencia = 0;
    elementos.tituloVisor.textContent = secuencia.nombre;
    elementos.visorSecuencia.hidden = false;
    renderizarPasoSecuencia();
    elementos.visorSecuencia.scrollIntoView({ behavior: "smooth", block: "start" });
    window.setTimeout(() => elementos.tarjetaSecuencia.focus(), 300);
  };

  function cerrarVisorSecuencia() {
    elementos.visorSecuencia.hidden = true;
    secuenciaActiva = null;
    tarjetasSecuenciaActiva = [];
    indiceSecuencia = 0;
  }

  const alternarReversoSecuencia = () => {
    const tarjeta = tarjetasSecuenciaActiva[indiceSecuencia];
    if (!tarjeta) return;
    reversoSecuenciaVisible = !reversoSecuenciaVisible;
    elementos.reversoSecuencia.hidden = !reversoSecuenciaVisible;
    elementos.mostrarSecuencia.setAttribute("aria-expanded", reversoSecuenciaVisible ? "true" : "false");
    elementos.mostrarSecuencia.textContent = reversoSecuenciaVisible
      ? `Ocultar ${tipos[tarjeta.tipo].etiqueta.toLowerCase()}`
      : `Mostrar ${tipos[tarjeta.tipo].etiqueta.toLowerCase()}`;
  };

  const renderizarSecuencias = () => {
    sanitizarSecuencias();
    const mapa = tarjetasPorId();
    elementos.listaSecuencias.replaceChildren();

    if (secuencias.length === 0) {
      const vacio = document.createElement("p");
      vacio.className = "vacio";
      vacio.textContent = "Todavía no hay secuencias guardadas.";
      elementos.listaSecuencias.appendChild(vacio);
      return;
    }

    secuencias.forEach((secuencia) => {
      const articulo = document.createElement("article");
      articulo.className = "secuencia-guardada";
      articulo.dataset.id = secuencia.id;

      const titulo = document.createElement("h4");
      titulo.textContent = secuencia.nombre;
      const resumen = document.createElement("p");
      resumen.className = "secuencia-resumen";
      resumen.textContent = `${secuencia.tarjetaIds.length} ${secuencia.tarjetaIds.length === 1 ? "tarjeta" : "tarjetas"}`;

      const lista = document.createElement("ol");
      lista.className = "pasos-secuencia";
      secuencia.tarjetaIds.forEach((tarjetaId, indice) => {
        const tarjeta = mapa.get(tarjetaId);
        if (!tarjeta) return;
        const item = document.createElement("li");
        item.className = "paso-secuencia";

        const numero = document.createElement("span");
        numero.className = "numero-paso";
        numero.textContent = String(indice + 1);

        const texto = document.createElement("strong");
        texto.textContent = tarjeta.frente;

        const acciones = document.createElement("div");
        acciones.className = "acciones-orden";
        const subir = document.createElement("button");
        subir.type = "button";
        subir.textContent = "↑";
        subir.dataset.accion = "subir";
        subir.dataset.secuencia = secuencia.id;
        subir.dataset.indice = String(indice);
        subir.disabled = indice === 0;
        subir.setAttribute("aria-label", `Subir “${tarjeta.frente}”`);

        const bajar = document.createElement("button");
        bajar.type = "button";
        bajar.textContent = "↓";
        bajar.dataset.accion = "bajar";
        bajar.dataset.secuencia = secuencia.id;
        bajar.dataset.indice = String(indice);
        bajar.disabled = indice === secuencia.tarjetaIds.length - 1;
        bajar.setAttribute("aria-label", `Bajar “${tarjeta.frente}”`);

        acciones.append(subir, bajar);
        item.append(numero, texto, acciones);
        lista.appendChild(item);
      });

      const acciones = document.createElement("div");
      acciones.className = "acciones-secuencia";
      [
        ["Practicar", "practicar", "principal"],
        ["Imprimir", "imprimir", ""],
        ["Editar", "editar", ""],
        ["Eliminar", "eliminar", "peligro"]
      ].forEach(([texto, accion, clase]) => {
        const boton = document.createElement("button");
        boton.type = "button";
        boton.textContent = texto;
        boton.dataset.accion = accion;
        boton.dataset.secuencia = secuencia.id;
        if (clase) boton.className = clase;
        acciones.appendChild(boton);
      });

      articulo.append(titulo, resumen, lista, acciones);
      elementos.listaSecuencias.appendChild(articulo);
    });
  };

  const configurarSecuencias = () => {
    elementos.formularioSecuencia.addEventListener("submit", (evento) => {
      evento.preventDefault();
      const nombre = elementos.nombreSecuencia.value.trim();
      const tarjetaIds = obtenerSeleccionEditor();

      if (!nombre) {
        anunciar(elementos.estadoSecuencia, "Escriba un nombre para la secuencia.", "error");
        elementos.nombreSecuencia.focus();
        return;
      }
      if (tarjetaIds.length < 2) {
        anunciar(elementos.estadoSecuencia, "Seleccione al menos dos tarjetas.", "error");
        elementos.selectorSecuencia.querySelector("input")?.focus();
        return;
      }

      const idExistente = elementos.secuenciaId.value;
      const ahora = new Date().toISOString();
      if (idExistente) {
        const indice = secuencias.findIndex((secuencia) => secuencia.id === idExistente);
        if (indice < 0) return;
        secuencias[indice] = {
          ...secuencias[indice],
          nombre: nombre.slice(0, 80),
          tarjetaIds,
          fechaActualizacion: ahora
        };
      } else {
        secuencias.unshift({
          id: crearId("secuencia"),
          nombre: nombre.slice(0, 80),
          tarjetaIds,
          fechaCreacion: ahora,
          fechaActualizacion: ahora
        });
      }

      try {
        guardarSecuencias();
        renderizarSecuencias();
        limpiarEditorSecuencia();
        anunciar(elementos.estadoSecuencia, idExistente ? "Los cambios de la secuencia se guardaron." : "La secuencia se guardó correctamente.", "exito");
      } catch (error) {
        anunciar(elementos.estadoSecuencia, "No se pudo guardar la secuencia.", "error");
      }
    });

    elementos.cancelarSecuencia.addEventListener("click", limpiarEditorSecuencia);

    elementos.listaSecuencias.addEventListener("click", (evento) => {
      const boton = evento.target.closest("button[data-accion][data-secuencia]");
      if (!boton) return;
      const id = boton.dataset.secuencia;
      const accion = boton.dataset.accion;
      const indice = Number(boton.dataset.indice);

      if (accion === "subir") moverPaso(id, indice, -1);
      if (accion === "bajar") moverPaso(id, indice, 1);
      if (accion === "practicar") practicarSecuencia(id);
      if (accion === "imprimir") imprimirSecuencia(id);
      if (accion === "editar") editarSecuencia(id);
      if (accion === "eliminar") eliminarSecuencia(id);
    });

    elementos.anteriorSecuencia.addEventListener("click", () => {
      if (indiceSecuencia > 0) {
        indiceSecuencia -= 1;
        renderizarPasoSecuencia();
      }
    });

    elementos.siguienteSecuencia.addEventListener("click", () => {
      if (indiceSecuencia < tarjetasSecuenciaActiva.length - 1) {
        indiceSecuencia += 1;
        renderizarPasoSecuencia();
      }
    });

    elementos.mostrarSecuencia.addEventListener("click", alternarReversoSecuencia);
    elementos.cerrarVisor.addEventListener("click", cerrarVisorSecuencia);

    elementos.tarjetaSecuencia.addEventListener("keydown", (evento) => {
      if (evento.key === " " || evento.key === "Enter") {
        evento.preventDefault();
        alternarReversoSecuencia();
      }
      if (evento.key === "ArrowLeft" && indiceSecuencia > 0) {
        evento.preventDefault();
        indiceSecuencia -= 1;
        renderizarPasoSecuencia();
      }
      if (evento.key === "ArrowRight" && indiceSecuencia < tarjetasSecuenciaActiva.length - 1) {
        evento.preventDefault();
        indiceSecuencia += 1;
        renderizarPasoSecuencia();
      }
    });

    if (elementos.listaPersonales) {
      const observador = new MutationObserver(() => {
        if (observadorProgramado) return;
        observadorProgramado = true;
        window.setTimeout(() => {
          observadorProgramado = false;
          renderizarSelectorSecuencia();
          renderizarSecuencias();
        }, 80);
      });
      observador.observe(elementos.listaPersonales, { childList: true, subtree: true });
    }
  };

  secuencias = leerSecuencias();
  configurarVoz();
  configurarImpresion();
  configurarTransferencia();
  configurarSecuencias();
  renderizarSelectorSecuencia([]);
  renderizarSecuencias();
})();
