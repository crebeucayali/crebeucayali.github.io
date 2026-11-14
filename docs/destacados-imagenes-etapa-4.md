# EVA 2.0 - Recursos y herramientas destacadas - Etapa 4

Fecha: 13 de noviembre de 2026 (hora de Perú).
Alcance: portada pública de EVA, exclusivamente la sección Recursos y herramientas destacadas.

## Archivos modificados
- `destacados-eva.js`: admite imágenes históricas alojadas en GitHub institucional y nuevas imágenes públicas de `eva-publico/destacados/` en Supabase Storage; consulta `imagen_alt` y lo asigna como atributo alt sin insertar HTML dinámico.
- `index.html`: incrementa la versión de carga del script `destacados-eva.js` de v3 a v4.

## Seguridad y compatibilidad
Las URL de Storage se restringen al host de Supabase institucional y al prefijo exacto `/storage/v1/object/public/eva-publico/destacados/`, con un nombre de archivo de caracteres seguros y extensión JPG, JPEG, PNG o WebP. Se rechazan parámetros, fragmentos, subcarpetas y hosts diferentes en Storage. Las URL históricas de GitHub CREBE continúan admitidas con las extensiones de imágenes anteriores.
El texto alternativo se toma del campo `imagen_alt`. Si una imagen histórica no tiene descripción, se conserva el alt vacío, como en la implementación previa. Si una imagen falla al cargar, la tarjeta sigue mostrando su información y enlace.

## Exclusiones
No se modificaron los diseños y estilos de las tarjetas, enlaces, colores, estados, orden, límite de cuatro recursos ni sus reglas de visibilidad. No se modificaron el panel administrativo, Supabase, los módulos CAP/BDA/MEA ni otros repositorios. El efecto de revelación de imagen al pasar el cursor sigue reservado para la etapa 5.

## Pruebas realizadas
- Compilación del JavaScript sin errores.
- Validación de URL de Storage válida con descripción accesible.
- Compatibilidad con imágenes históricas de GitHub.
- Tarjetas sin imagen y texto alternativo vacío en registros históricos.
- Rechazo de URL externas, otras carpetas de Storage, extensiones no admitidas, subcarpetas y URL con parámetros.
- Conservación de enlace seguro de acceso, clasificación por módulo y petición limitada a cuatro recursos.
- Simulaciones de DOM y de API: 16 comprobaciones satisfactorias.

## Pendiente
La tabla institucional todavía no contiene URLs de imagen asociadas a sus cuatro registros actuales. La verificación visual real de una imagen servida desde Storage requiere cargar una imagen desde el panel Master AAL2, guardar y abrir Inicio en computadora/móvil. La validación en el navegador no se sustituye por las simulaciones de JavaScript.
