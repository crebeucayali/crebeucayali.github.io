# EVA 2.0 - Actualización funcional y documental

**Proyecto:** Ecosistema Virtual Accesible (EVA)  
**Denominación de versión:** EVA 2.0  
**Fecha de referencia:** 8 de noviembre de 2026  
**Repositorio principal:** `crebeucayali/crebeucayali.github.io`  
**Módulo administrativo:** `crebeucayali/accesos-complementarios`

## 1. Alcance

La denominación **EVA 2.0** identifica la actualización del ecosistema con las recientes mejoras de la portada, integración de recursos educativos, gestión administrativa y presentación accesible de contenidos. Es una identificación documental de la versión y no una afirmación de que todos los módulos estén completamente cerrados o certificados.

EVA conserva su organización modular: CAP (capacitaciones), BDA (Banco Digital Accesible, incluida LSP), MEA (materiales educativos accesibles, pictogramas y recursos de apoyo), NI (noticias inclusivas), RA (repositorio de materiales) y DUA 3.0. AC mantiene su carácter complementario y reúne accesos y gestión administrativa.

## 2. Implementaciones de la actualización

### Portada y experiencia de usuario

- Distribución de la portada en una columna principal y una columna secundaria de actualidad.
- Sección **«El recurso del día»** en la columna principal, después de los accesos a módulos y antes de los recursos destacados.
- Sección **«El recurso de ayer»** en la columna secundaria, condicionada a que exista un registro aprobado de la fecha correspondiente.
- La tarjeta principal del recurso diario utiliza una disposición en **dos columnas de aproximadamente 50 %**: imagen ampliada a un lado y texto, fecha, atribución y enlaces al otro. En pantallas estrechas la disposición se apila. La imagen admite una altura máxima de 380 px.
- Conservación del comportamiento adaptable, de las opciones de alto contraste y de la ocultación de tarjetas sin datos publicables.

### «Recursos del día»: programación y fuentes

- Programación por fecha de Perú (`America/Lima`), con presentación del recurso de hoy y del anterior.
- Integración de pictogramas oficiales ARASAAC y del catálogo de señas LSP incluido en el BDA.
- Formulario administrativo con fecha, fuente, identificador, descripción pedagógica, texto alternativo, atribución, referencia documental, revisión y estado.
- Precarga de datos de fuente y atribución desde los selectores. La selección de un recurso **no equivale por sí misma a autorización de reutilización**.
- Buscador ARASAAC con tarjetas seleccionables, filtrado de coincidencias y manejo de respuestas 404 sin presentar automáticamente una caída del servicio. Se incluyen expresiones alternativas para determinadas búsquedas.
- Ajustes del flujo administrativo y de las restricciones SQL para admitir técnicamente fichas LSP y ARASAAC en estado `programado`, con controles de fuente y confirmaciones administrativas.
- Vistas públicas de hoy y ayer con `security_invoker=true` y política RLS limitada a recursos programados para las fechas autorizadas.
- Corrección de la expresión SQL de validación del dominio de ARASAAC.

**Condición de publicación de ilustraciones LSP:** la procedencia del MINEDU y su disponibilidad para consulta no acreditan automáticamente una licencia de reproducción. La publicación de una imagen exige que la persona responsable verifique realmente el permiso aplicable. Las casillas no deben activarse sin ese respaldo. Las fichas pueden conservarse como borradores.

### Noticias y comunicaciones

La evolución reciente también comprende la organización de contenidos de actualidad en EVA y la gestión de noticias destacadas desde el entorno administrativo. Su estado de publicación debe verificarse en cada implementación; la documentación de EVA 2.0 no reemplaza las auditorías técnicas específicas de NI y AC.

### Administración y seguimiento

Se mantiene un panel de gestión asociado al módulo AC, con controles de acceso administrativo y soporte para contenidos y registros. Las modificaciones descritas para «Recursos del día» no implican cambios automáticos en la gestión de usuarios, el contador de visitas ni otras funciones independientes del panel.

## 3. Estado de verificación al 8 de noviembre de 2026

- **Código:** modificaciones registradas en los repositorios de portada y AC.
- **Base de datos:** migraciones de publicación LSP/ARASAAC y corrección del patrón ARASAAC aplicadas; validaciones SQL de programación ejecutadas con reversión de los datos de prueba.
- **Maquetación:** actualización CSS registrada para una imagen principal ampliada; pendiente la comprobación visual humana en navegadores y dispositivos reales.
- **Programación de noviembre:** existen fichas reales en diferentes estados. El conjunto del 16 al 30 de noviembre no debe describirse como publicación íntegra concluida. En la revisión más reciente constaban cinco pictogramas programados, siete señas en borrador y tres fechas sin registro. Toda variación posterior requiere una nueva consulta a Supabase.
- **Derechos de terceros:** ARASAAC conserva su atribución y licencia específica; para ilustraciones del MINEDU se exige verificar las condiciones de reutilización aplicables.
- **Alcance:** la nomenclatura EVA 2.0 registra las mejoras realizadas y sus pendientes; no certifica automáticamente el funcionamiento completo de cada módulo.

## 4. Referencias de implementación

Portada:
- `eva-recurso-dia.js`: lectura y presentación del recurso actual y anterior, con tratamiento diferenciado para LSP y ARASAAC.
- `eva-recurso-dia.css`: distribución, imágenes, diseño adaptable y alto contraste.
- `docs/recurso-del-dia-etapa-06-presentacion-publica.md`: registro histórico de la etapa 06, anterior a los ajustes de EVA 2.0.

AC:
- `admin/recurso-dia.js`: edición, validación y programación.
- `admin/recurso-dia-fuentes.js`: búsqueda y selección desde BDA y ARASAAC.
- `admin/index.html`: controles del formulario.
- `supabase/migrations/20261108175714_eva_recurso_dia_lsp_publicacion_verificada.sql`.
- `supabase/migrations/20261108175754_eva_recurso_dia_corregir_patron_fuente_arasaac.sql`.

## 5. Criterio de continuidad

Toda mejora posterior de EVA 2.0 debe documentarse con su fecha, repositorio, cambio funcional, evidencia de verificación y pendientes reales. La documentación de autoría original y naturaleza del proyecto se mantiene vigente; esta denominación de versión no altera las condiciones de titularidad ni las licencias de recursos de terceros.

## 6. Autoría pública y reconocimiento de recursos externos

Con EVA 2.0 se incorpora en el footer de la página principal la identificación «Ecosistema Virtual Accesible (EVA) | Creación y desarrollo original: Gabriel Berrospi» y el enlace [Autoría y créditos](https://crebeucayali.github.io/autoria-y-creditos.html). Esta página pública distingue la arquitectura, organización, integración de módulos y componentes originales del ecosistema de los recursos ajenos: pictogramas ARASAAC (Sergio Palao, Gobierno de Aragón, CC BY-NC-SA 4.0), señas e ilustraciones de la guía LSP del MINEDU, signos institucionales del CREBE, noticias y documentos de terceros y servicios tecnológicos. La declaración mantiene los derechos y atribuciones particulares y no convierte el acceso abierto a la guía MINEDU en autorización automática de reproducción.
