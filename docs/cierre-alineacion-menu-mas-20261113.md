# Cierre de corrección visual: enlaces del menú Más alineados a la izquierda

Fecha: 13 de noviembre de 2026. Repositorio principal de EVA `crebeucayali/crebeucayali.github.io`.

**Solicitud:** alinear los enlaces del submenú «Más» del mismo lado que las entradas principales «Inicio», «Nosotros» y «Qué hacemos», según la captura de la versión móvil en Brave.

## Diagnóstico y modificación

Los enlaces de «Más» se visualizaban centrados por la falta de propiedades explícitas de alineación en el diseño compartido del menú. Se ajustó de forma localizada `eva-menu-responsive.css` para que las filas dentro de `.eva-mas-enlaces` utilicen `justify-content:flex-start`, `text-align:left`, `width:100%` y `align-items:stretch` en el contenedor, sin eliminar su padding. Se actualizó la referencia `eva-menu-responsive.css?v=8` en `index.html` para renovar la caché.

Se conservan encabezados de grupos, enlaces, colores, logotipo, botón «Iniciar sesión», navegación principal y la lógica original de apertura/cierre.

**PR integrada:** https://github.com/crebeucayali/crebeucayali.github.io/pull/41  
**Commit de integración:** `4fe7936191517434ae0b83015b9d4e13f8e77ed4`.

## Validación

- Workflow [EVA - validar menú Más y cajón derecho](https://github.com/crebeucayali/crebeucayali.github.io/actions/runs/43518562317): aprobado. Verifica, entre otros elementos, las propiedades computadas de alineación izquierda y el ancho disponible en las opciones de «Más» para 320, 390, 768 y 1024 píxeles, además de escenarios de escritorio.
- Workflow [EVA - validar CTA de Lecturas inclusivas AC](https://github.com/crebeucayali/crebeucayali.github.io/actions/runs/43518562396): aprobado.
- Workflow [Validar Actualidad EVA](https://github.com/crebeucayali/crebeucayali.github.io/actions/runs/43518562340): fallo heredado de un test con versión de `eva-layout.css` obsoleta, independiente de esta corrección. No se declara éxito de toda la suite.
- La prueba inicial de anchura se afinó para comparar la anchura útil del contenedor, descontando su padding; no se cambió el estilo del menú para satisfacer una expectativa errónea.

**Estado:** integrado en `main` y verificado automáticamente. Pendiente confirmación visual del responsable en su navegador Brave tras publicarse la modificación. No se modificaron Supabase, datos, permisos ni otros repositorios.
