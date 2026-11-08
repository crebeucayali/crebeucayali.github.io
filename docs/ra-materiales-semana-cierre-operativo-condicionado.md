# EVA - Materiales de la semana: cierre operativo condicionado (fases 5 y 6)

Fecha: 7 de noviembre de 2026 (hora de Perú).

## Dictamen

La función "Materiales de la semana" puede seguir en operación y administrarse desde el panel CREBE. El usuario confirmó su visualización satisfactoria en escritorio y móvil y el avance automático. El cierre documental no significa que toda la matriz de accesibilidad o todas las imágenes estén aprobadas. **No declarar validación integral definitiva** hasta completar los pendientes descritos.

## Estado verificado

- Fases 1 a 4: arquitectura, estructura de programación y seguridad, subpestaña administrativa y carrusel público implementados.
- Programación real verificada: id 15, del 07/11/2026 al 13/11/2026, estado `programado`.
- Tres recursos asociados: Amplificador de imagen (id 5), Máquina Perkins (id 7), Mis rutinas (id 15).
- Supabase expone por la vista pública un solo grupo válido; se comprobó con rol `anon` lectura sin privilegios de escritura.
- Consultas transaccionales revertidas verificaron el cambio de etiqueta a `Materiales destacados` cuando vence la semana y la exclusión pública de un material archivado.
- Archivo principal de GitHub Pages compilado/desplegado satisfactoriamente; sintaxis y conexiones del nuevo módulo verificadas.
- La portada conserva los demás bloques y los 21 materiales originales de RA.
- El usuario corroboró visualización en escritorio y teléfono y rotación automática.

## Incidencia abierta: RA-SEM-IMG-001

**Material:** Mis rutinas (id 15).

**Síntoma:** la tercera tarjeta presenta "Fotografía temporalmente no disponible".

**Causa verificada:** el catálogo apunta a `assets/imagenes/materiales-elaborados/mis-rutinas.webp`, inexistente en el repositorio RA. No se localizó un objeto con ese nombre en Supabase Storage.

**Decisión institucional:** se tomará posteriormente una fotografía real del material. No se debe inventar ni insertar una imagen genérica y no se modificará la selección semanal por esta incidencia. El texto alternativo y la descripción permanecen disponibles; el carrusel sigue operativo.

**Para resolverlo cuando se disponga de la foto:**
1. Capturar una fotografía real, legible, sin información personal ni personas identificables, con buen contraste.
2. Incorporarla al material "Mis rutinas" mediante el procedimiento de edición del catálogo RA; actualizar `imagen_url` para apuntar al recurso real y verificar `imagen_alt`.
3. Comprobar que el archivo esté públicamente accesible y que el carrusel muestre la fotografía correctamente en escritorio y celular.
4. Repetir la comprobación de tres imágenes y cerrar la observación RA-SEM-IMG-001. Si se usa una URL nueva, revisar su compatibilidad con la validación estricta de orígenes del módulo público.

## Pruebas pendientes, no presentadas como aprobadas

- Pulsar Anterior, Siguiente y Pausar/Reanudar en navegador real.
- Navegar por teclado y comprobar que el foco no salta inesperadamente.
- Probar `prefers-reduced-motion` y lector de pantalla.
- Comprobar las tres fotografías; actualmente solo dos rutas existen.
- Repetir revisión de regresiones de los demás módulos tras futuros cambios.

## Operación semanal

1. Ingresar con cuenta `master` y MFA AAL2.
2. Ir a Repositorio > Materiales de la semana.
3. Seleccionar tres materiales distintos, publicados y con foto, descripción y texto alternativo.
4. Elegir periodo de hasta siete días, previsualizar y guardar como `programado`.
5. Comprobar en EVA; si no existe nueva semana, el último grupo válido puede permanecer como `Materiales destacados`.
6. No duplicar imágenes ni programar periodos superpuestos.
7. Registrar incidencias; mantener respaldos habituales del sistema y seguimiento de consumo Supabase.

## Control de cambios

Este documento registra el cierre operativo condicionado. No altera imágenes, materiales, programación, RLS, diseño del carrusel ni otros repositorios. No se realiza corrección anticipada de la fotografía.
