# Auditoría CSS de riesgo mínimo

## Alcance

Esta auditoría establece la línea base para depurar `estilos.css` sin modificar la apariencia, el contenido ni el comportamiento de la portada del Ecosistema Virtual Accesible.

Repositorio: `crebeucayali/crebeucayali.github.io`

Rama de trabajo: `auditoria-css-prioridad-1`

Commit de referencia: `ae1564a62d0c9da9cf1964ef1e9ca5ba470919ce`

Archivos revisados:

- `index.html`
- `main.js`
- `estilos.css`
- `busqueda.json`
- `noticias-destacadas.json`

En esta etapa no se elimina, reordena ni modifica ninguna regla CSS utilizada por la página.

## Componentes identificados en index.html

### Cabecera

Selectores principales:

- `.cabecera-crebe`
- `.cabecera-interior`
- `.marca-crebe`
- `.marca-logo`
- `.marca-logo-img`
- `.marca-texto`
- `.marca-centro`
- `.pestanas-crebe`
- `.activo`

### Portada

Selectores principales:

- `.portal-crebe`
- `.hero`
- `.patron-portada`
- `.hero-contenido`
- `.etiqueta`
- `.subtitulo`

### Buscador y controles de accesibilidad

Selectores principales:

- `.contenido-central`
- `.herramientas-eva`
- `.herramientas-intro`
- `.etiqueta-herramientas`
- `.herramientas-panel`
- `.campo-busqueda-modulos`
- `.busqueda-linea`
- `.boton-limpiar-busqueda`
- `.sugerencias-busqueda`
- `.sugerencia-busqueda`
- `.mensaje-busqueda`
- `.lista-resultados-busqueda`
- `.controles-accesibilidad`
- `.control-accesibilidad`
- `.control-secundario`

### Módulos del ecosistema

Selectores principales:

- `.cuerpo-operativo`
- `.tarjetas`
- `.tarjeta`
- `.numero`
- `.boton`
- `.capacitaciones`
- `.banco`
- `.materiales`
- `.juegos`
- `.noti`
- `.repositorio`
- `.destacada`

### Noticias destacadas

Selectores existentes en el documento:

- `.noticias-destacadas`
- `.noticias-encabezado`
- `.noticias-etiqueta`
- `.noticias-carrusel`
- `.noticias-control`
- `.noticias-anterior`
- `.noticias-siguiente`
- `.noticias-viewport`
- `.noticias-pista`
- `.noticias-indicadores`

Las tarjetas, imágenes, contenidos e indicadores internos son creados posteriormente por `main.js`.

### Accesos complementarios

Selectores principales:

- `.accesos-complementarios-weebly`
- `.bloque-lineas`
- `.etiqueta-lineas`
- `.descripcion-lineas`
- `.lista-lineas`
- `.linea-item`
- `.boton-lineas`
- `.grid-accesos`
- `.accesos-participacion`
- `.tarjeta-acceso`
- `.firma-visita-acceso`
- `.enlace-acceso`

### Indicadores institucionales

Selectores principales:

- `.impacto-crebe`
- `.impacto-encabezado`
- `.impacto-etiqueta`
- `.impacto-carrusel`
- `.impacto-pista`
- `.impacto-tarjeta`

### Controles flotantes y pie de página

Selectores principales:

- `.boton-guia`
- `.volver-arriba`
- `.pie-crebe`
- `.pie-patron`
- `.pie-interior`
- `.pie-columna`
- `.pie-identidad`
- `.pie-contacto`
- `.pie-creditos`

## Selectores creados o activados desde main.js

Estos selectores no deben considerarse sin uso aunque no estén presentes de forma permanente en `index.html`.

### Resultados de búsqueda

- `.resultado-busqueda`
- `.grupo-resultados-busqueda`
- `.grupo-resultados-lista`

### Preferencias de accesibilidad

Clases añadidas al elemento `body`:

- `.texto-grande`
- `.texto-muy-grande`
- `.alto-contraste`

Estas clases dependen de `localStorage` y deben conservarse junto con todas sus reglas descendientes.

### Recorrido guiado

Elementos y estados creados dinámicamente:

- `.guia-overlay`
- `.guia-resaltado`
- `.guia-panel`
- `.guia-contador`
- `.guia-acciones`
- `.guia-anterior`
- `.guia-cerrar`
- `.guia-siguiente`
- `.guia-activa`

El recorrido también depende de estos objetivos existentes:

- `.cabecera-crebe`
- `.campo-busqueda-modulos`
- `.controles-accesibilidad`
- `.tarjetas`
- `.accesos-complementarios-weebly`
- `.firma-visita-acceso`
- `.pie-crebe`

### Carrusel de noticias

Elementos creados dinámicamente:

- `.noticia-tarjeta`
- `.noticia-media`
- `.noticia-contenido`
- `.noticia-categoria`
- `.noticia-enlace`
- `.noticias-indicador`

Estados aplicados durante el funcionamiento:

- `.activo`
- `.activa`
- `.vecina`
- `.vecina-izquierda`
- `.vecina-derecha`
- `.lejana`

Estos estados controlan el tamaño, la posición, la opacidad y la navegación del carrusel. No deben eliminarse mediante una revisión basada únicamente en el HTML inicial.

## Lista de protección obligatoria

Durante las siguientes etapas no se eliminarán ni renombrarán sin una prueba específica:

1. Selectores utilizados por `main.js`.
2. Selectores asociados con `alto-contraste`, `texto-grande` y `texto-muy-grande`.
3. Selectores de estados del carrusel.
4. Selectores del recorrido guiado.
5. Selectores dentro de reglas `@media` activas.
6. Selectores de foco, `:focus-visible`, `:hover`, `:disabled` y atributos ARIA.
7. Variables CSS definidas en `:root`.
8. Selectores que controlan anchos, desbordamientos, niveles `z-index` y posiciones `sticky` o `fixed`.

La lista también se conserva en `docs/selectores-protegidos.json` para facilitar verificaciones posteriores.

## Matriz de comprobación visual y funcional

Antes de eliminar o consolidar CSS se debe registrar el estado actual en los siguientes escenarios:

| Escenario | Verificación mínima |
|---|---|
| Escritorio, 1366 px | Cabecera, portada, tres columnas de módulos, carrusel, accesos, indicadores y pie |
| Tableta, 768 px | Navegación, dos columnas o reorganización prevista, carrusel y controles flotantes |
| Móvil, 360 px | Menú desplazable, una columna, texto sin cortes, botones accesibles y ausencia de desbordamiento horizontal |
| Texto grande | Legibilidad, alturas de tarjetas, botones y navegación |
| Texto muy grande | Reflujo, ausencia de superposiciones y acceso a todos los controles |
| Alto contraste | Texto, enlaces, tarjetas, noticias, líneas de acción y foco visible |
| Búsqueda | Consulta, sugerencias, resultados agrupados, botón limpiar y enlaces |
| Guía de recorrido | Apertura, siete pasos, teclas de dirección, tecla Escape, foco y cierre |
| Carrusel | Anterior, siguiente, indicadores, rotación automática, pausa por foco y puntero |
| Movimiento reducido | Ausencia de rotación automática cuando el sistema solicita reducir movimiento |

## Criterio para las siguientes fases

Una regla solo podrá eliminarse cuando se cumplan estas condiciones:

- no aparece en `index.html`;
- no es creada, consultada o activada por `main.js`;
- no forma parte de estados de accesibilidad o reglas responsivas;
- no es utilizada por otra página del repositorio;
- su eliminación no produce diferencias visuales o funcionales en la matriz de comprobación;
- el cambio se realiza en un commit independiente y reversible.

## Resultado de la prioridad 1

La línea base y los selectores protegidos quedan documentados. No se han realizado cambios sobre `estilos.css`, `index.html`, `main.js` ni los recursos visibles de la página. La siguiente fase podrá centrarse en identificar estilos obsoletos, manteniendo esta auditoría como referencia de seguridad.
