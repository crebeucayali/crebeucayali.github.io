(() => {
  "use strict";

  const STORAGE_KEY = "eva_tarjetas_educativas_v1";
  const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
  const MAX_IMAGE_DIMENSION = 900;

  const tipos = {
    pregunta: { nombre: "Pregunta y respuesta", frente: "Pregunta o título", reverso: "Respuesta o explicación", etiquetaReverso: "Respuesta", mostrar: "respuesta", instruccion: "Lea la pregunta y active “Mostrar respuesta”." },
    concepto: { nombre: "Concepto", frente: "Nombre del concepto", reverso: "Definición o explicación", etiquetaReverso: "Explicación", mostrar: "explicación", instruccion: "Lea el concepto y active “Mostrar explicación”." },
    rutina: { nombre: "Rutina o instrucción", frente: "Nombre de la rutina o acción", reverso: "Pasos o instrucción", etiquetaReverso: "Instrucción", mostrar: "instrucción", instruccion: "Lea la acción y active “Mostrar instrucción”." }
  };

  const plantillas = {
    clasica: { nombre: "Clásica", clase: "plantilla-clasica" },
    visual: { nombre: "Imagen destacada", clase: "plantilla-visual" },
    contraste: { nombre: "Alto contraste", clase: "plantilla-contraste" }
  };

  const tarjetasIniciales = [
    { id: "base-braille-1", origen: "base", tipo: "pregunta", categoria: "Braille", frente: "¿Cuántos puntos conforman la celda Braille?", reverso: "La celda Braille está formada por seis puntos organizados en dos columnas de tres." },
    { id: "base-braille-2", origen: "base", tipo: "pregunta", categoria: "Braille", frente: "¿Para qué se utiliza la regleta Braille?", reverso: "Se utiliza para escribir Braille manualmente con ayuda de un punzón y una hoja de papel." },
    { id: "base-accesibilidad-1", origen: "base", tipo: "pregunta", categoria: "Accesibilidad", frente: "¿Qué permite un enlace para saltar al contenido principal?", reverso: "Permite que quienes navegan con teclado eviten bloques repetidos y lleguen directamente al contenido principal." },
    { id: "base-accesibilidad-2", origen: "base", tipo: "concepto", categoria: "Accesibilidad", frente: "Texto alternativo", reverso: "Comunica la información o función relevante de una imagen dentro del contexto donde aparece." },
    { id: "base-inclusion-1", origen: "base", tipo: "concepto", categoria: "Inclusión educativa", frente: "Diseño Universal para el Aprendizaje", reverso: "Busca ofrecer múltiples formas de participación, representación y acción para atender la diversidad del alumnado." },
    { id: "base-inclusion-2", origen: "base", tipo: "concepto", categoria: "Inclusión educativa", frente: "Ajuste razonable", reverso: "Es una modificación necesaria y adecuada que permite a una persona participar y aprender en igualdad de condiciones." }
  ].map((tarjeta) => ({ ...tarjeta, plantilla: "clasica", imagen: "", textoAlternativo: "", favorita: false }));

  const elementos = {
    selector: document.querySelector("#selector-tema"), progreso: document.querySelector("#progreso"), categoria: document.querySelector("#categoria"), tipoTarjeta: document.querySelector("#tipo-tarjeta"), instruccion: document.querySelector("#instruccion-tarjeta"), pregunta: document.querySelector("#pregunta"), respuesta: document.querySelector("#respuesta"), etiquetaRespuesta: document.querySelector("#etiqueta-respuesta"), textoRespuesta: document.querySelector("#texto-respuesta"), estado: document.querySelector("#estado"), tarjeta: document.querySelector("#tarjeta"), contenedorImagenPractica: document.querySelector("#contenedor-imagen-practica"), imagenPractica: document.querySelector("#imagen-practica"), anterior: document.querySelector("#anterior"), mostrar: document.querySelector("#mostrar"), siguiente: document.querySelector("#siguiente"), aleatoria: document.querySelector("#aleatoria"), reiniciar: document.querySelector("#reiniciar"),
    formulario: document.querySelector("#formulario-tarjeta"), tarjetaId: document.querySelector("#tarjeta-id"), campoTipo: document.querySelector("#campo-tipo"), campoCategoria: document.querySelector("#campo-categoria"), campoPlantilla: document.querySelector("#campo-plantilla"), campoFrente: document.querySelector("#campo-frente"), campoReverso: document.querySelector("#campo-reverso"), campoImagen: document.querySelector("#campo-imagen"), campoAlternativo: document.querySelector("#campo-alternativo"), etiquetaFrente: document.querySelector("#etiqueta-frente"), etiquetaReversoFormulario: document.querySelector("#etiqueta-reverso"), contadorReverso: document.querySelector("#contador-reverso"), ayudaAlternativo: document.querySelector("#ayuda-alternativo"), controlImagen: document.querySelector("#control-imagen"), imagenFormulario: document.querySelector("#imagen-formulario"), estadoImagen: document.querySelector("#estado-imagen"), retirarImagen: document.querySelector("#retirar-imagen"), previaCategoria: document.querySelector("#previa-categoria"), previaTipo: document.querySelector("#previa-tipo"), previaFrente: document.querySelector("#previa-frente"), previaEtiqueta: document.querySelector("#previa-etiqueta"), previaReverso: document.querySelector("#previa-reverso"), vistaPrevia: document.querySelector("#vista-previa"), contenedorImagenPrevia: document.querySelector("#contenedor-imagen-previa"), imagenPrevia: document.querySelector("#imagen-previa"), estadoFormulario: document.querySelector("#estado-formulario"), guardarTarjeta: document.querySelector("#guardar-tarjeta"), limpiarFormulario: document.querySelector("#limpiar-formulario"), cancelarEdicion: document.querySelector("#cancelar-edicion"),
    buscarPersonales: document.querySelector("#buscar-personales"), filtroTipo: document.querySelector("#filtro-tipo"), soloFavoritas: document.querySelector("#solo-favoritas"), contadorTarjetas: document.querySelector("#contador-tarjetas"), estadoBanco: document.querySelector("#estado-banco"), listaPersonales: document.querySelector("#lista-personales")
  };

  let tarjetasPersonales = [];
  let tarjetas = [];
  let tarjetasActivas = [];
  let indiceActual = 0;
  let respuestaVisible = false;
  let imagenFormularioDatos = "";

  const normalizar = (texto = "") => texto.toString().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
  const claveCategoria = (categoria) => normalizar(categoria).replace(/[^a-z0-9]+/g, "-");
  const clasePlantilla = (clave) => (plantillas[clave] || plantillas.clasica).clase;
  const aplicarPlantilla = (elemento, clave) => {
    elemento.classList.remove(...Object.values(plantillas).map((plantilla) => plantilla.clase));
    elemento.classList.add(clasePlantilla(clave));
  };

  const crearId = () => {
    if (window.crypto && typeof window.crypto.randomUUID === "function") return window.crypto.randomUUID();
    return `tarjeta-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  };

  const esTarjetaValida = (tarjeta) => Boolean(tarjeta && typeof tarjeta.id === "string" && tipos[tarjeta.tipo] && typeof tarjeta.categoria === "string" && typeof tarjeta.frente === "string" && typeof tarjeta.reverso === "string");
  const completarTarjeta = (tarjeta) => ({
    ...tarjeta,
    origen: "personal",
    plantilla: plantillas[tarjeta.plantilla] ? tarjeta.plantilla : "clasica",
    imagen: typeof tarjeta.imagen === "string" ? tarjeta.imagen : "",
    textoAlternativo: typeof tarjeta.textoAlternativo === "string" ? tarjeta.textoAlternativo : "",
    favorita: Boolean(tarjeta.favorita)
  });

  const leerPersonales = () => {
    try {
      const datos = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      return Array.isArray(datos) ? datos.filter(esTarjetaValida).map(completarTarjeta) : [];
    } catch (error) {
      return [];
    }
  };

  const guardarPersonales = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tarjetasPersonales));
      return true;
    } catch (error) {
      anunciarFormulario("No se pudo guardar. Reduzca la cantidad de imágenes o revise el almacenamiento del navegador.", "error");
      return false;
    }
  };

  const anunciar = (mensaje) => { elementos.estado.textContent = ""; window.setTimeout(() => { elementos.estado.textContent = mensaje; }, 30); };
  const anunciarFormulario = (mensaje, tipo = "") => { elementos.estadoFormulario.className = `estado-formulario${tipo ? ` ${tipo}` : ""}`; elementos.estadoFormulario.textContent = ""; window.setTimeout(() => { elementos.estadoFormulario.textContent = mensaje; }, 30); };
  const anunciarBanco = (mensaje) => { elementos.estadoBanco.textContent = ""; window.setTimeout(() => { elementos.estadoBanco.textContent = mensaje; }, 30); };

  const actualizarBotones = () => {
    const hayUna = tarjetasActivas.length <= 1;
    elementos.anterior.disabled = hayUna;
    elementos.siguiente.disabled = hayUna;
    elementos.aleatoria.disabled = hayUna;
    elementos.mostrar.disabled = tarjetasActivas.length === 0;
  };

  const ocultarRespuesta = () => {
    respuestaVisible = false;
    elementos.respuesta.hidden = true;
    const tarjeta = tarjetasActivas[indiceActual];
    elementos.mostrar.textContent = `Mostrar ${tarjeta ? tipos[tarjeta.tipo].mostrar : "respuesta"}`;
    elementos.mostrar.setAttribute("aria-expanded", "false");
  };

  const mostrarImagen = (contenedor, imagen, datos, alternativo) => {
    if (datos) {
      imagen.src = datos;
      imagen.alt = alternativo || "Imagen educativa sin descripción disponible.";
      contenedor.hidden = false;
    } else {
      contenedor.hidden = true;
      imagen.removeAttribute("src");
      imagen.alt = "";
    }
  };

  const mostrarTarjeta = ({ anunciarCambio = false } = {}) => {
    const tarjeta = tarjetasActivas[indiceActual];
    if (!tarjeta) {
      elementos.categoria.textContent = "Sin resultados";
      elementos.tipoTarjeta.textContent = "Sin tarjetas";
      elementos.instruccion.textContent = "Seleccione otro tema o cree una tarjeta nueva.";
      elementos.pregunta.textContent = "No hay tarjetas disponibles para este filtro.";
      elementos.textoRespuesta.textContent = "";
      elementos.progreso.textContent = "0 tarjetas";
      mostrarImagen(elementos.contenedorImagenPractica, elementos.imagenPractica, "", "");
      aplicarPlantilla(elementos.tarjeta, "clasica");
      ocultarRespuesta();
      actualizarBotones();
      anunciar("No hay tarjetas disponibles.");
      return;
    }

    ocultarRespuesta();
    const configuracion = tipos[tarjeta.tipo];
    elementos.categoria.textContent = tarjeta.categoria;
    elementos.tipoTarjeta.textContent = configuracion.nombre;
    elementos.instruccion.textContent = configuracion.instruccion;
    elementos.pregunta.textContent = tarjeta.frente;
    elementos.etiquetaRespuesta.textContent = configuracion.etiquetaReverso;
    elementos.textoRespuesta.textContent = tarjeta.reverso;
    elementos.progreso.textContent = `Tarjeta ${indiceActual + 1} de ${tarjetasActivas.length}`;
    mostrarImagen(elementos.contenedorImagenPractica, elementos.imagenPractica, tarjeta.imagen, tarjeta.textoAlternativo);
    aplicarPlantilla(elementos.tarjeta, tarjeta.plantilla);
    actualizarBotones();
    anunciar(anunciarCambio ? `Tarjeta ${indiceActual + 1} de ${tarjetasActivas.length}. ${tarjeta.frente}` : "Tarjeta lista.");
  };

  const alternarRespuesta = () => {
    const tarjeta = tarjetasActivas[indiceActual];
    if (!tarjeta) return;
    respuestaVisible = !respuestaVisible;
    elementos.respuesta.hidden = !respuestaVisible;
    const palabra = tipos[tarjeta.tipo].mostrar;
    elementos.mostrar.textContent = respuestaVisible ? `Ocultar ${palabra}` : `Mostrar ${palabra}`;
    elementos.mostrar.setAttribute("aria-expanded", respuestaVisible ? "true" : "false");
    anunciar(respuestaVisible ? `${tipos[tarjeta.tipo].etiquetaReverso}: ${elementos.textoRespuesta.textContent}` : "Contenido ocultado.");
  };

  const mover = (direccion) => {
    if (!tarjetasActivas.length) return;
    indiceActual = (indiceActual + direccion + tarjetasActivas.length) % tarjetasActivas.length;
    mostrarTarjeta({ anunciarCambio: true });
  };

  const construirSelector = () => {
    const valorAnterior = elementos.selector.value || "todos";
    const categorias = [...new Set(tarjetas.map((tarjeta) => tarjeta.categoria.trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, "es", { sensitivity: "base" }));
    elementos.selector.replaceChildren();
    const opcionTodos = document.createElement("option");
    opcionTodos.value = "todos";
    opcionTodos.textContent = "Todos los temas";
    elementos.selector.appendChild(opcionTodos);
    categorias.forEach((categoria) => {
      const opcion = document.createElement("option");
      opcion.value = claveCategoria(categoria);
      opcion.textContent = categoria;
      elementos.selector.appendChild(opcion);
    });
    elementos.selector.value = [...elementos.selector.options].some((opcion) => opcion.value === valorAnterior) ? valorAnterior : "todos";
  };

  const aplicarFiltroPractica = ({ anunciarCambio = false } = {}) => {
    const tema = elementos.selector.value;
    tarjetasActivas = tema === "todos" ? [...tarjetas] : tarjetas.filter((tarjeta) => claveCategoria(tarjeta.categoria) === tema);
    indiceActual = 0;
    mostrarTarjeta();
    if (anunciarCambio) anunciar(`Tema seleccionado. Se muestran ${tarjetasActivas.length} tarjetas.`);
  };

  const actualizarEtiquetasFormulario = () => {
    const configuracion = tipos[elementos.campoTipo.value];
    elementos.etiquetaFrente.textContent = configuracion.frente;
    elementos.etiquetaReversoFormulario.textContent = configuracion.reverso;
    elementos.previaTipo.textContent = configuracion.nombre;
    elementos.previaEtiqueta.textContent = configuracion.etiquetaReverso;
  };

  const actualizarEstadoImagen = () => {
    const hayImagen = Boolean(imagenFormularioDatos);
    elementos.controlImagen.hidden = !hayImagen;
    elementos.campoAlternativo.required = hayImagen;
    elementos.campoAlternativo.setAttribute("aria-required", hayImagen ? "true" : "false");
    elementos.ayudaAlternativo.textContent = hayImagen ? "Obligatoria: describa la información relevante de la imagen." : "Será obligatoria cuando seleccione una imagen.";
    if (hayImagen) {
      elementos.imagenFormulario.src = imagenFormularioDatos;
      elementos.imagenFormulario.alt = elementos.campoAlternativo.value.trim() || "Vista previa de la imagen pendiente de descripción accesible.";
    } else {
      elementos.imagenFormulario.removeAttribute("src");
      elementos.imagenFormulario.alt = "";
    }
  };

  const actualizarVistaPrevia = () => {
    actualizarEtiquetasFormulario();
    elementos.previaCategoria.textContent = elementos.campoCategoria.value.trim() || "Categoría";
    elementos.previaFrente.textContent = elementos.campoFrente.value.trim() || "La vista previa aparecerá aquí";
    elementos.previaReverso.textContent = elementos.campoReverso.value.trim() || "Complete los campos para revisar su tarjeta.";
    elementos.contadorReverso.textContent = `${elementos.campoReverso.value.length} de 420 caracteres`;
    aplicarPlantilla(elementos.vistaPrevia, elementos.campoPlantilla.value);
    mostrarImagen(elementos.contenedorImagenPrevia, elementos.imagenPrevia, imagenFormularioDatos, elementos.campoAlternativo.value.trim() || "Vista previa de la imagen pendiente de descripción accesible.");
    actualizarEstadoImagen();
  };

  const limpiarFormulario = ({ conservarMensaje = false } = {}) => {
    elementos.formulario.reset();
    elementos.tarjetaId.value = "";
    imagenFormularioDatos = "";
    elementos.guardarTarjeta.textContent = "Guardar tarjeta";
    elementos.cancelarEdicion.hidden = true;
    document.querySelector("#titulo-creador").textContent = "Nueva tarjeta educativa";
    actualizarVistaPrevia();
    if (!conservarMensaje) anunciarFormulario("Complete los campos obligatorios.");
  };

  const validarFormulario = () => {
    const campos = [elementos.campoCategoria, elementos.campoFrente, elementos.campoReverso];
    const campoInvalido = campos.find((campo) => !campo.value.trim());
    if (campoInvalido) {
      anunciarFormulario("Complete todos los campos obligatorios antes de guardar.", "error");
      campoInvalido.focus();
      return false;
    }
    if (imagenFormularioDatos && !elementos.campoAlternativo.value.trim()) {
      anunciarFormulario("Escriba la descripción accesible de la imagen antes de guardar.", "error");
      elementos.campoAlternativo.focus();
      return false;
    }
    return true;
  };

  const procesarImagen = (archivo) => new Promise((resolve, reject) => {
    if (!archivo || !["image/jpeg", "image/png", "image/webp"].includes(archivo.type)) {
      reject(new Error("Seleccione una imagen JPG, PNG o WebP."));
      return;
    }
    if (archivo.size > MAX_IMAGE_BYTES) {
      reject(new Error("La imagen supera el límite de 5 MB."));
      return;
    }
    const lector = new FileReader();
    lector.onerror = () => reject(new Error("No se pudo leer la imagen seleccionada."));
    lector.onload = () => {
      const imagen = new Image();
      imagen.onerror = () => reject(new Error("El archivo no contiene una imagen válida."));
      imagen.onload = () => {
        const escala = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(imagen.naturalWidth, imagen.naturalHeight));
        const ancho = Math.max(1, Math.round(imagen.naturalWidth * escala));
        const alto = Math.max(1, Math.round(imagen.naturalHeight * escala));
        const lienzo = document.createElement("canvas");
        lienzo.width = ancho;
        lienzo.height = alto;
        const contexto = lienzo.getContext("2d");
        if (!contexto) {
          reject(new Error("El navegador no pudo procesar la imagen."));
          return;
        }
        contexto.fillStyle = "#ffffff";
        contexto.fillRect(0, 0, ancho, alto);
        contexto.drawImage(imagen, 0, 0, ancho, alto);
        resolve(lienzo.toDataURL("image/jpeg", 0.8));
      };
      imagen.src = lector.result;
    };
    lector.readAsDataURL(archivo);
  });

  const crearBotonAccion = (texto, accion, id, clase = "") => {
    const boton = document.createElement("button");
    boton.type = "button";
    boton.textContent = texto;
    boton.dataset.accion = accion;
    boton.dataset.id = id;
    if (clase) boton.className = clase;
    return boton;
  };

  const obtenerPersonalesFiltradas = () => {
    const consulta = normalizar(elementos.buscarPersonales.value);
    const tipo = elementos.filtroTipo.value;
    return tarjetasPersonales.filter((tarjeta) => {
      const coincideTipo = tipo === "todos" || tarjeta.tipo === tipo;
      const coincideFavorita = !elementos.soloFavoritas.checked || tarjeta.favorita;
      const contenido = normalizar(`${tarjeta.categoria} ${tarjeta.frente} ${tarjeta.reverso} ${tarjeta.textoAlternativo}`);
      return coincideTipo && coincideFavorita && (!consulta || contenido.includes(consulta));
    });
  };

  const renderizarBanco = () => {
    const filtradas = obtenerPersonalesFiltradas();
    elementos.listaPersonales.replaceChildren();
    elementos.contadorTarjetas.textContent = tarjetasPersonales.length === 0 ? "No hay tarjetas personales guardadas." : `${tarjetasPersonales.length} ${tarjetasPersonales.length === 1 ? "tarjeta personal guardada" : "tarjetas personales guardadas"}.`;
    if (filtradas.length === 0) {
      const vacio = document.createElement("p");
      vacio.className = "vacio";
      vacio.textContent = tarjetasPersonales.length === 0 ? "Cree su primera tarjeta mediante el formulario anterior." : "No se encontraron tarjetas con los filtros seleccionados.";
      elementos.listaPersonales.appendChild(vacio);
      return;
    }

    filtradas.forEach((tarjeta) => {
      const articulo = document.createElement("article");
      articulo.className = `tarjeta-guardada ${clasePlantilla(tarjeta.plantilla)}`;
      articulo.dataset.id = tarjeta.id;
      const metadatos = document.createElement("div");
      metadatos.className = "tarjeta-metadatos";
      const categoria = document.createElement("span"); categoria.className = "categoria"; categoria.textContent = tarjeta.categoria;
      const tipo = document.createElement("span"); tipo.className = "tipo-tarjeta"; tipo.textContent = tipos[tarjeta.tipo].nombre;
      metadatos.append(categoria, tipo);
      articulo.appendChild(metadatos);

      if (tarjeta.imagen) {
        const figura = document.createElement("figure"); figura.className = "imagen-guardada";
        const imagen = document.createElement("img"); imagen.src = tarjeta.imagen; imagen.alt = tarjeta.textoAlternativo;
        figura.appendChild(imagen); articulo.appendChild(figura);
      }

      const titulo = document.createElement("h3"); titulo.textContent = tarjeta.frente;
      const contenido = document.createElement("p"); contenido.className = "contenido-guardado"; contenido.textContent = tarjeta.reverso;
      articulo.append(titulo, contenido);
      if (tarjeta.imagen) {
        const indicador = document.createElement("p"); indicador.className = "indicador-imagen"; indicador.textContent = "Imagen con descripción accesible"; articulo.appendChild(indicador);
      }

      const acciones = document.createElement("div"); acciones.className = "acciones-tarjeta";
      const favorito = crearBotonAccion(tarjeta.favorita ? "★ Favorita" : "☆ Marcar favorita", "favorito", tarjeta.id, "favorito");
      favorito.setAttribute("aria-pressed", tarjeta.favorita ? "true" : "false");
      favorito.setAttribute("aria-label", tarjeta.favorita ? `Quitar “${tarjeta.frente}” de favoritas` : `Marcar “${tarjeta.frente}” como favorita`);
      acciones.append(crearBotonAccion("Practicar", "practicar", tarjeta.id, "principal"), favorito, crearBotonAccion("Editar", "editar", tarjeta.id), crearBotonAccion("Duplicar", "duplicar", tarjeta.id), crearBotonAccion("Eliminar", "eliminar", tarjeta.id, "peligro"));
      articulo.appendChild(acciones);
      elementos.listaPersonales.appendChild(articulo);
    });
  };

  const refrescarColeccion = ({ anunciarPractica = false } = {}) => {
    tarjetas = [...tarjetasIniciales, ...tarjetasPersonales];
    construirSelector();
    aplicarFiltroPractica({ anunciarCambio: anunciarPractica });
    renderizarBanco();
  };

  const comenzarEdicion = (id) => {
    const tarjeta = tarjetasPersonales.find((item) => item.id === id);
    if (!tarjeta) return;
    elementos.tarjetaId.value = tarjeta.id;
    elementos.campoTipo.value = tarjeta.tipo;
    elementos.campoCategoria.value = tarjeta.categoria;
    elementos.campoPlantilla.value = tarjeta.plantilla;
    elementos.campoFrente.value = tarjeta.frente;
    elementos.campoReverso.value = tarjeta.reverso;
    elementos.campoAlternativo.value = tarjeta.textoAlternativo;
    imagenFormularioDatos = tarjeta.imagen;
    elementos.guardarTarjeta.textContent = "Guardar cambios";
    elementos.cancelarEdicion.hidden = false;
    document.querySelector("#titulo-creador").textContent = "Editar tarjeta educativa";
    actualizarVistaPrevia();
    anunciarFormulario("Edición activa. Modifique los campos y guarde los cambios.");
    document.querySelector("#crear").scrollIntoView({ behavior: "smooth", block: "start" });
    window.setTimeout(() => elementos.campoTipo.focus(), 350);
  };

  const duplicarTarjeta = (id) => {
    const original = tarjetasPersonales.find((item) => item.id === id);
    if (!original) return;
    const copia = { ...original, id: crearId(), frente: `${original.frente} (copia)`.slice(0, 120), favorita: false, fechaCreacion: new Date().toISOString(), fechaActualizacion: new Date().toISOString(), origen: "personal" };
    tarjetasPersonales.unshift(copia);
    if (!guardarPersonales()) { tarjetasPersonales.shift(); return; }
    refrescarColeccion();
    anunciarBanco(`Se duplicó la tarjeta “${original.frente}”.`);
  };

  const eliminarTarjeta = (id) => {
    const tarjeta = tarjetasPersonales.find((item) => item.id === id);
    if (!tarjeta || !window.confirm(`¿Eliminar la tarjeta “${tarjeta.frente}”? Esta acción no se puede deshacer.`)) return;
    const anteriores = [...tarjetasPersonales];
    tarjetasPersonales = tarjetasPersonales.filter((item) => item.id !== id);
    if (!guardarPersonales()) { tarjetasPersonales = anteriores; return; }
    if (elementos.tarjetaId.value === id) limpiarFormulario();
    refrescarColeccion();
    anunciarBanco(`Se eliminó la tarjeta “${tarjeta.frente}”.`);
  };

  const alternarFavorita = (id) => {
    const tarjeta = tarjetasPersonales.find((item) => item.id === id);
    if (!tarjeta) return;
    tarjeta.favorita = !tarjeta.favorita;
    tarjeta.fechaActualizacion = new Date().toISOString();
    if (!guardarPersonales()) { tarjeta.favorita = !tarjeta.favorita; return; }
    refrescarColeccion();
    anunciarBanco(tarjeta.favorita ? `“${tarjeta.frente}” se añadió a favoritas.` : `“${tarjeta.frente}” se retiró de favoritas.`);
  };

  const practicarTarjeta = (id) => {
    elementos.selector.value = "todos";
    tarjetasActivas = [...tarjetas];
    indiceActual = tarjetasActivas.findIndex((tarjeta) => tarjeta.id === id);
    if (indiceActual < 0) indiceActual = 0;
    mostrarTarjeta({ anunciarCambio: true });
    document.querySelector("#practicar").scrollIntoView({ behavior: "smooth", block: "start" });
    window.setTimeout(() => elementos.tarjeta.focus(), 350);
  };

  elementos.anterior.addEventListener("click", () => mover(-1));
  elementos.siguiente.addEventListener("click", () => mover(1));
  elementos.mostrar.addEventListener("click", alternarRespuesta);
  elementos.aleatoria.addEventListener("click", () => {
    if (tarjetasActivas.length <= 1) return;
    let nuevoIndice = indiceActual;
    while (nuevoIndice === indiceActual) nuevoIndice = Math.floor(Math.random() * tarjetasActivas.length);
    indiceActual = nuevoIndice;
    mostrarTarjeta({ anunciarCambio: true });
  });
  elementos.reiniciar.addEventListener("click", () => {
    elementos.selector.value = "todos";
    tarjetasActivas = [...tarjetas];
    indiceActual = 0;
    mostrarTarjeta();
    elementos.tarjeta.focus();
    anunciar(`Práctica reiniciada. Tarjeta 1 de ${tarjetasActivas.length}.`);
  });
  elementos.selector.addEventListener("change", () => aplicarFiltroPractica({ anunciarCambio: true }));
  elementos.tarjeta.addEventListener("keydown", (evento) => {
    if (evento.key === " " || evento.key === "Enter") { evento.preventDefault(); alternarRespuesta(); }
    if (evento.key === "ArrowLeft") { evento.preventDefault(); mover(-1); }
    if (evento.key === "ArrowRight") { evento.preventDefault(); mover(1); }
  });

  [elementos.campoTipo, elementos.campoPlantilla].forEach((campo) => campo.addEventListener("change", actualizarVistaPrevia));
  [elementos.campoCategoria, elementos.campoFrente, elementos.campoReverso, elementos.campoAlternativo].forEach((campo) => campo.addEventListener("input", actualizarVistaPrevia));

  elementos.campoImagen.addEventListener("change", async () => {
    const archivo = elementos.campoImagen.files && elementos.campoImagen.files[0];
    if (!archivo) return;
    elementos.estadoImagen.textContent = "Procesando imagen…";
    try {
      imagenFormularioDatos = await procesarImagen(archivo);
      elementos.estadoImagen.textContent = "Imagen optimizada y preparada para guardar.";
      actualizarVistaPrevia();
      elementos.campoAlternativo.focus();
      anunciarFormulario("Imagen añadida. Escriba ahora su descripción accesible.");
    } catch (error) {
      elementos.campoImagen.value = "";
      anunciarFormulario(error.message || "No se pudo procesar la imagen.", "error");
    }
  });

  elementos.retirarImagen.addEventListener("click", () => {
    imagenFormularioDatos = "";
    elementos.campoImagen.value = "";
    elementos.campoAlternativo.value = "";
    actualizarVistaPrevia();
    anunciarFormulario("La imagen fue retirada de la tarjeta.");
    elementos.campoImagen.focus();
  });

  elementos.formulario.addEventListener("submit", (evento) => {
    evento.preventDefault();
    if (!validarFormulario()) return;
    const idExistente = elementos.tarjetaId.value;
    const ahora = new Date().toISOString();
    const anterior = idExistente ? tarjetasPersonales.find((item) => item.id === idExistente) : null;
    const tarjeta = {
      id: idExistente || crearId(), origen: "personal", tipo: elementos.campoTipo.value, categoria: elementos.campoCategoria.value.trim(), plantilla: elementos.campoPlantilla.value, frente: elementos.campoFrente.value.trim(), reverso: elementos.campoReverso.value.trim(), imagen: imagenFormularioDatos, textoAlternativo: imagenFormularioDatos ? elementos.campoAlternativo.value.trim() : "", favorita: anterior ? anterior.favorita : false, fechaCreacion: anterior ? anterior.fechaCreacion : ahora, fechaActualizacion: ahora
    };
    const anteriores = [...tarjetasPersonales];
    if (idExistente) {
      const indice = tarjetasPersonales.findIndex((item) => item.id === idExistente);
      if (indice < 0) return;
      tarjetasPersonales[indice] = tarjeta;
    } else {
      tarjetasPersonales.unshift(tarjeta);
    }
    if (!guardarPersonales()) { tarjetasPersonales = anteriores; return; }
    refrescarColeccion();
    limpiarFormulario({ conservarMensaje: true });
    anunciarFormulario(idExistente ? "Los cambios se guardaron correctamente." : "La tarjeta multimedia se guardó y ya está disponible para practicar.", "exito");
  });

  elementos.limpiarFormulario.addEventListener("click", () => { limpiarFormulario(); elementos.campoTipo.focus(); });
  elementos.cancelarEdicion.addEventListener("click", () => { limpiarFormulario(); anunciarFormulario("Edición cancelada. Puede crear una tarjeta nueva."); elementos.campoTipo.focus(); });
  elementos.buscarPersonales.addEventListener("input", () => { renderizarBanco(); anunciarBanco(`${obtenerPersonalesFiltradas().length} tarjetas coinciden con la búsqueda.`); });
  elementos.filtroTipo.addEventListener("change", () => { renderizarBanco(); anunciarBanco(`${obtenerPersonalesFiltradas().length} tarjetas coinciden con el filtro.`); });
  elementos.soloFavoritas.addEventListener("change", () => { renderizarBanco(); anunciarBanco(`${obtenerPersonalesFiltradas().length} tarjetas coinciden con el filtro.`); });
  elementos.listaPersonales.addEventListener("click", (evento) => {
    const boton = evento.target.closest("button[data-accion][data-id]");
    if (!boton) return;
    const { accion, id } = boton.dataset;
    if (accion === "practicar") practicarTarjeta(id);
    if (accion === "favorito") alternarFavorita(id);
    if (accion === "editar") comenzarEdicion(id);
    if (accion === "duplicar") duplicarTarjeta(id);
    if (accion === "eliminar") eliminarTarjeta(id);
  });

  tarjetasPersonales = leerPersonales();
  actualizarVistaPrevia();
  refrescarColeccion();
})();
