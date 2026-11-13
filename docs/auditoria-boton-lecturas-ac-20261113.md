# Auditoría previa: botón de acceso de Lecturas inclusivas (AC)

**Fecha:** 13 de noviembre de 2026.  
**Repositorio principal:** `crebeucayali/crebeucayali.github.io`.  
**Base:** `main` (`77ee05f139f03007ceced93f9a923f4ae92bc8be`).  
**Alcance:** CTA «Leer artículo completo» dentro de `#eva-distribucion .eva-lecturas-destacada`. No se interviene en el repositorio `accesos-complementarios`, ni en rutas del artículo ni en la carga dinámica.

## Hallazgos en código

- `eva-lecturas-inclusivas.js` genera dinámicamente un enlace `<a class="eva-lectura-enlace">Leer artículo completo</a>` con URL del artículo validada para el origen y el directorio de Lecturas inclusivas.
- `eva-botones-body.css` asigna el diseño común de las llamadas a la acción: botón de contorno, esquinas rectas pequeñas (`border-radius:2px`), texto del color característico y flecha circular mediante `::after`. Al interactuar se rellena el botón y cambia a texto blanco.
- `eva-identidad-ac-ra.css` conserva la identidad ciruela AC (`#823b63`), pero una regla final específica sobre `.eva-lectura-enlace` impone `background:var(--eva-ac)!important` y `color:#fff!important` incluso en estado normal, cancelando el diseño de contorno previsto para los demás accesos. La regla posterior de hover y focus sí está alineada con el relleno.
- `eva-lecturas-inclusivas.css` se carga después, pero su declaración de relleno no lleva `!important`; la excepción de identidad AC prevalece.
- Las reglas genéricas de alto contraste deben permanecer intactas, y el ajuste debe usar las exclusiones existentes `html:not(.eva-alto-contraste) body:not(.alto-contraste)`.

## Decisión

Cambiar exclusivamente el estado normal del CTA AC a fondo transparente, borde/texto color ciruela. Mantener el relleno ciruela oscuro en hover/focus, flecha circular, borde y dimensiones del botón común, el enlace correcto y alto contraste.

## Verificación requerida

Prueba en Chromium con las hojas reales y en el orden de `index.html`, para tamaños 320/390/768/1280px, estados normal, hover, foco por teclado y alto contraste. Comprobar que un botón de otro módulo no cambia y que la URL del artículo no es alterada. Integrar únicamente si aprueba la verificación y cerrar documentalmente.

**Límites:** sin cambios de JavaScript, contenido editorial, Supabase, datos de artículos, navegación principal, otros módulos, permisos o accesibilidad global.
