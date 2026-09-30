# Autenticación EVA: etapa 2

Fecha: 29 de septiembre de 2026, America/Lima.

## Resultado

Se implementó una gestión común de sesión para el acceso compacto de la portada y el panel administrativo. La intervención se limita a autenticación, recuperación, persistencia, renovación, MFA y cierre de sesión.

No hubo migraciones SQL ni cambios de RLS, permisos, usuarios, cuenta administrativa, datos, CSS, header, footer o funciones de los módulos de contenido y estadísticas. AAL2 sigue siendo obligatorio para las operaciones actuales.

## Archivos

| Repositorio | Archivo | Intervención |
| --- | --- | --- |
| crebeucayali/crebeucayali.github.io | admin-sesion.js | Gestor común de sesión sobre la API HTTP existente de Supabase. |
| crebeucayali/crebeucayali.github.io | admin-acceso.js | Login, recuperación, comprobación administrativa, apertura del panel y logout a través del gestor común. |
| crebeucayali/crebeucayali.github.io | index.html | Carga del gestor antes del acceso compacto; actualización de la versión del script. |
| crebeucayali/crebeucayali.github.io | tests/admin-sesion.test.cjs | 31 pruebas automatizadas del gestor. |
| crebeucayali/crebeucayali.github.io | docs/autenticacion-etapa-2-sesion.md | Este informe. |
| crebeucayali/accesos-complementarios | admin/admin.js | Integración de sesión, recuperación de acceso, limpieza de campos sensibles y tratamiento separado de fallos de carga. |
| crebeucayali/accesos-complementarios | admin/index.html | Carga del gestor común y botón "Reintentar acceso". |
| crebeucayali/accesos-complementarios | admin/tests/auth-session.test.cjs | 11 pruebas automatizadas del acceso al panel. |
| crebeucayali/accesos-complementarios | docs/panel-administrativo-auth.md | Actualización de las secciones que describen la sesión y el flujo de acceso. |

La lectura de otros archivos para verificar estilos no dio lugar a modificaciones.

## Comportamiento anterior y nuevo

| Situación | Antes | Ahora |
| --- | --- | --- |
| Apertura nueva | La sesión dependía de sessionStorage. | Se recupera desde localStorage si el navegador dispone de Web Locks y permite el almacenamiento. |
| Renovación simultánea | Varias solicitudes podían renovar el mismo token. | Una promesa coordina cada pestaña y Web Locks coordina las pestañas del mismo origen. |
| Error de red al recuperar | El rechazo de entrarPanel podía borrar una sesión válida. | Se conserva la sesión y se ofrece reintentar. |
| Fallo de carga de un módulo | Podía interpretarse como fallo de autenticación. | La carga parcial muestra un aviso y conserva el acceso validado. |
| AAL2 ya verificado | Se reutilizaba dentro de la sesión temporal. | Se recupera el token persistido y Supabase confirma el nivel antes de mostrar el panel. |
| Logout | La petición sin scope podía cerrar otras sesiones de la cuenta. | scope=local cierra la sesión actual de Supabase y limpia las pestañas de este navegador. |

La sesión anterior se migra una vez. Se mantiene una copia compatible en sessionStorage durante la transición. Un estado explícito de cierre impide recuperar copias antiguas después del logout.

Se renueva cuando quedan 90 segundos o menos. Hay comprobación proactiva mientras la página está visible y al recuperar visibilidad/conexión. Los fallos transitorios permiten reintento; las respuestas explícitas de Supabase sobre sesiones o refresh tokens revocados sí limpian el acceso.

No se almacena una bandera que conceda AAL2. Tampoco se prolonga artificialmente la validez del token. La autorización continúa dependiendo de los RPC y las políticas existentes.

Las contraseñas y códigos MFA no se guardan en almacenamiento. Los campos se limpian después del envío; el QR y secreto de enrolamiento se limpian al completar MFA o cerrar la sesión. Los tokens nunca se añadieron a documentación ni a registros de diagnóstico.

Las escrituras de contenido no se reenvían automáticamente después de un fallo HTTP, para evitar duplicar una operación cuyo resultado no pudo confirmarse.

## Pruebas ejecutadas

Resultado: 42 pruebas automatizadas conformes, con tokens sintéticos, respuestas HTTP simuladas y controles DOM simulados. No se usaron credenciales de personas ni se realizaron escrituras en Supabase.

En la portada:

```sh
node tests/admin-sesion.test.cjs
```

En accesos complementarios:

```sh
node admin/tests/auth-session.test.cjs
```

Las 31 pruebas del gestor cubren recuperación entre aperturas, migración, una sola renovación ante seis solicitudes y entre dos pestañas, rotación del token, fallos de red/HTTP 429/503, recuperación de conectividad, revocación explícita, MFA correcto/incorrecto, login incorrecto, logout, prevención de recuperación tras cierre, almacenamiento restringido, respuestas inválidas, renovación proactiva y coordinación del RPC de autorización.

Las 11 pruebas del panel cubren recuperación AAL2 sin MFA repetido, bloqueo en AAL1, reintento después de fallo de red o contenido, cierre local y desde otra pestaña, usuario no autorizado, ausencia de sesión, recurso común no disponible, limpieza de contraseña incorrecta y bloqueo si Supabase devuelve AAL1 tras renovar.

También pasaron la comprobación de sintaxis de los tres scripts y la revisión estática de IDs únicos, orden de carga y compatibilidad con la CSP actual. Se compararon las funciones de contenido, imágenes, formularios y estadísticas con la versión anterior: permanecen idénticas. Header y footer permanecen idénticos en ambos HTML.

Se intentó una prueba adicional de navegador. Chromium no estaba instalado y la descarga del navegador devolvió un archivo inválido. Esa prueba no se ejecutó; no se da por validada la apariencia responsive ni el flujo con una cuenta real.

## Publicación

El gestor común se publicó primero en la portada: commit [180dfe1](https://github.com/crebeucayali/crebeucayali.github.io/commit/180dfe19286c33403b33d7133490141f794f51b7).

Antes de integrarlo en el panel se comprobó el despliegue de GitHub Pages y se descargó el recurso público. Su SHA-256 coincidió con el archivo probado, incluida la URL exacta `admin-sesion.js?v=1`.

La integración del panel se publicó en el commit [53f400a](https://github.com/crebeucayali/accesos-complementarios/commit/53f400a5a2368d9bd794ad972e11cf2696d18036).

La integración de la portada y este informe completan la publicación de la etapa. Los hashes de los archivos publicados se verifican contra los archivos probados.

## Límites y riesgos detectados

La persistencia mantiene el acceso en ese navegador. En un equipo compartido debe utilizarse "Cerrar sesión" al terminar.

Sin Web Locks o con almacenamiento restringido, la sesión puede quedar limitada a una pestaña y la recuperación después de cerrar el navegador no está garantizada. Las pestañas nuevas con el gestor actualizado se coordinan; las páginas que sigan abiertas con código anterior deben recargarse para adoptar la actualización.

Un logout sin conexión limpia el navegador, pero no permite confirmar la revocación remota. La interfaz muestra esa diferencia. Los access tokens emitidos previamente pueden conservar validez hasta su caducidad; esta etapa no cambia las políticas para consultar auth.sessions en cada operación.

El panel depende del recurso común publicado en la portada. Si no se carga, el acceso se bloquea y ofrece recarga; no se omiten controles de seguridad.

La comprobación real de login, MFA, reapertura completa del navegador y apariencia móvil queda pendiente. Las pruebas automatizadas no sustituyen esa comprobación.

## Comprobación manual antes de la etapa siguiente

1. Cerrar las pestañas antiguas o actualizar la portada y el panel con Ctrl+F5.
2. Ingresar con la cuenta actual y completar el autenticador una vez.
3. Recargar el panel y confirmar que abre sin volver a pedir el código mientras la sesión siga en AAL2.
4. Cerrar el navegador, abrirlo nuevamente y acceder a la portada: comprobar "Abrir panel" y la recuperación de sesión.
5. Abrir portada y panel en dos pestañas. Cerrar sesión en una y confirmar que el acceso queda cerrado en ambas.
6. Si aparece un fallo de conexión o carga, utilizar "Reintentar acceso" después de recuperar la conexión.
7. Comprobar el botón de reintento y el acceso en un móvil.

La siguiente etapa de usuarios, roles y permisos no se inició.

## Referencias técnicas

- [Sesiones de Supabase](https://supabase.com/docs/guides/auth/sessions).
- [Códigos de error de Auth](https://supabase.com/docs/guides/auth/debugging/error-codes).
- [Alcances de cierre de sesión](https://supabase.com/docs/guides/auth/signout).
- [Web Locks](https://developer.mozilla.org/en-US/docs/Web/API/Web_Locks_API).
