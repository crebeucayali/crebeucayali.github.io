# EVA: propuesta B, fase 4 - Columna de actualidad institucional

Fecha: 7 de noviembre de 2026.

## Alcance implementado

En la rama `feature/eva-portada-columna-lateral-fase2` se preparó la columna editorial a la derecha con cuatro bloques:

1. **Últimos recursos publicados**. Lectura de `repositorio_recursos`, exclusivamente visibles y publicados, tres registros ordenados por `created_at` e `id`. Enlace al catálogo RA; la fecha exhibida se etiqueta "Registrado", sin afirmar que sea la fecha de lanzamiento.
2. **Novedades institucionales**. Lectura de `noticias_destacadas`, tres registros visibles y publicados; enlace individual si su URL es HTTPS en `crebeucayali.github.io`, o enlace general al módulo NI. La fecha de alta se etiqueta "Registrado".
3. **Accesos rápidos**. Cuatro enlaces oficiales estáticos: BDA, MEA, RA y Firma tu visita.
4. **Próximamente**. Lectura de `calendario_publico`, máximo tres actividades con fecha presente o futura en la zona horaria `America/Lima`, ordenadas cronológicamente. Muestra el texto institucional disponible y la fecha; enlace al calendario.

Los datos se introducen con nodos de texto, no con HTML sin procesar. Se validan URLs de noticias y se usan únicamente la clave pública y GET, sin sesiones de administrador ni funciones con permisos elevados. Cada listado maneja datos vacíos y problemas de conexión por separado.

## Archivos

- `index.html`: contenido semántico de las cuatro secciones en `#eva-columna-lateral`, referencia al script; actualización de la versión de `eva-layout.css`.
- `eva-columna-lateral.js` (nuevo): tres consultas de solo lectura con límite de 3 registros cada una, procesamiento defensivo, fechas Lima, enlaces validados y mensajes de error.
- `eva-layout.css`: estilos de la columna, contraste, foco visible y apilamiento responsive.

## Bloqueo de activación

El `aside` todavía incluye el atributo `hidden` y el HTML aún no incorpora `eva-layout-activo`. La función `window.EvaColumnaLateral.iniciar()` también comprueba ambos requisitos antes de iniciar consultas. En consecuencia, **la portada actual no incorpora esta columna ni ejecuta peticiones extra**.

En la fase de activación se tendrá que habilitar el diseño y retirar `hidden` antes de invocar `window.EvaColumnaLateral.iniciar()`. Ese paso queda fuera de esta fase 4. No se ha hecho merge a `main` ni se ha solicitado despliegue de GitHub Pages.

## Comprobaciones realizadas

- Sintaxis del JavaScript nuevo satisfactoria.
- Marcado HTML: los cuatro bloques e identificadores presentes y únicos.
- Reglas CSS con llaves equilibradas, selectores específicos y diseño móvil.
- La columna sigue oculta y la clase de activación ausente.
- Sin llamadas de escritura, tablas nuevas ni modificaciones a Supabase.
- Consultas SQL como rol `anon` exitosas: 3 recursos RA, 3 noticias y 2 actividades futuras en el momento de la comprobación.
- Los scripts originales de buscador, noticias, RA y destacados conservan sus archivos.

## Pendientes de la fase 5

Validar en navegador el diseño activado **únicamente en entorno de prueba**: diseño y orden del contenido, tamaños de 320 a 1440 px, zoom 200 %, navegación por teclado, contraste, lectores de pantalla, enlaces, errores de red, actualización de listas y ausencia de desbordamiento. Comprobar de manera especial la geometría de los carruseles existentes y la ubicación de indicadores, conservados a ancho completo.

## Reversión

Como el trabajo está aislado en una rama de desarrollo, puede descartarse sin modificar la versión pública. La reversión puntual de fase 4 consiste en restaurar el `aside` vacío y oculto, retirar la referencia al script, y eliminar el CSS adicional y `eva-columna-lateral.js`.
