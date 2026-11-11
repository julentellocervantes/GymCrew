// CUENTA Y PAGO DEL VIP (Supabase + Stripe)
//
// - Acceso sin contraseña: la persona escribe su email, recibe un enlace y al abrirlo vuelve a la app con sesión.
// - El VIP lo escribe SOLO el webhook de Stripe en la tabla entrenador_vip; la app únicamente la lee.
// - Todo esto se usa solo cuando PREMIUM.modoPrueba es false. Mientras sea true el VIP es una demostración local.

const CLAVE_SESION = 'vip-sesion-v1';

const nubeActiva = () => !PREMIUM.modoPrueba && !!(PREMIUM.nube && PREMIUM.nube.url && PREMIUM.nube.clave);

function leerSesion() {
  try {
    const s = JSON.parse(localStorage.getItem(CLAVE_SESION));
    return s && s.access_token && s.refresh_token ? s : null;
  } catch (e) {
    return null;
  }
}
function guardarSesion(s) {
  try {
    if (s) localStorage.setItem(CLAVE_SESION, JSON.stringify(s));
    else localStorage.removeItem(CLAVE_SESION);
  } catch (e) { /* sin almacenamiento: la sesión dura lo que dure la pestaña */ }
}

// Datos (email) que lleva dentro el token de acceso
function emailDelToken(token) {
  try {
    const b = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const datos = JSON.parse(decodeURIComponent(escape(atob(b + '='.repeat((4 - (b.length % 4)) % 4)))));
    return datos.email || '';
  } catch (e) {
    return '';
  }
}

// Al abrir el enlace del correo, Supabase vuelve a la app con la sesión en el «#» de la dirección.
function capturarEnlace() {
  if (!nubeActiva() || !location.hash) return false;
  const p = new URLSearchParams(location.hash.slice(1));
  if (p.get('error_description')) {
    history.replaceState(null, '', location.pathname + location.search);
    window.avisoCuenta = 'El enlace del correo ha caducado o ya se usó. Pide uno nuevo.';
    return false;
  }
  const acceso = p.get('access_token'), refresco = p.get('refresh_token');
  if (!acceso || !refresco) return false;
  const caduca = Number(p.get('expires_at')) || Math.floor(Date.now() / 1000) + (Number(p.get('expires_in')) || 3600);
  guardarSesion({ access_token: acceso, refresh_token: refresco, expires_at: caduca, email: emailDelToken(acceso) });
  history.replaceState(null, '', location.pathname + location.search);
  return true;
}

const cabecerasNube = (token) => ({ apikey: PREMIUM.nube.clave, Authorization: 'Bearer ' + (token || PREMIUM.nube.clave), 'Content-Type': 'application/json' });

// Devuelve una sesión con el token en vigor (lo renueva si le quedan menos de 60 s)
async function sesionActual() {
  let s = leerSesion();
  if (!s) return null;
  if (s.expires_at - 60 > Date.now() / 1000) return s;
  try {
    const r = await fetch(`${PREMIUM.nube.url}/auth/v1/token?grant_type=refresh_token`, { method: 'POST', headers: cabecerasNube(), body: JSON.stringify({ refresh_token: s.refresh_token }) });
    if (!r.ok) throw new Error('sin renovar');
    const d = await r.json();
    s = { access_token: d.access_token, refresh_token: d.refresh_token, expires_at: d.expires_at || Math.floor(Date.now() / 1000) + d.expires_in, email: emailDelToken(d.access_token) };
    guardarSesion(s);
    return s;
  } catch (e) {
    // sin conexión: se conserva la sesión; si el servidor la rechaza, se pedirá de nuevo
    return navigator.onLine === false ? s : (guardarSesion(null), null);
  }
}

async function pedirEnlace(email) {
  const r = await fetch(`${PREMIUM.nube.url}/auth/v1/otp?redirect_to=${encodeURIComponent(location.origin + location.pathname)}`, {
    method: 'POST',
    headers: cabecerasNube(),
    body: JSON.stringify({ email, create_user: true }),
  });
  if (!r.ok) throw new Error(r.status === 429 ? 'Has pedido demasiados enlaces seguidos. Espera un minuto e inténtalo otra vez.' : 'No se ha podido enviar el correo. Revisa la dirección e inténtalo otra vez.');
}

// Lee de la nube si el VIP está vigente y actualiza el progreso. Devuelve true si ha cambiado el estado.
async function sincronizarVip() {
  if (!nubeActiva()) return false;
  const s = await sesionActual();
  if (!s) return false;
  try {
    const r = await fetch(`${PREMIUM.nube.url}/rest/v1/entrenador_vip?select=estado,hasta`, { headers: cabecerasNube(s.access_token) });
    if (!r.ok) return false;
    const fila = (await r.json())[0];
    const hasta = fila && ['active', 'trialing'].includes(fila.estado) ? Date.parse(fila.hasta) || 0 : 0;
    const antes = esVip();
    progreso.vip.hasta = hasta > Date.now() ? hasta : 0;
    guardarProgreso();
    return antes !== esVip();
  } catch (e) {
    return false; // sin conexión: se mantiene lo último que se supo
  }
}

// Llama a una función de Supabase y devuelve la dirección a la que hay que ir (pago o portal)
async function irA(funcion) {
  const s = await sesionActual();
  if (!s) throw new Error('Tu sesión ha caducado. Vuelve a entrar con tu correo.');
  let r;
  try {
    r = await fetch(`${PREMIUM.nube.url}/functions/v1/${funcion}`, { method: 'POST', headers: cabecerasNube(s.access_token), body: '{}' });
  } catch (e) {
    throw new Error('No hay conexión. Inténtalo cuando vuelvas a estar en línea.');
  }
  const d = await r.json().catch(() => ({}));
  if (r.ok && d.url) {
    window.location.href = d.url;
    return;
  }
  if (d.error === 'no_configurado') throw new Error('El pago aún no está disponible. Vuelve a intentarlo más tarde.');
  if (d.error === 'ya_vip') { await sincronizarVip(); throw new Error('Ya eres VIP.'); }
  if (d.error === 'sin_sesion' || r.status === 401) { guardarSesion(null); throw new Error('Tu sesión ha caducado. Vuelve a entrar con tu correo.'); }
  if (d.error === 'sin_suscripcion') throw new Error('No encuentro ninguna suscripción en tu cuenta.');
  throw new Error('No se ha podido abrir el pago. Inténtalo otra vez en un rato.');
}
const empezarPago = () => irA('entrenador-checkout');
const abrirPortal = () => irA('entrenador-portal');

function cerrarSesionVip() {
  guardarSesion(null);
  progreso.vip.hasta = 0;
  guardarProgreso();
}
