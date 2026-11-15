// COPIA EN LA NUBE (para todos) Y RECORDATORIO DE RACHA POR NOTIFICACIÓN
// - La copia usa el mismo acceso por correo que el VIP (cuenta.js) y guarda el progreso en entrenador_progreso (solo lo lee su dueño).
// - El VIP nunca se copia: lo decide el servidor.
// - El recordatorio es una notificación push (Supabase función entrenador-push) que avisa de tarde si tienes racha y hoy no has practicado.

const nubeDisponible = () => !!(typeof PREMIUM !== 'undefined' && PREMIUM.nube && PREMIUM.nube.url && PREMIUM.nube.clave);

let nubeTimer = null;
let nubeEstado = ''; // texto corto para Ajustes: última sincronización

function progresoParaNube() {
  const copia = JSON.parse(JSON.stringify(progreso));
  delete copia.vip;
  return copia;
}

async function nubeSubir() {
  if (!nubeDisponible() || !leerSesion()) return false;
  const s = await sesionActual();
  if (!s) return false;
  try {
    const b = s.access_token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const id = JSON.parse(atob(b + '='.repeat((4 - (b.length % 4)) % 4))).sub;
    const r = await fetch(`${PREMIUM.nube.url}/rest/v1/entrenador_progreso?on_conflict=user_id`, {
      method: 'POST',
      headers: { ...cabecerasNube(s.access_token), Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify({ user_id: id, datos: progresoParaNube(), xp: progreso.xp, actualizado: new Date().toISOString() }),
    });
    if (r.ok && typeof amigosSubirXp === 'function') amigosSubirXp();
    if (r.ok) nubeEstado = 'Guardado en la nube hoy a las ' + new Date().toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });
    return r.ok;
  } catch (e) {
    return false;
  }
}

// Llamado desde guardarProgreso: espera unos segundos de calma antes de subir
function nubeProgramar() {
  if (!nubeDisponible() || !leerSesion()) return;
  clearTimeout(nubeTimer);
  nubeTimer = setTimeout(nubeSubir, 6000);
}

// Compara con la nube: gana quien tenga más XP. Devuelve 'subido' | 'bajado' | 'igual' | 'error'
async function nubeSincronizar() {
  if (!nubeDisponible()) return 'error';
  const s = await sesionActual();
  if (!s) return 'error';
  try {
    const r = await fetch(`${PREMIUM.nube.url}/rest/v1/entrenador_progreso?select=datos,xp`, { headers: cabecerasNube(s.access_token) });
    if (!r.ok) return 'error';
    const fila = (await r.json())[0];
    if (!fila || fila.xp < progreso.xp) return (await nubeSubir()) ? 'subido' : 'error';
    if (fila.xp === progreso.xp) { nubeEstado = 'Tu progreso ya está al día en la nube'; return 'igual'; }
    const nuevo = normalizarProgreso({ ...fila.datos, vip: progreso.vip });
    progreso = nuevo;
    guardarProgreso();
    nubeEstado = 'Progreso recuperado de la nube';
    return 'bajado';
  } catch (e) {
    return 'error';
  }
}

function nubeSalir() {
  clearTimeout(nubeTimer);
  guardarSesion(null);
  progreso.vip.hasta = 0;
  guardarProgreso();
}

// ---------- recordatorio de racha (push) ----------
const pushSoportado = () => 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
const urlPush = () => `${PREMIUM.nube.url}/functions/v1/entrenador-push`;
const cabPush = () => ({ 'Content-Type': 'application/json', apikey: PREMIUM.nube.clave });

function claveVapid(b64) {
  const p = b64.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (b64.length % 4)) % 4);
  return Uint8Array.from(atob(p), (c) => c.charCodeAt(0));
}

async function suscripcionPush() {
  if (!pushSoportado()) return null;
  try {
    const reg = await navigator.serviceWorker.ready;
    return await reg.pushManager.getSubscription();
  } catch (e) { return null; }
}

// Envía a la nube la racha y el último día practicado (para saber a quién avisar)
async function pushActualizar() {
  if (!nubeDisponible()) return;
  const sub = await suscripcionPush();
  if (!sub) return;
  try {
    await fetch(urlPush(), { method: 'POST', headers: cabPush(), body: JSON.stringify({ accion: 'registrar', endpoint: sub.endpoint, racha: progreso.racha || 0, ultimo_dia: progreso.ultimoDia || null, zona: Intl.DateTimeFormat().resolvedOptions().timeZone }) });
  } catch (e) { /* sin conexión: se reintenta la próxima vez */ }
}

// Activa o desactiva el aviso. Devuelve un texto de error o '' si todo fue bien.
async function pushActivar(activar) {
  if (!nubeDisponible()) return 'El recordatorio no está disponible ahora mismo.';
  if (!pushSoportado()) return 'Este navegador no admite avisos. En iPhone, añade primero la app a la pantalla de inicio.';
  try {
    const reg = await navigator.serviceWorker.ready;
    let sub = await reg.pushManager.getSubscription();
    if (!activar) {
      if (sub) {
        await fetch(urlPush(), { method: 'POST', headers: cabPush(), body: JSON.stringify({ accion: 'baja', endpoint: sub.endpoint }) }).catch(() => {});
        await sub.unsubscribe();
      }
      return '';
    }
    if ((await Notification.requestPermission()) !== 'granted') return 'No has dado permiso para las notificaciones. Puedes cambiarlo en los ajustes del navegador.';
    if (!sub) {
      const r = await fetch(urlPush(), { headers: cabPush() });
      const { clave } = await r.json();
      sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: claveVapid(clave) });
    }
    await pushActualizar();
    return '';
  } catch (e) {
    return 'No se ha podido activar el recordatorio. Inténtalo otra vez en un rato.';
  }
}
