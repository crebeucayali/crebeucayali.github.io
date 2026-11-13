# Cierre técnico: botón de acceso de Lecturas inclusivas AC

**Fecha:** 13 de noviembre de 2026, Perú.  
**Sitio:** EVA, repositorio principal `crebeucayali/crebeucayali.github.io`.  
**Área:** `Lecturas inclusivas · Accesos Complementarios (AC)`.  
**Auditoría previa:** `docs/auditoria-boton-lecturas-ac-20261113.md`, commit `2272da25acc06b6d5a55ac51c30a27a859d4f2cb`.  
**PR:** https://github.com/crebeucayali/crebeucayali.github.io/pull/39  
**Integración a `main`:** `33f96d032794d533d9eb6da17adf58c435eb6aa9`.

## 1. Diagnóstico y corrección

El botón `Leer artículo completo` usa `.eva-lectura-enlace` generado por `eva-lecturas-inclusivas.js`. La hoja común `eva-botones-body.css` establece contorno, flecha circular y fondo del color de módulo únicamente al interactuar. Una regla especial al final de `eva-identidad-ac-ra.css` imponía el fondo ciruela y texto blanco desde el estado de reposo, motivo de la diferencia de diseño con los demás accesos.

Se sustituyeron únicamente los valores del estado normal por fondo transparente, borde/texto ciruela `#823b63`. Se conserva el relleno ciruela oscuro `#682c4e` y texto blanco al hacer hover o foco, además del tamaño, borde rectangular y flecha circular genéricos. Se versionó `eva-identidad-ac-ra.css?v=5` en `index.html` para renovar caché.

No se cambió JavaScript, el contenido de las lecturas, la URL de artículos, Supabase ni otros módulos.

## 2. Verificación

- **Workflow específico:** [EVA - validar CTA de Lecturas inclusivas AC](https://github.com/crebeucayali/crebeucayali.github.io/actions/runs/43513001022), aprobado en la versión finalmente integrada `8539b034c66ddcebdd7fe33559360158d1ad0175`.
- Prueba Chromium: resoluciones 320, 390, 768 y 1280 píxeles. Valida borde ciruela, fondo transparente, texto ciruela, flecha circular, hover, foco de teclado, alto contraste y ausencia de desbordamiento. Comprueba que el botón RA conserve su estilo computado previo, sin editarlo.
- Auditoría de alcance: archivos modificados únicamente `eva-identidad-ac-ra.css`, `index.html`, nueva prueba `tests/eva-lectura-cta.browser.mjs`, su workflow y documento de auditoría.
- **Regresión heredada identificada:** el workflow [Validar Actualidad EVA](https://github.com/crebeucayali/crebeucayali.github.io/actions/runs/43513000937) falló por una aserción desactualizada en `tests/eva-lateral.test.mjs` que exige `eva-layout.css?v=9`, mientras la portada existente ya usa `v=10`. No fue causada por esta corrección, no se cambió el test heredado y el fallo queda documentado como incidencia independiente; por eso **no se declara que toda la suite de EVA haya aprobado**.

## 3. Estado final y validación pendiente

**Corrección visual implementada e integrada en `main`, con prueba específica aprobada.**

La revisión visual en el navegador del responsable tras la publicación de GitHub Pages aún está pendiente. Debería mostrar el enlace de lectura con contorno ciruela, flecha circular y relleno solo al interactuar. El trabajo no altera otros estilos ni registros de EVA.
