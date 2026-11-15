import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

// Recordatorio de racha por notificación push (Web Push con VAPID, sin contenido en el mensaje).
//  GET                      -> { clave }  clave pública VAPID para que el navegador se suscriba
//  POST { accion:'registrar', endpoint, racha, ultimo_dia, zona }  guarda o actualiza la suscripción
//  POST { accion:'baja', endpoint }                               la borra
//  POST { accion:'recordar' } + cabecera x-cron-secret            (lo llama pg_cron cada tarde) avisa a quien tiene racha y hoy no ha practicado
// Las claves (VAPID y secreto del cron) viven en la tabla entrenador_config, que solo lee el service role.

const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info, x-cron-secret', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS' };
const json = (o: unknown, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { ...CORS, 'Content-Type': 'application/json' } });

const SB = Deno.env.get('SUPABASE_URL')!, SRV = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const rest = (ruta: string, init: RequestInit = {}) =>
  fetch(`${SB}/rest/v1/${ruta}`, { ...init, headers: { apikey: SRV, Authorization: 'Bearer ' + SRV, 'Content-Type': 'application/json', ...(init.headers || {}) } });

const b64u = (b: Uint8Array) => btoa(String.fromCharCode(...b)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const texto64 = (s: string) => b64u(new TextEncoder().encode(s));

const SERVICIOS_PUSH = [/^fcm\.googleapis\.com$/, /^updates\.push\.services\.mozilla\.com$/, /(^|\.)push\.services\.mozilla\.com$/, /\.notify\.windows\.com$/, /(^|\.)push\.apple\.com$/];
function endpointValido(e: unknown): e is string {
  if (typeof e !== 'string' || e.length > 1000) return false;
  try {
    const u = new URL(e);
    return u.protocol === 'https:' && SERVICIOS_PUSH.some((r) => r.test(u.hostname));
  } catch { return false; }
}

async function config(clave: string): Promise<string | null> {
  const r = await rest(`entrenador_config?clave=eq.${clave}&select=valor`);
  const f = ((await r.json()) || [])[0];
  return f ? f.valor : null;
}

// Claves VAPID: se crean la primera vez que hacen falta y se guardan
async function claves(): Promise<{ privada: JsonWebKey; publica: string }> {
  let priv = await config('vapid_privada'), pub = await config('vapid_publica');
  if (!priv || !pub) {
    const par = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
    const jwk = await crypto.subtle.exportKey('jwk', par.privateKey);
    const raw = new Uint8Array(await crypto.subtle.exportKey('raw', par.publicKey));
    await rest('entrenador_config?on_conflict=clave', { method: 'POST', headers: { Prefer: 'resolution=ignore-duplicates' }, body: JSON.stringify([{ clave: 'vapid_privada', valor: JSON.stringify(jwk) }, { clave: 'vapid_publica', valor: b64u(raw) }]) });
    priv = await config('vapid_privada'); pub = await config('vapid_publica');
  }
  return { privada: JSON.parse(priv!), publica: pub! };
}

// Cabecera Authorization de VAPID (RFC 8292) para un servicio push
async function autorizacion(endpoint: string, k: { privada: JsonWebKey; publica: string }) {
  const cab = texto64(JSON.stringify({ typ: 'JWT', alg: 'ES256' }));
  const cuerpo = texto64(JSON.stringify({ aud: new URL(endpoint).origin, exp: Math.floor(Date.now() / 1000) + 12 * 3600, sub: 'https://entrenador-cartas.onrender.com' }));
  const clave = await crypto.subtle.importKey('jwk', k.privada, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
  const firma = new Uint8Array(await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, clave, new TextEncoder().encode(`${cab}.${cuerpo}`)));
  return `vapid t=${cab}.${cuerpo}.${b64u(firma)}, k=${k.publica}`;
}

const fechaEn = (zona: string, ms: number) => new Intl.DateTimeFormat('en-CA', { timeZone: zona, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(ms));
const zonaValida = (z: unknown): z is string => { if (typeof z !== 'string' || z.length > 60) return false; try { new Intl.DateTimeFormat('en', { timeZone: z }); return true; } catch { return false; } };

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  try {
    if (req.method === 'GET') return json({ clave: (await claves()).publica });
    if (req.method !== 'POST') return json({ error: 'metodo' }, 405);
    const d = await req.json().catch(() => ({}));

    if (d.accion === 'registrar') {
      if (!endpointValido(d.endpoint)) return json({ error: 'endpoint' }, 400);
      const racha = Number.isInteger(d.racha) && d.racha >= 0 && d.racha < 100000 ? d.racha : 0;
      const dia = typeof d.ultimo_dia === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d.ultimo_dia) ? d.ultimo_dia : null;
      const zona = zonaValida(d.zona) ? d.zona : 'Europe/Madrid';
      const r = await rest('entrenador_push?on_conflict=endpoint', { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates' }, body: JSON.stringify({ endpoint: d.endpoint, racha, ultimo_dia: dia, zona, actualizado: new Date().toISOString() }) });
      return r.ok ? json({ ok: true }) : json({ error: 'guardar' }, 500);
    }
    if (d.accion === 'baja') {
      if (!endpointValido(d.endpoint)) return json({ error: 'endpoint' }, 400);
      await rest(`entrenador_push?endpoint=eq.${encodeURIComponent(d.endpoint)}`, { method: 'DELETE' });
      return json({ ok: true });
    }
    if (d.accion === 'recordar') {
      const secreto = await config('cron_secreto');
      if (!secreto || req.headers.get('x-cron-secret') !== secreto) return json({ error: 'sin_permiso' }, 401);
      const k = await claves();
      const filas = (await (await rest('entrenador_push?racha=gt.0&select=endpoint,ultimo_dia,zona,avisado_dia')).json()) as Array<{ endpoint: string; ultimo_dia: string | null; zona: string; avisado_dia: string | null }>;
      let enviados = 0, borrados = 0, fallos = 0;
      for (const f of filas) {
        const hoy = fechaEn(f.zona, Date.now()), ayer = fechaEn(f.zona, Date.now() - 86400000);
        if (f.ultimo_dia !== ayer || f.avisado_dia === hoy) continue; // tiene racha, hoy aún no ha practicado y no se le ha avisado
        try {
          const r = await fetch(f.endpoint, { method: 'POST', headers: { Authorization: await autorizacion(f.endpoint, k), TTL: '43200', Urgency: 'normal' } });
          if (r.status === 404 || r.status === 410) { await rest(`entrenador_push?endpoint=eq.${encodeURIComponent(f.endpoint)}`, { method: 'DELETE' }); borrados++; }
          else if (r.ok) { await rest(`entrenador_push?endpoint=eq.${encodeURIComponent(f.endpoint)}`, { method: 'PATCH', body: JSON.stringify({ avisado_dia: hoy }) }); enviados++; }
          else { fallos++; console.error('push', r.status, await r.text().catch(() => '')); }
        } catch (e) { fallos++; console.error('push', String(e)); }
      }
      return json({ revisados: filas.length, enviados, borrados, fallos });
    }
    return json({ error: 'accion' }, 400);
  } catch (e) {
    console.error(String(e));
    return json({ error: 'interno' }, 500);
  }
});
