import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

// Abre el portal de Stripe para gestionar o cancelar la suscripción.
const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };
const json = (o, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { ...CORS, 'Content-Type': 'application/json' } });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ error: 'metodo' }, 405);
  const clave = Deno.env.get('STRIPE_SECRET_KEY'), app = (Deno.env.get('APP_URL') || '').replace(/\/$/, '');
  if (!clave || !app) return json({ error: 'no_configurado' }, 503);

  const SB = Deno.env.get('SUPABASE_URL'), SRV = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const token = (req.headers.get('Authorization') || '').replace(/^Bearer /i, '');
  const u = await fetch(SB + '/auth/v1/user', { headers: { apikey: SRV, Authorization: 'Bearer ' + token } });
  if (!u.ok) return json({ error: 'sin_sesion' }, 401);
  const user = await u.json();

  const r = await fetch(`${SB}/rest/v1/entrenador_vip?user_id=eq.${user.id}&select=stripe_customer_id`, { headers: { apikey: SRV, Authorization: 'Bearer ' + SRV } });
  const fila = ((await r.json()) || [])[0];
  if (!fila || !fila.stripe_customer_id) return json({ error: 'sin_suscripcion' }, 404);

  const s = await fetch('https://api.stripe.com/v1/billing_portal/sessions', { method: 'POST', headers: { Authorization: 'Basic ' + btoa(clave + ':'), 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ customer: fila.stripe_customer_id, return_url: app + '/' }) });
  const sesion = await s.json();
  if (!s.ok || !sesion.url) { console.error('stripe', s.status, JSON.stringify(sesion)); return json({ error: 'stripe' }, 502); }
  return json({ url: sesion.url });
});
