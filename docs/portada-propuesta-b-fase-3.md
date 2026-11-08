# EVA - Propuesta B - Fase 3: adaptación del contenido principal

Fecha: 7 de noviembre de 2026 (Perú).

## Alcance autorizado y realizado

Se prepararon en `eva-layout.css` las reglas específicas de adaptación de los seis módulos y las secciones de EVA al futuro espacio principal de la portada, sin activar la distribución pública ni incluir contenido en la columna derecha.

- **Módulos CAP/BDA/MEA/NI/RA/DUA**: dos tarjetas por fila cuando se active el diseño; una por fila para anchuras de 700 px o menores. Se neutralizan únicamente en el contenedor activo los desplazamientos y columnas forzadas por reglas heredadas con `!important`.
- **Recursos y herramientas destacados**: rejilla de dos tarjetas, que pasa a una en tamaños estrechos.
- **Materiales de la semana**: cada diapositiva se prepara en una disposición vertical con imagen adaptable al ancho de columna; se conservan los tres materiales, el contador, las flechas y la pausa, sin modificar el script.
- **Aplicaciones**: rejilla preparada con dos tarjetas y un solo bloque en pantallas estrechas.
- **Noticias**: ancho del carrusel y visor expresado respecto al contenedor real, con tamaño flexible para tarjetas y sin cambios en su controlador JavaScript. Requiere comprobar la geometría real del cálculo y las transformaciones.
- **Líneas de acción, servicios y convenio**: las rejillas internas pasan a dos columnas donde corresponda y a una en pantallas estrechas, con medidas mínimas para evitar desbordamiento.
- **Indicadores de alcance institucional**: se evaluó su localización. Se conservan temporalmente **después** de `cuerpo-operativo` y a ancho completo para proteger la presentación de su carrusel y evitar que el cambio de anidamiento altere las reglas de ancho y el desplazamiento. Su posible traslado queda sujeto a pruebas visuales y una decisión posterior; no es necesario para activar una columna lateral desde los módulos.
- **Hero y buscador**: sin cambios, a ancho completo.

## Seguridad del cambio

Todas las reglas nuevas están delimitadas por `#eva-distribucion.eva-layout-activo`. El HTML de la rama **no contiene esa clase**. El lateral sigue vacío y oculto con `hidden`. Por eso, las nuevas reglas no se aplican a la vista inicial mientras no se active explícitamente la futura portada.

No se alteraron `main.js`, `destacados-eva.js`, `ra-materiales-semana.js`, `indicadores-eva.js`, `estilos.css` ni `estilos-original.css`; sus archivos mantienen el mismo SHA que `main`.

## Verificaciones estáticas

- Seis tarjetas de módulos presentes.
- Controles Anterior/Siguiente/Pausa de RA y controles de noticias presentes.
- IDs del HTML sin duplicados.
- CSS con llaves equilibradas y reglas de medios de escritorio/móvil presentes.
- Sin `eva-layout-activo` en HTML; columna lateral con `hidden`.
- Ninguna modificación o nueva consulta a Supabase.
- La rama `main` continúa siendo la versión pública.

## Pruebas que no se declaran aprobadas

No se dispone de un resultado visual confirmado del **diseño activado** en esta fase. Antes de permitir el merge/activación se deben comprobar navegador real a 1440, 1280, 1100, 1024, 768, 390 y 320 px y zoom al 200 %, revisar ausencia de scroll horizontal y funcionamiento de flechas, indicadores, foco, alto contraste y movimiento reducido, y verificar que no haya tarjetas truncadas.

La validación específica del carrusel de Noticias debe controlar que el desplazamiento calcule correctamente el ancho reducido al activarse el diseño. También se debe verificar que las secciones de contenido público permanezcan en el orden original.

## Siguiente fase

Fase 4: construir la columna lateral con información institucional real y acceso de solo lectura, manteniéndola oculta hasta las pruebas finales. No introducir contenido de ejemplo ni inventar fechas, y no crear tablas sin necesidad.

## Reversión

Si se decide descartar la adaptación, basta con eliminar el bloque CSS marcado como Fase 3 dentro de `eva-layout.css` en la rama; no requiere operaciones sobre bases de datos o archivos de contenido.
