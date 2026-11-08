# EVA - Propuesta B - Fase 6: activación controlada y cierre técnico

Fecha: 8 de noviembre de 2026, hora de Perú.

## Alcance aprobado para integración
- Encabezado, hero shipibo y buscador conservados en ancho completo.
- Nueva distribución de dos columnas desde los módulos; contenido principal a la izquierda y actualidad EVA a la derecha.
- Columna lateral activa con tres consultas públicas GET: tres últimos materiales RA, tres noticias visibles y próximas actividades; accesos oficiales BDA, MEA, RA y firma de visita.
- En escritorio amplio se usan dos columnas y en dispositivos estrechos se apila la columna lateral después del contenido principal.
- Indicadores institucionales permanecen a ancho completo bajo la distribución.
- No hay migraciones ni cambios a RLS, autenticación, panel administrativo ni datos de Supabase.

## Verificación previa a la integración
- Pruebas Chromium reales y aisladas aprobadas: 1440, 1280, 1100, 1024, 768, 390 y 320 px, sin desplazamiento horizontal y con seis módulos, buscador y hero conservados.
- Interacciones de carruseles RA/Noticias, navegación focalizable y estilo de alto contraste comprobados.
- Pruebas de GET público con rol anónimo en Supabase y pruebas simuladas de fallos parciales.
- Capturas obtenidas y revisadas mediante artefactos de GitHub Actions.
- Se comprobó la activación automática sin inyectar clases en el test. Ejecución: https://github.com/crebeucayali/crebeucayali.github.io/actions/runs/42445077775.
- PR de integración: https://github.com/crebeucayali/crebeucayali.github.io/pull/24.

## Observaciones no bloqueantes y pendientes reales
- La fotografía institucional de «Mis rutinas» sigue pendiente por capturar y publicar en RA; el carrusel conserva su mensaje alternativo. No atribuir este defecto a la nueva portada.
- Pruebas de lector de pantalla físico, zoom de navegador al 200 y 400 % y pruebas manuales con dispositivos reales pendientes. No declarar conformidad WCAG integral.
- Se requieren comprobaciones de enlaces e imágenes reales una vez desplegado GitHub Pages. Las pruebas aisladas interceptaron algunas fuentes externas.
- Si aparece una regresión grave tras el despliegue, revertir el commit de integración de la rama principal y volver a ejecutar Pages. No tocar las tablas de Supabase.

## Mantenimiento
La columna toma datos publicados en RA, NI y calendario mediante acceso público, sin crear una nueva sección de panel. Para reflejar novedades se deben publicar primero en su fuente institucional correspondiente. Los rótulos «Registrado» se refieren a la fecha de creación del registro, no necesariamente a la fecha de publicación original.

## Estado
Implementación lista para integrar tras la aprobación del workflow aislado. La verificación de Pages en producción debe incorporarse en la supervisión posterior al merge.
