(() => {
  "use strict";

  const SUPABASE_URL = "https://dteimbhwtzghhsijeeld.supabase.co";
  const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_tHbo1jTeW_dC90hdA5DvyQ_a6LrfKpq";
  const SESSION_KEY = "eva_admin_supabase_session_v1";
  const PANEL_URL = "https://crebeucayali.github.io/accesos-complementarios/admin/";

  const $ = (id) => document.getElementById(id);

  function leerSesion() {
    try {
      const datos = JSON.parse(sessionStorage.getItem(SESSION_KEY) || "null");
      return datos?.access_token ? datos : null;
    } catch {
      sessionStorage.removeItem(SESSION_KEY);
      return null;
    }
  }

  function guardarSesion(datos) {
    if (!datos?.access_token) {
      throw new Error("No se recibió una sesión válida.");
    }

    const sesion = {
      access_token: datos.access_token,
      refresh_token: datos.refresh_token || "",
      expires_at: datos.expires_at || Math.floor(Date.now() / 1000) + Number(datos.expires_in || 3600),
      user: datos.user || null
    };

    sessionStorage.setItem(SESSION_KEY, JSON.stringify(sesion));
  }

  function abrirPanel() {
    window.location.href = PANEL_URL;
  }

  async function iniciarSesion(correo, clave) {
    const respuesta = await fetch(SUPABASE_URL + "/auth/v1/token?grant_type=password", {
      method: "POST",
      headers: {
        apikey: SUPABASE_PUBLISHABLE_KEY,
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      credentials: "omit",
      cache: "no-store",
      referrerPolicy: "strict-origin-when-cross-origin",
      body: JSON.stringify({ email: correo, password: clave })
    });

    let datos = null;
    try {
      datos = await respuesta.json();
    } catch {
      datos = null;
    }

    if (!respuesta.ok) {
      const mensaje = datos?.msg || datos?.message || datos?.error_description || "No se pudo iniciar sesión.";
      throw new Error(mensaje);
    }

    guardarSesion(datos);
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
    const abrir = $("admin-abrir-panel");

    if (!contenedor || !boton || !panel || !form || !correo || !clave || !mensaje || !submit || !abrir) return;

    const mostrarPanel = (visible) => {
      panel.hidden = !visible;
      boton.setAttribute("aria-expanded", visible ? "true" : "false");
      contenedor.classList.toggle("abierto", visible);
      if (visible) {
        if (leerSesion()) {
          abrir.hidden = false;
          form.hidden = true;
          mensaje.textContent = "Hay una sesión administrativa disponible.";
        } else {
          abrir.hidden = true;
          form.hidden = false;
          window.setTimeout(() => correo.focus(), 0);
        }
      }
    };

    boton.addEventListener("click", () => {
      mostrarPanel(panel.hidden);
    });

    cerrar?.addEventListener("click", () => {
      mostrarPanel(false);
      boton.focus();
    });

    abrir.addEventListener("click", abrirPanel);

    form.addEventListener("submit", async (evento) => {
      evento.preventDefault();
      mensaje.textContent = "";
      submit.disabled = true;
      submit.textContent = "Ingresando…";

      try {
        await iniciarSesion(correo.value.trim(), clave.value);
        clave.value = "";
        mensaje.textContent = "Acceso validado. Abriendo panel…";
        abrirPanel();
      } catch (error) {
        mensaje.textContent = error?.message || "No se pudo iniciar sesión.";
        clave.select();
      } finally {
        submit.disabled = false;
        submit.textContent = "Ingresar";
      }
    });

    document.addEventListener("keydown", (evento) => {
      if (evento.key === "Escape" && !panel.hidden) {
        mostrarPanel(false);
        boton.focus();
      }
    });

    document.addEventListener("click", (evento) => {
      if (panel.hidden || contenedor.contains(evento.target)) return;
      mostrarPanel(false);
    });
  });
})();
