(() => {
  "use strict";
  const PANEL_URL = "https://crebeucayali.github.io/accesos-complementarios/admin/";
  const $ = id => document.getElementById(id);

  function cargarSesion() {
    if (window.EvaAdminSession) return Promise.resolve(window.EvaAdminSession);
    // Keep pages already consuming this shared access script compatible.
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://crebeucayali.github.io/admin-sesion.js?v=1";
      script.onload = () => window.EvaAdminSession
        ? resolve(window.EvaAdminSession) : reject(new Error("No se pudo preparar el acceso administrativo."));
      script.onerror = () => reject(new Error("No se pudo cargar el acceso. Recarga la página para reintentar."));
      document.head.appendChild(script);
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    const contenedor = $("acceso-admin-eva");
    const boton = $("admin-toggle");
    const panel = $("admin-mini-panel");
    const cerrar = $("admin-cerrar");
    const form = $("admin-mini-form");
    const correo = $("admin-correo");
    const clave = $("admin-clave");
    const mensaje = $("admin-mini-mensaje");
    const submit = $("admin-mini-submit");
    const sesionActiva = $("admin-sesion-activa");
    const abrir = $("admin-abrir-panel");
    const cerrarSesion = $("admin-cerrar-sesion");
    if (!contenedor || !boton || !panel || !form || !correo || !clave || !mensaje || !submit || !sesionActiva || !abrir || !cerrarSesion) return;

    let comprobacion = 0;
    let authPromise = null;
    const obtenerAuth = () => {
      if (!authPromise) authPromise = cargarSesion().catch(error => { authPromise = null; throw error; });
      return authPromise;
    };

    async function actualizarAcceso() {
      const intento = ++comprobacion;
      try {
        const auth = await obtenerAuth();
        if (intento !== comprobacion || panel.hidden) return;
        if (!auth.getSession()) {
          sesionActiva.hidden = true;
          form.hidden = false;
          mensaje.textContent = "";
          correo.focus();
          return;
        }
        sesionActiva.hidden = false;
        form.hidden = true;
        abrir.disabled = true;
        mensaje.textContent = "Comprobando sesión...";
        const datos = await auth.getAuthorization();
        if (intento !== comprobacion || panel.hidden) return;
        const estado = Array.isArray(datos) ? datos[0] : datos;
        abrir.disabled = !estado?.autorizado;
        mensaje.textContent = estado?.autorizado ? "" : "Esta cuenta no está autorizada para administrar EVA. Cierra la sesión para usar otra cuenta.";
      } catch (error) {
        if (intento !== comprobacion || panel.hidden) return;
        if (error.definitive) {
          sesionActiva.hidden = true;
          form.hidden = false;
        } else abrir.disabled = false;
        mensaje.textContent = error.message || "No se pudo comprobar la sesión. Vuelve a intentarlo.";
      }
    }

    function mostrarPanel(visible) {
      panel.hidden = !visible;
      boton.setAttribute("aria-expanded", visible ? "true" : "false");
      contenedor.classList.toggle("abierto", visible);
      if (visible) actualizarAcceso();
      else { comprobacion++; clave.value = ""; }
    }

    boton.addEventListener("click", () => mostrarPanel(panel.hidden));
    cerrar?.addEventListener("click", () => { mostrarPanel(false); boton.focus(); });

    abrir.addEventListener("click", async () => {
      abrir.disabled = true;
      try {
        const auth = await obtenerAuth();
        const datos = await auth.getAuthorization();
        const estado = Array.isArray(datos) ? datos[0] : datos;
        if (!estado?.autorizado) throw new Error("Esta cuenta no está autorizada para administrar EVA.");
        window.location.href = PANEL_URL;
      } catch (error) { mensaje.textContent = error.message; }
      finally { abrir.disabled = false; }
    });

    cerrarSesion.addEventListener("click", async () => {
      cerrarSesion.disabled = true;
      comprobacion++;
      try {
        const auth = await obtenerAuth();
        const resultado = await auth.signOut();
        clave.value = "";
        sesionActiva.hidden = true;
        form.hidden = false;
        mensaje.textContent = resultado.remote ? "Sesión administrativa cerrada." : "Sesión cerrada en este navegador. No se pudo confirmar el cierre remoto.";
        correo.focus();
      } catch (error) { mensaje.textContent = error.message; }
      finally { cerrarSesion.disabled = false; }
    });

    form.addEventListener("submit", async evento => {
      evento.preventDefault();
      if (submit.disabled) return;
      submit.disabled = true;
      submit.textContent = "Ingresando...";
      mensaje.textContent = "";
      try {
        const auth = await obtenerAuth();
        await auth.signIn(correo.value.trim(), clave.value);
        clave.value = "";
        window.location.href = PANEL_URL;
      } catch (error) { mensaje.textContent = error.message || "No se pudo iniciar sesión."; }
      finally {
        clave.value = "";
        submit.disabled = false;
        submit.textContent = "Ingresar";
      }
    });

    obtenerAuth().then(auth => auth.subscribe(event => {
      if (event === "SIGNED_OUT") {
        comprobacion++;
        clave.value = "";
        sesionActiva.hidden = true;
        form.hidden = false;
      } else if (event === "SESSION_UPDATED" && !panel.hidden) actualizarAcceso();
    })).catch(() => {});

    document.addEventListener("keydown", evento => {
      if (evento.key === "Escape" && !panel.hidden) { mostrarPanel(false); boton.focus(); }
    });
    document.addEventListener("click", evento => {
      if (!panel.hidden && !contenedor.contains(evento.target) && !boton.contains(evento.target)) mostrarPanel(false);
    });
  });
})();
