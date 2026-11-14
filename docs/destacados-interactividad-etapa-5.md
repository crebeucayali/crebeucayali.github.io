# EVA 2.0 - Etapa 5: interacción de tarjetas de Recursos destacados

Fecha de implementación: 13 de noviembre de 2026 (hora de Perú).
Alcance: exclusivamente `#recursos-destacados-eva` de la portada pública.

## Referencia de comportamiento

Se tomó como referencia la interacción de las tarjetas de módulos de EVA establecida en `eva-modulos-fotos.css`:
- reducción de la capa de color al interactuar, para descubrir la fotografía;
- cambio progresivo de escala y elevación de la tarjeta;
- signo "+" decorativo que gira y se convierte en "-";
- experiencia equivalente mediante enfoque del teclado;
- adaptación para pantallas táctiles y personas que prefieren movimiento reducido.

## Archivos

- `destacados-eva.js`: envuelve la imagen de cada recurso destacado en una superficie visual con un signo decorativo marcado `aria-hidden="true"`. Si falla la fotografía, retira solo esa superficie; se mantienen la tarjeta y su botón.
- `destacados-eva-interactivo.css`: archivo nuevo con estilos exclusivamente subordinados a `#recursos-destacados-eva` que aplican el efecto de interacción, soporte táctil, foco visible, contraste y movimiento reducido. Utiliza `::before` para extender el único enlace del botón a toda la tarjeta, sin interferir con `::after`, que ya es utilizado por `eva-botones-body.css` para su flecha circular.
- `index.html`: incorpora el CSS al final de la cascada con versión `v=2` e incrementa `destacados-eva.js` a `v=5`.

## Comportamiento

Al pasar el cursor, la tarjeta se desplaza 3 px hacia arriba, la capa cromática disminuye su opacidad, la imagen pasa de escala 1.12 a 1, y el signo + realiza una transición visual hacia -. El diseño de base (fotografía, título, descripción, procedencia y botón) permanece en su lugar.

Las tarjetas sin imagen conservan la información y permiten abrir el recurso. La navegación no depende de JavaScript de interacción: se aprovecha el único enlace ya existente y CSS. En táctiles la imagen permanece visible y no se exige un segundo toque. El enlace se conserva como nueva pestaña con `rel="noopener noreferrer"`.

## Alcance excluido

Sin cambios en `eva-modulos-fotos.css`, `estilos.css`, panel administrativo, Supabase, tablas, políticas ni repositorios de CAP, BDA o MEA. No se modifican el orden, visibilidad, límite de cuatro tarjetas ni fuentes de las imágenes.

## Verificación

- 17 comprobaciones automatizadas con DOM simulado y revisión estática aprobadas.
- JavaScript válido y CSS con bloques equilibrados.
- Fotos con contenedor, signo decorativo y texto alternativo.
- Compatibilidad con tarjetas sin imagen y errores de carga.
- Conservación de enlace único, destino válido y flecha circular existente.
- Media queries para dispositivos táctiles y `prefers-reduced-motion`; compatibilidad con modos de alto contraste.
- Referencias actualizadas en el HTML de la portada.

La verificación visual definitiva requiere revisar las tarjetas publicadas en un navegador real, en escritorio y móvil. Las pruebas automatizadas no sustituyen ese paso.
