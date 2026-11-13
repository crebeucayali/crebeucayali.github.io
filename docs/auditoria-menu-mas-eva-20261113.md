# Auditoría previa: menú «Más» y panel lateral derecho EVA 2.0

Fecha: 13 de noviembre de 2026. Repositorio: `crebeucayali/crebeucayali.github.io`. Base `main`: `ae9c5c2bd39cdd5e0108ea7ff7a122c17816178f`.

## Estado

- La navegación principal `#eva-nav-principal` tiene Inicio, Nosotros, Qué hacemos, Directorio, Entidades, Contacto y acceso administrativo.
- El menú actual bajo 1050 px ocupa todo el ancho y se despliega bajo la cabecera; en la captura enviada por el responsable ocupa gran parte de la pantalla en color azul.
- El CSS de menú está aislado en `eva-menu-responsive.css`, la lógica en `eva-menu-responsive.js`; el botón de sesión y su autenticación residen en otros archivos.
- El logo institucional ya se usa en la cabecera. Se puede reutilizar su URL para los encabezados de navegación, sin crear o descargar recursos.
- En AC ya existen destinos reales para Directorio, Entidades, Calendarios, Galería, Lecturas inclusivas, Guía de uso y Mapa web.

## Decisión solicitada

- Conservar la paleta actual azul verdosa del menú EVA y la identidad institucional.
- Mover la navegación móvil del formato de pantalla completa a un cajón que entra desde la derecha, con fondo atenuado sobre el contenido, botón visible de cierre y encabezado con logo institucional y «EVA 2.0».
- Conservar Inicio, Nosotros, Qué hacemos y Contacto como accesos directos, y mantener «Iniciar sesión» fuera de «Más».
- Ubicar bajo «Más» los enlaces reales: Directorio, Entidades, Calendarios CREBE, Galería, Lecturas inclusivas, Guía de uso y Mapa web.
- Disponer «Más» por clic/toque, no por hover; escritorio muestra panel lateral derecho con el mismo encabezado; móvil despliega opciones dentro del menú derecho, evitando una segunda capa móvil.
- Compatibilidad con Escape, clic fuera, teclado, aria-expanded, foco, modos de contraste alto y reducción del movimiento.
- Evitar cambios de sesión, permisos, Supabase o páginas externas.

## Validaciones

Pruebas reproducibles con Playwright para 320, 390, 768, 1024 y 1280/1440 px, apertura/cierre, posición a la derecha, logo y texto, grupos, enlaces correctos, teclado y contraste; regresión de autenticación (elemento y evento existentes). No modificar publicaciones, datos, ni el estilo global del contenido.

La validación humana de la apariencia real en Brave sigue siendo necesaria después de publicar.
