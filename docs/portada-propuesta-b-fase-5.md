# EVA - propuesta B: fase 5, pruebas integrales aisladas

Fecha de revisión: 7 de noviembre de 2026, hora de Perú (ejecuciones GitHub Actions UTC: 8 de noviembre).
Rama probada: `feature/eva-portada-columna-lateral-fase2`.
Versión de rama sometida a la segunda prueba: `bd319697636f0abbb984a1ac481d9e8894cf8e83`.

## Alcance

Se realizaron pruebas de navegador Chromium real en un entorno local temporal de GitHub Actions. Las pruebas no publican a GitHub Pages y no modifican datos de Supabase. Para resultados reproducibles, las consultas REST se interceptaron mediante respuestas simuladas con la estructura de los datos institucionales; las fuentes y privilegios `anon` se verificaron independientemente en Supabase.

## Evidencias

- Ejecución inicial de diseño y siete resoluciones: https://github.com/crebeucayali/crebeucayali.github.io/actions/runs/42444679128 . Estado: `success`.
- Ejecución ampliada con interacciones de RA, Noticias, enfoque y alto contraste: https://github.com/crebeucayali/crebeucayali.github.io/actions/runs/42444775095 . Estado: `success`.
- Archivo reproducible de pruebas: `tests/eva-portada-fase5-browser.cjs`.
- Workflow aislado: `.github/workflows/eva-portada-fase5.yml` (ejecuta solo en la rama de pruebas, nunca publica Pages).
- Artefacto de la segunda ejecución: `eva-portada-fase5-browser`, con capturas PNG por ancho y archivo JSON de resultados; accesible desde la ejecución de Actions.

## Resultados satisfactorios

1. Diseño en resoluciones de 1440, 1280 y 1100 px: dos columnas, sidebar lateral derecho de 280 px, sin desbordamiento horizontal.
2. Resoluciones de 1024, 768, 390 y 320 px: columna lateral apilada después del contenido principal, sin desbordamiento.
3. Banner shipibo y buscador permanecen por encima de ambas columnas.
4. Seis tarjetas de los módulos institucionales conservadas dentro del contenedor principal.
5. Carga de las tres secciones dinámicas de la barra lateral y controles existentes en el HTML.
6. Carrusel RA: botón Siguiente cambia de material, navegación manual pausa la rotación y botón Reanudar funciona.
7. Carrusel Noticias: navegación de Siguiente y actualización del indicador de noticia activa.
8. Enlaces laterales admiten foco; estilos de alto contraste aplican fondo negro a bloques.
9. Preferencia `prefers-reduced-motion: reduce` utilizada en la ejecución.
10. Sin excepciones JavaScript no controladas en las siete resoluciones.
11. Pruebas unitarias con DOM simulado del módulo lateral: no consulta mientras está inactivo, realiza tres GET al activar, evita duplicados de inicialización, filtra URL insegura y aísla fallos de red por bloque.
12. Validación SQL previa de las tres fuentes con rol `anon`: RA, Noticias y Calendario (lectura pública).

## Alcance de las simulaciones

La prueba de navegador usó un servidor local en GitHub Actions y datos simulados para consultas públicas. Los scripts y recursos alojados en dominios externos distintos del servidor local fueron bloqueados para aislar el diseño bajo prueba. En consecuencia, esta prueba no constituye una certificación de integración con todos los componentes externos en producción.

## Pendientes de validación humana / limitaciones

- Revisión de las capturas conservadas en Actions para descartar detalles de alineación que no se deduzcan de las medidas.
- Lector de pantalla real, recorrido completo del tabulador y comprobación auditiva de anuncios, que no se sustituyen por los tests de foco.
- Contraste cromático medido frente a criterios WCAG, ampliación real del navegador al 200 % y 400 %, y pruebas en dispositivos físicos.
- Confirmación visual con imágenes y enlaces reales de todos los módulos; el entorno de pruebas interceptó solicitudes externas.
- Fotografía del material RA «Mis rutinas»: continúa pendiente de captura y publicación, observación ajena a esta reorganización.
- Comprobación de las operaciones del panel administrativo tras la integración; este repositorio no las modificó.

## Dictamen

**Fase 5: comprobaciones automatizadas satisfactorias.** No se detectaron regresiones en las rutas cubiertas y no se requirió modificar los scripts existentes. **No declarar validación humana integral ni habilitar el despliegue definitivo** antes de evaluar los pendientes de integración real y accesibilidad.

La columna lateral sigue con atributo `hidden`, la clase `eva-layout-activo` no existe en el HTML y `main` permanece sin cambios.

## Fase 6

La activación pública requiere revisión final de las capturas, pruebas de integración real y aprobación del responsable. Solo entonces se debe retirar `hidden`, incorporar `eva-layout-activo` e invocar `window.EvaColumnaLateral.iniciar()` antes de integrar en `main`. Mantener plan de reversión de archivos y comprobar el despliegue.
