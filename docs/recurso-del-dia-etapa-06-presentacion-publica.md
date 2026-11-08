# Etapa 06 - Presentación pública del recurso de hoy y de ayer en EVA

Fecha de implementación: 8 de noviembre de 2026. Alcance: portada de EVA en `crebeucayali/crebeucayali.github.io`.

## Distribución implementada

- **Columna gruesa:** "El recurso del día" inmediatamente después de los seis módulos principales y antes de "Recursos y herramientas destacadas". Se muestra solamente cuando existe un registro aprobado para la fecha actual de Perú.
- **Columna delgada:** "El recurso de ayer" como primer bloque debajo de la cabecera de "Explora y mantente al día". Se muestra únicamente si existe un registro aprobado para la fecha anterior.
- **Celular (hasta 700 px):** primero seis módulos, luego recurso de hoy, después toda la columna Actualidad EVA con el recurso de ayer en primer lugar y finalmente las restantes secciones de la columna principal. El orden se controla por CSS sin duplicar contenido.
- Se mantiene anclaje progresivo de la columna lateral en escritorio a partir de 1051 px. Ningún bloque tiene scroll interno.
- Ambos bloques se ocultan completamente, sin mensajes ni espacios vacíos, cuando no hay recursos aprobados o hay errores de consulta.

## Contenido

Cada tarjeta presenta imagen o imágenes ARASAAC (de uno a tres identificadores), título aprobado, descripción pedagógica, fecha en español, créditos visibles (Sergio Palao, ARASAAC, Gobierno de Aragón y CC BY-NC-SA 4.0) y enlaces a MEA, ARASAAC y la licencia. Los textos se insertan por `textContent` y nunca se construye HTML a partir de respuestas de Supabase. Las imágenes se cargan únicamente desde `static.arasaac.org` con rutas generadas a partir de IDs numéricos validados; si fallan, se presenta un texto alternativo.

Las ilustraciones de LSP NO se habilitan: la etapa 05 bloquea su programación hasta verificarse los derechos de republicación MINEDU. El selector LSP del panel administrativo sigue disponible solo para borradores.

## Datos y seguridad

- Vista hoy: `public.eva_recurso_dia_publico` (etapa 05).
- Vista ayer: `public.eva_recurso_ayer_publico`, creada y versionada en el repositorio `crebeucayali/accesos-complementarios`, migración `20261108165134_eva_recurso_dia_etapa_06_vista_ayer_segura`.
- RLS para `anon` limitada a ARASAAC aprobado de hoy y ayer según `(now() at time zone 'America/Lima')::date`. Los borradores, fechas anteriores, futuras y LSP no son visibles.
- Ambas vistas `security_invoker=true`. El navegador solo usa la clave publicable existente, `credentials: omit`, métodos GET y `cache: no-store`.
- La página comprueba cambio de fecha por minuto sin hacer consultas repetidas a Supabase; consulta solo cuando cambia la fecha peruana o al abrir/reanudar la página. Incluye actualización explícita para validaciones.
- Se amplió la CSP de la portada únicamente para admitir imágenes de `https://static.arasaac.org`. No se añadieron fuentes externas de scripts, accesos administrativos ni permisos de escritura.

## Pruebas

Suite de navegador Chromium con 21 escenarios: tres conjuntos de datos (hoy y ayer, ninguno, solo ayer) en siete anchos (1440, 1280, 1100, 1024, 768, 390 y 320 px). Se verificaron visibilidad condicional, nombres, descripciones, número de imágenes, textos alternativos, créditos, enlaces, orden móvil, ausencia de overflow y mantenimiento de anclaje progresivo en escritorio con la tarjeta visible.

Regresión adicional de portada original: siete anchos, seis módulos intactos, materiales de la semana, noticias, accesibilidad y scroll sticky. Todas las pruebas aprobaron en la ejecución https://github.com/crebeucayali/crebeucayali.github.io/actions/runs/42503074057 .

SQL en Supabase: se insertaron temporalmente hoy, ayer, borrador de fecha anterior y borrador futuro, y se comprobó lectura segura por rol `anon`. Se revirtieron completamente los registros con `ROLLBACK`. La base final permanece con **cero registros reales y cero recursos visibles**. No se publicaron señas ni pictogramas de muestra.

## Fuera de alcance (etapa 07)

Validación humana con programación real, revisión editorial y pedagógica de recursos concretos, licencias de imágenes LSP, comprobación visual final con material verdadero, aprobación de activación institucional. El despliegue del componente público no implica que existan publicaciones aprobadas: permanece oculto mientras no se programe ningún recurso.

## Archivos

- `index.html`: dos contenedores, carga de scripts/estilos y CSP.
- `eva-recurso-dia.js`: consulta pública, renderizado seguro y comprobación de cambio de fecha.
- `eva-recurso-dia.css`: tamaños, contraste, organización de columnas y separación.
- `tests/eva-recurso-dia-etapa6-browser.cjs`: escenarios de hoy/ayer/vacío.
- `.github/workflows/eva-recurso-dia-etapa6.yml`: pruebas y regresión visual.
