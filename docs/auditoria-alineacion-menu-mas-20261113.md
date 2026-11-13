# Auditoría breve: alineación de accesos del menú Más (EVA 2.0)

Fecha: 13 de noviembre de 2026. Repositorio principal: `crebeucayali/crebeucayali.github.io`.

## Evidencia

En la captura móvil remitida después de la PR #40, los encabezados de grupos del submenú Más aparecen alineados a la izquierda, pero los enlaces Directorio, Entidades, Calendarios CREBE, Galería, Lecturas inclusivas, Guía de uso y Mapa web aparecen centrados. Los enlaces principales Inicio, Nosotros, Qué hacemos, Contacto e Iniciar sesión sí están alineados a la izquierda.

## Causa y alcance

El CSS de `eva-menu-responsive.css` define los enlaces del submenú como `display:flex`, pero no asegura `justify-content:flex-start` ni `text-align:left`. Estas propiedades pueden heredarse o quedar sustituidas por estilos preexistentes de enlaces de la navegación principal. La corrección se limita a `.cabecera-crebe .eva-mas-enlaces` y a sus enlaces, sin afectar los enlaces externos a Más.

## Corrección prevista

Aplicar alineación a la izquierda y ancho completo de cada fila de Más, conservar bordes, espaciado, colores, interacciones y cabecera, e incrementar la versión de caché de CSS a `v=8`. Añadir aserciones en las pruebas Playwright existentes para móvil y escritorio.

No se cambian el menú de autenticación, las rutas, el JavaScript, datos, Supabase ni el repositorio AC.
