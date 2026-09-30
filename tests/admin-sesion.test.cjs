const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '..', 'admin-sesion.js'), 'utf8');
const key = 'eva_admin_supabase_session_v2';
const legacy = 'eva_admin_supabase_session_v1';
const session = (changes = {}) => ({access_token: 'synthetic-aal2', refresh_token: 'synthetic-refresh', expires_at: Math.floor(Date.now()/1000)+3600, user: {id: 'synthetic-user', email: 'synthetic@example.invalid'}, ...changes});
const response = (data, status = 200) => ({ok: status >= 200 && status < 300, status, text: async () => data === null ? '' : JSON.stringify(data)});
const flush = () => new Promise(resolve => setImmediate(resolve));
function environment() {
  const shared = new Map();
  const tabs = [];
  let queue = Promise.resolve();
  const locks = {request(name, options, callback) {
    const next = queue.then(() => {if (options.signal.aborted) throw new Error('aborted'); return callback();});
    queue = next.catch(() => {});
    return next;
  }};
  function tab(fetch = async () => response(session()), options = {}) {
    const events = new Map();
    const sessionMap = new Map(options.legacy ? [[legacy, JSON.stringify(options.legacy)]] : []);
    const timers = new Map();
    let timerId = 0;
    const current = {events};
    function dispatch(name, event = {}) {for (const callback of events.get(name) || []) callback(event);}
    const localStorage = {
      getItem: k => shared.get(k) ?? null,
      setItem(k,v) {
        if (options.storageBlocked) throw new Error('storage unavailable');
        const oldValue = shared.get(k) ?? null;
        shared.set(k,v);
        if (oldValue !== v) queueMicrotask(() => tabs.filter(t => t !== current).forEach(t => t.dispatch('storage', {key:k,newValue:v,oldValue})));
      },
      removeItem(k) {shared.delete(k);}
    };
    const sessionStorage = {getItem: k => sessionMap.get(k) ?? null, setItem: (k,v) => sessionMap.set(k,v), removeItem: k => sessionMap.delete(k)};
    const window = {localStorage, sessionStorage, crypto: {randomUUID: () => 'synthetic-' + Math.random()}, addEventListener(name, callback) {if (!events.has(name)) events.set(name, []); events.get(name).push(callback);}};
    const document = {visibilityState: 'visible', addEventListener: window.addEventListener};
    const context = vm.createContext({window, document, navigator: options.noLocks ? {} : {locks}, fetch, AbortController, Error,
      setTimeout: (fn, ms) => {const id = ++timerId; timers.set(id,{fn,ms}); return id;}, clearTimeout: id => timers.delete(id), queueMicrotask, console});
    current.dispatch = dispatch;
    tabs.push(current);
    vm.runInContext(source, context);
    return {api: window.EvaAdminSession, context, sessionMap, timers, dispatch, document};
  }
  return {shared,tab};
}

test('migra la sesión actual, preserva AAL2 y recupera una apertura nueva', async () => {
  const env = environment();
  const first = env.tab(undefined,{legacy:session()});
  assert.equal(first.api.persistent,true);
  assert.equal(first.api.getSession().access_token,'synthetic-aal2');
  const second = env.tab();
  assert.equal(second.api.getSession().access_token,'synthetic-aal2');
});
test('una sesión válida no solicita renovación', async () => {
  let calls = 0;
  const {api} = environment().tab(async () => {calls++; return response(session());},{legacy:session()});
  await api.ensureSession();
  assert.equal(calls,0);
});
test('seis llamadas de una pestaña comparten una sola renovación', async () => {
  let calls = 0;
  const {api} = environment().tab(async () => {calls++; await flush(); return response(session());},{legacy:session({expires_at:1})});
  await Promise.all(Array.from({length:6},() => api.ensureSession()));
  assert.equal(calls,1);
});
test('dos pestañas renuevan una sola vez y usan el token rotado', async () => {
  const env = environment(); let calls = 0;
  const fetch = async () => {calls++; await flush(); return response(session({access_token:'synthetic-rotated',refresh_token:'synthetic-rotated-refresh'}));};
  const first = env.tab(fetch,{legacy:session({expires_at:1})});
  const second = env.tab(fetch);
  const result = await Promise.all([first.api.ensureSession(),second.api.ensureSession()]);
  assert.equal(calls,1);
  assert.ok(result.every(s => s.access_token === 'synthetic-rotated'));
});
for (const [name, fail] of [
  ['red',async () => {throw new Error('offline');}],
  ['HTTP 503',async () => response({error_code:'unexpected_failure'},503)],
  ['HTTP 429',async () => response({error_code:'over_request_rate_limit'},429)],
  ['rechazo sin código definitivo',async () => response({message:'configuration error'},400)]
]) test('conserva la sesión ante '+name, async () => {
  const {api} = environment().tab(fail,{legacy:session({expires_at:1})});
  await assert.rejects(api.ensureSession());
  assert.equal(api.getSession().refresh_token,'synthetic-refresh');
});
test('la conexión recuperada renueva la sesión después de un error', async () => {
  let offline = true;
  const {api} = environment().tab(async () => {if (offline) throw new Error('offline'); return response(session());},{legacy:session({expires_at:1})});
  await assert.rejects(api.ensureSession());
  offline = false;
  assert.equal((await api.ensureSession()).access_token,'synthetic-aal2');
});
for (const code of ['refresh_token_not_found','refresh_token_already_used','session_not_found','user_banned']) test('limpia la sesión revocada: '+code, async () => {
  const env = environment();
  const first = env.tab(async () => response({error_code:code},400),{legacy:session({expires_at:1})});
  await assert.rejects(first.api.ensureSession(),error => error.definitive === true);
  assert.equal(first.api.getSession(),null);
  const other = env.tab(undefined,{legacy:session()});
  assert.equal(other.api.getSession(),null);
});
test('no conserva contraseñas ni códigos MFA en almacenamiento', async () => {
  const env = environment();
  const {api,sessionMap} = env.tab();
  await api.signIn('synthetic@example.invalid','synthetic-password-secret');
  await api.verifyMfa('factor','challenge','192837');
  const saved = JSON.stringify([...env.shared.values(),...sessionMap.values()]);
  assert.ok(!saved.includes('synthetic-password-secret'));
  assert.ok(!saved.includes('192837'));
});
test('un login incorrecto no sustituye una sesión válida', async () => {
  const {api} = environment().tab(async () => response({error_code:'invalid_credentials'},400),{legacy:session()});
  await assert.rejects(api.signIn('synthetic@example.invalid','wrong'));
  assert.equal(api.getSession().access_token,'synthetic-aal2');
});
test('el token AAL2 devuelto por MFA se conserva entre aperturas', async () => {
  const env = environment();
  const first = env.tab(async () => response(session({access_token:'synthetic-mfa-aal2'})),{legacy:session({access_token:'synthetic-aal1'})});
  await first.api.verifyMfa('factor','challenge','192837');
  assert.equal(env.tab().api.getSession().access_token,'synthetic-mfa-aal2');
});
test('un código MFA incorrecto conserva la sesión AAL1', async () => {
  const {api} = environment().tab(async () => response({error_code:'mfa_verification_failed'},422),{legacy:session({access_token:'synthetic-aal1'})});
  await assert.rejects(api.verifyMfa('factor','challenge','wrong'));
  assert.equal(api.getSession().access_token,'synthetic-aal1');
});
test('logout usa scope local y cierra otras pestañas del mismo navegador', async () => {
  const env = environment();let logoutUrl='';
  const first = env.tab(async url => {logoutUrl=url; return response(null,204);},{legacy:session()});
  const second = env.tab();
  const result = await first.api.signOut(); await flush();
  assert.ok(logoutUrl.endsWith('/logout?scope=local'));
  assert.equal(result.remote,true);
  assert.equal(first.api.getSession(),null);
  assert.equal(second.api.getSession(),null);
});
test('logout con fallo de red limpia el navegador y comunica cierre remoto pendiente', async () => {
  const {api,sessionMap} = environment().tab(async () => {throw new Error('offline');},{legacy:session()});
  assert.equal((await api.signOut()).remote,false);
  assert.equal(api.getSession(),null);
  assert.equal(sessionMap.has(legacy),false);
});
test('una renovación pendiente no resucita la sesión después del logout', async () => {
  const env = environment();
  const first = env.tab(async url => {if (url.includes('refresh_token')) {await flush(); return response(session());} return response(null,204);},{legacy:session({expires_at:1})});
  const second = env.tab();
  await Promise.all([first.api.ensureSession(),second.api.signOut()]);
  assert.equal(first.api.getSession(),null);
  assert.equal(second.api.getSession(),null);
});
test('logout persistido impide recuperar una copia antigua de sessionStorage', async () => {
  const env = environment();
  await env.tab(undefined,{legacy:session()}).api.signOut();
  assert.equal(env.tab(undefined,{legacy:session()}).api.getSession(),null);
});
test('un navegador sin Web Locks conserva solo la sesión de su pestaña', async () => {
  const env = environment();
  const tab = env.tab(undefined,{noLocks:true,legacy:session()});
  assert.equal(tab.api.persistent,false);
  assert.equal(tab.api.getSession().access_token,'synthetic-aal2');
  assert.equal(env.shared.has(key),false);
});
test('almacenamiento local bloqueado mantiene la sesión temporal', async () => {
  const {api} = environment().tab(undefined,{storageBlocked:true,legacy:session()});
  assert.equal(api.persistent,false);
  assert.equal((await api.ensureSession()).access_token,'synthetic-aal2');
});
test('datos persistidos corruptos no recuperan tokens antiguos', async () => {
  const env = environment();env.shared.set(key,'invalid json');
  assert.equal(env.tab(undefined,{legacy:session()}).api.getSession(),null);
});
test('respuestas HTTP inválidas no sustituyen la sesión anterior', async () => {
  const {api} = environment().tab(async () => response(null),{legacy:session({expires_at:1})});
  await assert.rejects(api.ensureSession());
  assert.equal(api.getSession().refresh_token,'synthetic-refresh');
});
test('una escritura fallida no se reenvía automáticamente', async () => {
  let calls=0;
  const {api} = environment().tab(async () => {calls++; return response({code:'42501'},403);},{legacy:session()});
  await assert.rejects(api.request('noticias_destacadas',{method:'PATCH',body:'{}'}));
  assert.equal(calls,1);
});
test('la renovación proactiva usa el temporizador sin pedir credenciales', async () => {
  let calls=0;
  const tab = environment().tab(async () => {calls++;return response(session());},{legacy:session({expires_at:1})});
  const scheduled=[...tab.timers.values()].find(t => t.ms===1000);
  await scheduled.fn();
  assert.equal(calls,1);
});
test('la autorización consulta Supabase con el token vigente', async () => {
  let used='';
  const {api}=environment().tab(async (url,options)=>{used=options.headers.Authorization;return response([{autorizado:true,aal:'aal2'}]);},{legacy:session()});
  const result=await api.getAuthorization();
  assert.equal(result.aal,'aal2');assert.equal(used,'Bearer synthetic-aal2');
});
test('un fallo del RPC de autorización no elimina la sesión', async () => {
  const {api}=environment().tab(async ()=>response({code:'42501'},403),{legacy:session()});
  await assert.rejects(api.getAuthorization());assert.ok(api.getSession());
});
test('logout y comprobación de autorización comparten el bloqueo', async () => {
  const env=environment();const order=[];
  const a=env.tab(async url=>{if(url.includes('estado_panel_admin')){order.push('authorization');await flush();return response([{autorizado:true,aal:'aal2'}]);}order.push('logout');return response(null,204);},{legacy:session()});
  const b=env.tab(async ()=>{order.push('logout');return response(null,204);});
  await Promise.all([a.api.getAuthorization(),b.api.signOut()]);
  assert.deepEqual(order,['authorization','logout']);assert.equal(a.api.getSession(),null);
});
test('retomar una pestaña sin sesión no envía solicitudes', async () => {
  let calls=0;
  const tab=environment().tab(async ()=>{calls++;return response([]);});
  tab.dispatch('online');tab.dispatch('visibilitychange');await flush();
  assert.equal(calls,0);
});
