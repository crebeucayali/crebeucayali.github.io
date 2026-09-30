# Auditoría de autenticación EVA: etapa 1

Fecha: 29 de septiembre de 2026, America/Lima.

## Resultado

La auditoría está completada. La optimización de sesión todavía requiere resolver el alcance del plan adjunto: el acceso compacto está en este repositorio, pero el panel administrativo está en `crebeucayali/accesos-complementarios`.

El plan limita las modificaciones a un solo repositorio. Cambiar únicamente la portada no resolvería la persistencia y renovación del panel. Por ello, esta etapa incorpora solo este diagnóstico; no modifica código de autenticación, cuentas, políticas ni datos.

## Ubicación del código

| Componente | Repositorio | Archivo o recurso |
| --- | --- | --- |
| Acceso compacto de la portada | crebeucayali/crebeucayali.github.io | admin-acceso.js |
| Carga del acceso compacto y CSP | crebeucayali/crebeucayali.github.io | index.html |
| Login, recuperación, renovación, MFA y cierre del panel | crebeucayali/accesos-complementarios | admin/admin.js |
| Estructura del panel | crebeucayali/accesos-complementarios | admin/index.html |
| Documentación previa del panel | crebeucayali/accesos-complementarios | docs/panel-administrativo-auth.md |
| Autorización y auditoría | Supabase, proyecto crebe Project | admin_guard, private y políticas de public/storage |

Referencias inspeccionadas: portada `dc7561f3e6c3fee0476e116a07db72aa618c08ac`; accesos complementarios `cb98b6bb1fbb756b25c3f23d3adf6e687841f677`.

La revisión del segundo repositorio fue de lectura.

## Sesión actual

No hay un cliente `supabase-js` en los dos archivos de autenticación inspeccionados. Ambos llaman directamente a la API HTTP de Supabase. Por tanto, `persistSession`, `autoRefreshToken`, `detectSessionInUrl`, `getSession()` y `onAuthStateChange` no están configurados: no basta con activar esas opciones en el código actual.

La portada y el panel comparten la clave `eva_admin_supabase_session_v1` en `sessionStorage`. Se almacenan access token, refresh token, caducidad y usuario. La contraseña y los códigos MFA no se guardan allí.

| Comportamiento | Hallazgo |
| --- | --- |
| Recarga dentro de la misma pestaña | El panel intenta recuperar la sesión almacenada. |
| Cierre de pestaña y apertura nueva | sessionStorage no ofrece persistencia duradera para este caso. La restauración automática de pestañas depende del navegador. |
| Reconocimiento de sesión en portada | Comprueba que exista access_token; no comprueba caducidad ni autorización. |
| Renovación del panel | Se solicita antes de una llamada REST o determinadas cargas si quedan 90 segundos o menos. |
| Renovación proactiva | No hay temporizador, control de visibilidad ni listener de eventos de Auth. |
| Solicitudes simultáneas | No existe una promesa compartida o bloqueo de renovación. Varias llamadas pueden renovar el mismo token a la vez. |
| Error durante restauración | Cualquier rechazo de entrarPanel() elimina la sesión guardada, incluso un error temporal de red o de carga de módulos. |
| AAL2 recuperado | El panel omite el desafío MFA y carga los módulos. Este comportamiento ya existe y debe conservarse. |
| Redirección de la portada | Abre directamente /accesos-complementarios/admin/. No se encontró redirección automática en bucle en los archivos inspeccionados. |
| Cierre de sesión | Elimina la sesión local y solicita logout remoto; el panel recarga la página. No se especifica un alcance de logout. |

Al entrar con AAL2, el panel carga seis conjuntos de información en paralelo. Si un módulo falla, el Promise.all puede rechazar entrarPanel() y activar la eliminación de sesión durante la restauración. Los fallos de contenido deben tratarse por separado de los fallos definitivos de autenticación.

Estos hallazgos describen el código y las reproducciones locales. No se midió el tiempo real del acceso ni se realizó un login con credenciales de una persona.

## Autorización, MFA y RLS

La tabla existente es `admin_guard.admin_usuarios_autorizados`, fuera del esquema público. Su clave primaria es `user_id` y tiene una relación con `auth.users(id)`. Contiene también `activo`, `nota`, `creado_at` y `actualizado_at`.

La autorización ya depende de `auth.uid()` y de que el registro esté activo. No depende únicamente del correo.

Existe una cuenta en Auth, un usuario administrativo autorizado y activo, y un factor TOTP verificado en el momento de la consulta. Las seis identidades individuales aún no están creadas.

`private.es_admin_autorizado()` comprueba UUID y estado activo. `private.es_admin_mfa()` añade la condición AAL2. Las funciones privadas de consulta usan SECURITY DEFINER, search_path vacío y permisos explícitos; los RPC públicos inspeccionados son SECURITY INVOKER y delegan en esas funciones.

La tabla de autorización no tiene RLS, pero no concede acceso directo a anon ni authenticated. Está protegida actualmente por esquema privado y privilegios de tabla. Antes de extenderla, deben revisarse esas barreras y aplicar RLS según el nuevo modelo, sin exponerla innecesariamente.

Las tablas públicas de contenido y estadísticas inspeccionadas tienen RLS. Las escrituras administrativas de Capacitaciones, Calendario, Repositorio, Noticias y Galería, así como el acceso administrativo a Storage, exigen autorización y AAL2. La consulta de estadísticas de compartidos también exige AAL2.

Capacitaciones y Calendario no tienen una política administrativa DELETE. La eliminación de recursos, noticias y fotografías sí está protegida por autorización y AAL2.

No hay campos de rol ni módulos en la tabla administrativa actual. Tampoco existe aún la separación de permisos administrador/editor/consulta. Reducir AAL2 solo en la interfaz no habilitaría operaciones que siguen bloqueadas por RLS o RPC.

## Auditoría existente

Ya existe `private.auditoria_administrativa`, con 102 filas al consultar.

Registra tabla, operación, clave del registro, UUID del actor, nivel AAL, datos anteriores, datos nuevos y fecha. Hay triggers para las tablas de Capacitaciones, Calendario, Repositorio, Noticias, Galería y sus imágenes.

Debe ampliarse esta estructura cuando se incorporen usuarios, roles y permisos, evitando crear una segunda auditoría de contenido sin necesidad. Los triggers inspeccionados no registran el inicio de sesión administrativo ni cambios de roles, que todavía no existen.

La cuenta compartida permite identificar la cuenta autora de un cambio, pero no cuál de las seis personas la utilizó.

## Verificaciones realizadas

Se ejecutaron consultas de lectura sobre columnas, relaciones, funciones, permisos, políticas, triggers, migraciones y conteos. No hubo migraciones SQL ni cambios de RLS.

Se revisó el asesor de seguridad de Supabase. Devolvió una advertencia: protección de contraseñas filtradas desactivada. Su corrección debe evaluarse en la configuración de Auth; no se cambió durante esta auditoría. [Referencia de Supabase](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).

Se consultó un agregado de fuentes de logs para las 24 horas anteriores a las 22:54:38 del 29 de septiembre, hora de Lima. Esta lectura confirma disponibilidad de logs, pero no sustituye una prueba de acceso ni un análisis individual de errores.

Se ejecutaron cinco comprobaciones locales en Node.js 24.19.0 sobre el código obtenido de GitHub, con almacenamiento y respuestas HTTP simulados y tokens sintéticos:

| Comprobación | Resultado |
| --- | --- |
| Token válido, renovación no necesaria | No se envía una renovación. |
| Seis solicitudes simultáneas con token vencido | Se reproducen seis renovaciones; confirma falta de coordinación. |
| Error temporal de red al restaurar | Se reproduce el borrado de la sesión guardada. |
| Recuperación autorizada con AAL2 | No se solicita un nuevo desafío MFA. |
| Token vencido en el acceso compacto | La portada lo sigue reconociendo como sesión presente. |

Son reproducciones de comportamiento, no pruebas de login ni de MFA contra producción. No se introdujeron credenciales, no se escribieron contenidos y no se simularon operaciones de escritura en la base de datos.

Quedan pendientes las pruebas reales de login correcto/incorrecto, caducidad y renovación con tokens válidos, recarga, cierre y reapertura del navegador, sincronización entre pestañas, logout y responsive. Las pruebas completas de roles y escritura RLS corresponden a etapas posteriores.

## Etapa 2 propuesta

El alcance mínimo necesario comprende el acceso compacto de la portada y la autenticación del panel en accesos-complementarios. No requiere intervenir los otros módulos de EVA ni sus repositorios.

La implementación debe unificar la gestión de sesión, reconocer sesiones válidas, coordinar la renovación, distinguir errores transitorios de caducidad definitiva y conservar AAL2 mientras Supabase mantenga ese nivel. La persistencia entre aperturas debe implementarse de manera coherente en ambos puntos de entrada; copiar tokens a otro almacenamiento solo desde la portada no resuelve el flujo.

Si se incorpora el cliente oficial de Supabase, debe fijarse su versión, servirlo de forma compatible con la CSP y migrar la sesión existente una sola vez mediante los mecanismos del cliente. Deben conservarse la cuenta actual y el contrato de los RPC. No se deben almacenar contraseñas ni códigos MFA.

En esta etapa se mantendrían las políticas AAL2 actuales. Roles, módulos y AAL2 selectivo requieren una etapa posterior coordinada con Supabase.

Para las seis cuentas harán falta los correos individuales y la asignación de roles y módulos; esos datos no se han supuesto.

## Cambios de esta etapa

Archivo añadido: `docs/autenticacion-etapa-1-auditoria.md`.

Código funcional modificado: ninguno.

Migraciones SQL: ninguna.

Políticas RLS modificadas: ninguna.

Siguiente decisión: confirmar que el alcance autorizado incluye `crebeucayali/accesos-complementarios`, únicamente para los archivos de autenticación del panel. El plan original dice: "No modificar otros repositorios de EVA durante esta intervención".

## Documentación consultada

- [Sesiones de Supabase Auth](https://supabase.com/docs/guides/auth/sessions).
- [Eventos de autenticación](https://supabase.com/docs/reference/javascript/auth-onauthstatechange).
- [MFA y aplicación de AAL2](https://supabase.com/docs/guides/auth/auth-mfa).
- [Registro de cambios de Supabase](https://supabase.com/changelog). El índice Markdown no fue accesible desde las herramientas disponibles; se revisó la página HTML.
