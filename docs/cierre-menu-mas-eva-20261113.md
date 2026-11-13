# Cierre: menú Más y cajón lateral derecho de EVA 2.0

**Fecha:** 13 de noviembre de 2026 (Perú).  
**Repositorio:** `crebeucayali/crebeucayali.github.io` (principal).  
**Auditoría previa:** `docs/auditoria-menu-mas-eva-20261113.md`, commit `d479ca3fa4d8a6215163ac1032108a253aa0daef`.  
**PR:** https://github.com/crebeucayali/crebeucayali.github.io/pull/40  
**Merge a `main`:** `ec37c0291021b77bc931a0e527d338350f08918e`.

## 1. Resultado

Se implementó el menú «Más» por clic/toque dentro de la navegación principal, conservando la paleta azul verdosa de EVA.

- **Móviles:** el menú principal se abre desde la derecha como cajón lateral, con fondo atenuado, botón de cierre, logo institucional y título «EVA 2.0» en su cabecera. «Más» despliega las opciones dentro del mismo cajón, sin un segundo panel superpuesto.
- **Escritorio:** el botón «Más» despliega un cajón lateral derecho con logo institucional, «EVA 2.0», botón de cierre y enlaces agrupados.
- **Enlaces en Más:** Directorio, Entidades, Calendarios CREBE, Galería, Lecturas inclusivas, Guía de uso y Mapa web. Todos reutilizan rutas públicas previamente existentes en Accesos Complementarios (AC).
- **Accesos directos:** Inicio, Nosotros, Qué hacemos, Contacto y el control Iniciar sesión permanecen independientes y visibles en el menú.
- **Interacción accesible:** expansión con `aria-expanded` y `aria-controls`, Escape, cierre por botón o clic en fondo, circulación del foco, alto contraste y reducción del movimiento.
- Se actualizó el versionado de caché `eva-menu-responsive.css?v=7` y `eva-menu-responsive.js?v=2`.

## 2. Validaciones

| Workflow | Resultado | Referencia |
| --- | --- | --- |
| EVA - validar menú Más y cajón derecho | **Aprobado** | https://github.com/crebeucayali/crebeucayali.github.io/actions/runs/43517634174 |
| EVA - validar CTA de Lecturas inclusivas AC (regresión) | **Aprobado** | https://github.com/crebeucayali/crebeucayali.github.io/actions/runs/43517634228 |
| Validar Actualidad EVA | **Fallo heredado, no relacionado con esta intervención** | https://github.com/crebeucayali/crebeucayali.github.io/actions/runs/43517634278 |

La prueba específica usa Chromium en 320, 390, 768, 1024, 1280 y 1440 px. Verifica posición y anchura del panel derecho, logo, grupos, siete enlaces y destinos, apertura de «Más», cierre con Escape, clic y botones, ausencia de desplazamiento horizontal, accesibilidad y permanencia del botón de inicio de sesión. Se detectó y corrigió un desbordamiento de 10 px causado por suma de padding a la anchura de la cabecera en 320 px.

El workflow «Validar Actualidad EVA» ya fallaba antes de esta etapa debido a una aserción desactualizada que exige `eva-layout.css?v=9` cuando `main` utiliza `v=10`. No se modificó el test heredado por estar fuera de alcance. **No se presenta la suite completa como aprobada.**

## 3. Archivos y límites

Archivos de implementación: `index.html`, `eva-menu-responsive.css` y `eva-menu-responsive.js`. Se agregó la prueba `tests/eva-menu-mas.browser.mjs`, su workflow y la auditoría previa.

No se alteraron Supabase, sesiones, permisos, MFA, contenido de artículos, métricas, repositorios secundarios ni funciones de administración.

## 4. Estado

**Integrado en `main`, verificado por las pruebas específicas y con cierre documental.** Queda pendiente comprobar la presentación en el teléfono del responsable una vez actualizado GitHub Pages y confirmar el comportamiento del menú en Brave. Si se detecta un problema visible, la corrección deberá delimitarse a la navegación afectada.
