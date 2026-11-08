# EVA · Materiales de la semana · Fase 4

## Implementación (7 de noviembre de 2026)

Se añadió a la portada pública, inmediatamente después de "Recursos y herramientas destacadas" y antes de "Aplicaciones gratuitas de apoyo a la inclusión", una sección RA que muestra una única tarjeta grande a la vez, tomada de la programación semanal que prepara el panel administrativo.

### Archivos

- `index.html`: sección `#ra-semana-eva`, controles, descripción institucional y carga del nuevo JavaScript; actualización de versión de estilos para evitar caché.
- `estilos.css`: maquetación responsiva, imagen amplia, contraste alto, foco visible y reducción de movimiento.
- `ra-materiales-semana.js`: consulta de solo lectura a `ra_materiales_semana_publicos`, validación estricta de imágenes, creación de tres tarjetas, rotación cada ocho segundos y navegación accesible.

### Reglas

- Solo presenta datos expuestos por la vista pública de Supabase, que ya filtra publicaciones autorizadas del catálogo RA.
- La sección comienza oculta; permanece así si no hay un grupo válido o falla la consulta. No altera otros módulos.
- Si la programación actual vence sin reemplazo, utiliza el último grupo válido y cambia el encabezado a "Materiales destacados".
- Cada tarjeta incorpora título, fotografía accesible, descripción, enlace al catálogo RA y correo institucional para consultas.
- Las imágenes son de los materiales ya existentes; no hay nuevas subidas a Storage.
- Avance automático cada 8 segundos; controles Anterior, Siguiente, tres indicadores, Pausar/Reanudar; pulsar controles de navegación pausa la rotación.
- Se suspende mientras el usuario mantiene el cursor sobre la sección, interactúa con ella o el documento no está visible. Se respeta por defecto `prefers-reduced-motion`; el usuario puede reanudar expresamente.
- El cambio automático es silencioso para lectores de pantalla, mientras que la navegación manual puede anunciar el cambio.
- La interfaz responde a pantallas pequeñas y estilos de alto contraste de EVA.

### Verificaciones

- Programación real de Supabase: del 7 al 13 de noviembre de 2026, "Amplificador de imagen", "Máquina Perkins" y "Mis rutinas". La vista pública devolvió correctamente esa programación para el rol `anon`.
- Validación sintáctica del nuevo JavaScript satisfactoria.
- Comprobación estática de identificadores únicos, referencias completas, ubicación del bloque, temporización, acceso de solo lectura y respeto de movimiento reducido.
- No se modificaron los repositorios de panel administrativo ni de RA, ni tablas, políticas, ni archivos Storage.
- **Pendiente de validación en navegador real**: carrusel en móvil/escritorio, carga efectiva de las tres fotografías, teclado/lector de pantalla, pausa y comportamiento después del cambio semanal.
- La fase 5 abordará pruebas de integración y regresión; no se declara realizada.

### Reversión

Restaurar `index.html` y `estilos.css` a sus versiones anteriores y retirar el script `ra-materiales-semana.js` si fuera necesario. No revertir los datos ni la migración de las fases 2 y 3.

### Consumo

Una petición de lectura inicial por carga de portada y las tres imágenes existentes. Cambiar de tarjeta no genera nuevas consultas a Supabase.
