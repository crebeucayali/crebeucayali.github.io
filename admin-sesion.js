(() => {
  "use strict";
  if (window.EvaAdminSession) return;

  const URL_BASE = "https://dteimbhwtzghhsijeeld.supabase.co";
  const PUBLIC_KEY = "sb_publishable_tHbo1jTeW_dC90hdA5DvyQ_a6LrfKpq";
  const STORAGE_KEY = "eva_admin_supabase_session_v2";
  const LEGACY_KEY = "eva_admin_supabase_session_v1";
  const LOCK_NAME = "eva-admin-auth-v2";
  const MARGIN_SECONDS = 90;
  const listeners = new Set();
  let state = { version: 2, revision: "initial", session: null };
  let refreshPromise = null;
  let queue = Promise.resolve();
  let timer = null;
  let storage = null;
  let persistent = false;

  class SessionError extends Error {
    constructor(message, code, status = 0, definitive = false) {
      super(message);
      this.name = "EvaSessionError";
      this.code = code;
      this.status = status;
      this.definitive = definitive;
    }
  }

  // Shared persistence requires an origin-wide lock for refresh-token rotation.
  try {
    const candidate = navigator.locks?.request ? window.localStorage : window.sessionStorage;
    const probe = STORAGE_KEY + "_probe";
    candidate.setItem(probe, "1");
    candidate.removeItem(probe);
    storage = candidate;
    persistent = candidate === window.localStorage;
  } catch {
    try { storage = window.sessionStorage; } catch { storage = null; }
  }

  function revision() {
    return window.crypto?.randomUUID?.() || String(Date.now()) + "-" + Math.random().toString(36).slice(2);
  }

  function clone(value) {
    return value ? JSON.parse(JSON.stringify(value)) : null;
  }

  function normalize(data, previous = null) {
    if (typeof data?.access_token !== "string" || !data.access_token) {
      throw new SessionError("No se recibió una sesión válida.", "invalid_session_response");
    }
    const expiry = Number(data.expires_at || (Math.floor(Date.now() / 1000) + Number(data.expires_in || 0)));
    const user = data.user || previous?.user;
    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token || previous?.refresh_token || "",
      expires_at: Number.isFinite(expiry) ? expiry : 0,
      user: user ? { id: user.id || "", email: user.email || "" } : null
    };
  }

  function emit(event, error = null) {
    const snapshot = clone(state.session);
    queueMicrotask(() => {
      listeners.forEach(listener => { try { listener(event, snapshot, error); } catch {} });
    });
  }

  function mirrorLegacy() {
    try {
      if (state.session) window.sessionStorage.setItem(LEGACY_KEY, JSON.stringify(state.session));
      else window.sessionStorage.removeItem(LEGACY_KEY);
    } catch {}
  }

  function read() {
    if (!storage) return state.session;
    let raw;
    try { raw = storage.getItem(STORAGE_KEY); } catch { return state.session; }
    if (raw !== null) {
      try {
        const saved = JSON.parse(raw);
        if (saved?.version !== 2 || typeof saved.revision !== "string") throw new Error("invalid");
        state = { version: 2, revision: saved.revision, session: saved.session ? normalize(saved.session) : null };
      } catch {
        state = { version: 2, revision: revision(), session: null };
        try { storage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
      }
      return state.session;
    }
    // Migrate once. A persisted signed-out state is a tombstone and prevents resurrection.
    try {
      const legacy = JSON.parse(window.sessionStorage.getItem(LEGACY_KEY) || "null");
      if (legacy?.access_token) {
        state = { version: 2, revision: revision(), session: normalize(legacy) };
        storage.setItem(STORAGE_KEY, JSON.stringify(state));
      }
    } catch {}
    return state.session;
  }

  function save(session, event) {
    state = { version: 2, revision: revision(), session };
    try { storage?.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {
      // Keep the usable session in memory when browser storage becomes unavailable.
      storage = null;
      persistent = false;
    }
    mirrorLegacy();
    schedule();
    emit(event);
    return clone(session);
  }

  async function lock(task) {
    if (navigator.locks?.request) {
      const controller = new AbortController();
      const deadline = setTimeout(() => controller.abort(), 20000);
      try {
        return await navigator.locks.request(LOCK_NAME, { signal: controller.signal }, async () => {
          clearTimeout(deadline);
          return task();
        });
      } catch (error) {
        if (controller.signal.aborted) {
          throw new SessionError("La sesión está ocupada en otra pestaña. Vuelve a intentarlo.", "coordination_timeout");
        }
        throw error;
      } finally { clearTimeout(deadline); }
    }
    const result = queue.then(task, task);
    queue = result.catch(() => {});
    return result;
  }

  async function http(url, options = {}) {
    const controller = new AbortController();
    const deadline = setTimeout(() => controller.abort(), 12000);
    try {
      const response = await fetch(url, {
        ...options, signal: controller.signal, credentials: "omit", cache: "no-store",
        referrerPolicy: "strict-origin-when-cross-origin"
      });
      const text = await response.text();
      let data = null;
      try { data = text ? JSON.parse(text) : null; } catch { data = null; }
      if (!response.ok) {
        const code = String(data?.error_code || data?.code || data?.error || "http_error");
        const message = data?.msg || data?.message || data?.error_description || "No se pudo completar la solicitud.";
        throw new SessionError(String(message), code, response.status);
      }
      return data;
    } catch (error) {
      if (error instanceof SessionError) throw error;
      throw new SessionError(
        controller.signal.aborted ? "La conexión tardó demasiado. Vuelve a intentarlo." : "No se pudo conectar. Revisa tu conexión y vuelve a intentarlo.",
        controller.signal.aborted ? "network_timeout" : "network_error"
      );
    } finally { clearTimeout(deadline); }
  }

  function headers(token, extra = {}) {
    return { apikey: PUBLIC_KEY, "Content-Type": "application/json", Accept: "application/json",
      ...(token ? { Authorization: "Bearer " + token } : {}), ...extra };
  }

  async function refreshLocked(force = false, observedToken = null) {
    const current = read();
    if (!current) throw new SessionError("La sesión terminó. Inicia sesión nuevamente.", "session_missing", 0, true);
    const expectedRevision = state.revision;
    if (observedToken && current.access_token !== observedToken) return clone(current);
    if (!force && current.expires_at - Math.floor(Date.now() / 1000) > MARGIN_SECONDS) return clone(current);
    if (!current.refresh_token) {
      save(null, "SIGNED_OUT");
      throw new SessionError("La sesión venció. Inicia sesión nuevamente.", "refresh_missing", 0, true);
    }
    try {
      const data = await http(URL_BASE + "/auth/v1/token?grant_type=refresh_token", {
        method: "POST", headers: headers(), body: JSON.stringify({ refresh_token: current.refresh_token })
      });
      read();
      if (state.revision !== expectedRevision) {
        if (state.session) return clone(state.session);
        throw new SessionError("La sesión terminó. Inicia sesión nuevamente.", "session_missing", 0, true);
      }
      return save(normalize(data, current), "TOKEN_REFRESHED");
    } catch (error) {
      const invalid = new Set(["refresh_token_not_found", "refresh_token_already_used", "session_not_found", "session_expired", "user_not_found", "user_banned", "bad_jwt", "invalid_grant"]);
      read();
      if (invalid.has(error.code) && error.status >= 400 && error.status < 500 && error.status !== 429 && state.revision === expectedRevision) {
        save(null, "SIGNED_OUT");
        throw new SessionError("La sesión venció o fue revocada. Inicia sesión nuevamente.", error.code, error.status, true);
      }
      throw error;
    }
  }

  function ensureSession(options = {}) {
    if (refreshPromise) return refreshPromise;
    const observedToken = options.force ? read()?.access_token : null;
    refreshPromise = lock(() => refreshLocked(Boolean(options.force), observedToken));
    refreshPromise = refreshPromise.finally(() => { refreshPromise = null; });
    return refreshPromise;
  }

  async function signIn(email, password) {
    return lock(async () => {
      read();
      const expectedRevision = state.revision;
      const data = await http(URL_BASE + "/auth/v1/token?grant_type=password", {
        method: "POST", headers: headers(), body: JSON.stringify({ email, password })
      });
      read();
      if (state.revision !== expectedRevision) {
        throw new SessionError("La sesión cambió. Vuelve a intentarlo.", "session_changed");
      }
      return save(normalize(data), "SIGNED_IN");
    });
  }

  async function verifyMfa(factor, challenge, code) {
    return lock(async () => {
      const current = await refreshLocked();
      const expectedRevision = state.revision;
      const data = await http(URL_BASE + "/auth/v1/factors/" + encodeURIComponent(factor) + "/verify", {
        method: "POST", headers: headers(current.access_token),
        body: JSON.stringify({ challenge_id: challenge, code })
      });
      read();
      if (state.revision !== expectedRevision || !state.session) {
        throw new SessionError("La sesión cambió. Vuelve a abrir el panel.", "session_changed");
      }
      return save(normalize(data, current), "MFA_VERIFIED");
    });
  }

  async function signOut() {
    try {
      return await lock(async () => {
        let current = read();
        let remote = false;
        try {
          if (current) {
            if (current.expires_at <= Math.floor(Date.now() / 1000)) {
              try { current = await refreshLocked(); } catch {}
            }
            await http(URL_BASE + "/auth/v1/logout?scope=local", {
              method: "POST", headers: headers(current.access_token), body: "{}"
            });
            remote = true;
          }
        } catch {} finally { save(null, "SIGNED_OUT"); }
        return { remote };
      });
    } catch {
      save(null, "SIGNED_OUT");
      return { remote: false };
    }
  }

  async function request(path, options = {}) {
    const current = await ensureSession();
    // Do not automatically replay content writes after HTTP errors.
    return http(URL_BASE + "/rest/v1/" + path, { ...options, headers: headers(current.access_token, options.headers) });
  }

  async function getAuthorization() {
    return lock(async () => {
      const current = await refreshLocked();
      const expectedRevision = state.revision;
      const data = await http(URL_BASE + "/rest/v1/rpc/estado_panel_admin", {
        method: "POST", headers: headers(current.access_token), body: "{}"
      });
      read();
      if (state.revision !== expectedRevision || !state.session) {
        throw new SessionError("La sesión cambió. Vuelve a abrir el panel.", "session_changed", 0, !state.session);
      }
      return Array.isArray(data) ? data[0] : data;
    });
  }

  function schedule(retry = false) {
    clearTimeout(timer);
    if (!state.session) return;
    const delay = retry ? 30000 : Math.max(1000, Math.min(1800000, (state.session.expires_at - Math.floor(Date.now() / 1000) - MARGIN_SECONDS) * 1000));
    timer = setTimeout(backgroundRefresh, delay);
  }

  async function backgroundRefresh() {
    if (!read()) return;
    if (document.visibilityState === "hidden") { schedule(true); return; }
    try { await ensureSession(); schedule(); } catch (error) {
      emit("SESSION_ERROR", error);
      if (!error.definitive) schedule(true);
    }
  }

  window.addEventListener("storage", event => {
    if (persistent && (event.key === STORAGE_KEY || event.key === null)) {
      const before = state.revision;
      if (event.key === null || event.newValue === null) {
        state = { version: 2, revision: revision(), session: null };
        try { storage?.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
      } else read();
      mirrorLegacy();
      schedule();
      if (before !== state.revision) emit(state.session ? "SESSION_UPDATED" : "SIGNED_OUT");
    }
  });
  window.addEventListener("online", backgroundRefresh);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && read()) backgroundRefresh();
  });

  read();
  mirrorLegacy();
  schedule();
  window.EvaAdminSession = Object.freeze({
    getSession: () => clone(read()), ensureSession, signIn, signOut, verifyMfa, request, getAuthorization,
    subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
    get persistent() { return persistent; }
  });
})();
