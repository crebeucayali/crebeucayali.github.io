# Portada EVA - Propuesta B - Fase 2: preparación estructural

Fecha: 7 de noviembre de 2026, hora de Perú.

## Alcance ejecutado

Se preparó la distribución futura a dos columnas **únicamente en la rama** `feature/eva-portada-columna-lateral-fase2`. La portada pública en `main` continúa sin modificaciones por esta fase.

- `index.html`: el contenedor original `cuerpo-operativo` ahora identifica `#eva-distribucion` y aloja `#eva-columna-principal`, que envuelve las secciones existentes desde los seis módulos hasta los servicios complementarios; se añadió `#eva-columna-lateral` como `aside` vacío, oculto mediante `hidden`.
- `eva-layout.css` (nuevo): hoja CSS específica para esta distribución. En estado inicial, `display:contents` mantiene las secciones existentes en el flujo del contenedor original. Solo cuando se habilite explícitamente la clase `eva-layout-activo` se aplicará la rejilla de columna principal más columna lateral de 260-280 px, con separación de 24 px. A 1050 px o menos se prepara una sola columna.
- No se añade contenido ficticio ni conexiones nuevas a Supabase, no se crean tablas y no se altera el panel administrativo.
- El encabezado, el banner shipibo y el buscador permanecen fuera de la nueva distribución, a ancho completo.
- El bloque de indicadores institucionales sigue fuera de `cuerpo-operativo`; su incorporación a la columna principal deberá evaluarse en fase 3, considerando sus carruseles y anchuras.

## Estado de publicación

**No activar todavía** la clase `eva-layout-activo` ni retirar `hidden` del lateral. La activación pública debe esperar a la adaptación de las tarjetas y carruseles, la conexión de contenido real, las pruebas integrales y la aprobación final.

## Validaciones realizadas

1. Comparación automática: al retirar exclusivamente los envoltorios nuevos y la referencia CSS, el `index.html` de la rama coincide exactamente con el `index.html` de `main` obtenido durante esta intervención.
2. Todos los identificadores originales del HTML están presentes; no existen identificadores HTML duplicados.
3. La barra lateral nueva está vacía, oculta y sin consultas adicionales.
4. La clase de activación no aparece en el HTML; el diseño público existente no se habilita automáticamente.
5. La cantidad de elementos `script` permanece idéntica a la del HTML original.
6. No se han modificado `main.js`, `destacados-eva.js`, `ra-materiales-semana.js`, `estilos.css`, `estilos-original.css` ni otros scripts.

## Limitaciones y pruebas pendientes

El contenido envolvente tiene inicialmente `display:contents` para preservar la distribución heredada hasta la activación. En fase 3 debe verificarse su comportamiento real en navegador y con tecnologías de apoyo antes de considerar su incorporación a `main`.

Pruebas pendientes: navegador de escritorio, tableta y móvil; ampliación del texto; buscador y seis enlaces; recursos destacados; carruseles RA, Noticias e Indicadores; movimientos reducidos; navegación por teclado; ausencia de desbordamiento horizontal; y preservación de la semántica de los elementos.

## Siguiente fase

Fase 3: adaptar selectivamente las tarjetas de módulos y componentes internos a la columna principal, sin activar el lateral dinámico. Evaluar también la ubicación de `impacto-crebe`, la anchura fija del carrusel de noticias y las reglas con `!important` de las hojas existentes. Todo ello debe continuar en la misma rama hasta obtener resultados satisfactorios.

## Regreso a versión anterior

Al no modificar `main`, basta con descartar la rama de preparación si se decide no continuar. Si eventualmente se integrara, retirar los tres envoltorios de `index.html`, su referencia a `eva-layout.css` y el archivo CSS nuevo; los scripts y datos originales permanecen intactos.
