import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

// Crea una sesión de pago de Stripe (suscripción mensual con 5 días de prueba la primera vez).
const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };
const json = (o, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { ...CORS, 'Content-Type': 'application/json' } });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ error: 'metodo' }, 405);
  const clave = Deno.env.get('STRIPE_SECRET_KEY'), precio = Deno.env.get('STRIPE_PRICE_ID'), app = (Deno.env.get('APP_URL') || '').replace(/\/$/, '');
  if (!clave || !precio || !app) return json({ error: 'no_configurado' }, 503);

  const SB = Deno.env.get('SUPABASE_URL'), SRV = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const token = (req.headers.get('Authorization') || '').replace(/^Bearer /i, '');
  const u = await fetch(SB + '/auth/v1/user', { headers: { apikey: SRV, Authorization: 'Bearer ' + token } });
  if (!u.ok) return json({ error: 'sin_sesion' }, 401);
  const user = await u.json();

  const r = await fetch(`${SB}/rest/v1/entrenador_vip?user_id=eq.${user.id}&select=*`, { headers: { apikey: SRV, Authorization: 'Bearer ' + SRV } });
  const fila = ((await r.json()) || [])[0];
  if (fila && fila.hasta && new Date(fila.hasta) > new Date() && ['active', 'trialing'].includes(fila.estado)) return json({ error: 'ya_vip' }, 409);

  const f = new URLSearchParams({
    mode: 'subscription',
    'line_items[0][price]': precio,
    'line_items[0][quantity]': '1',
    'subscription_data[metadata][user_id]': user.id,
    client_reference_id: user.id,
    success_url: app + '/?vip=ok',
    cancel_url: app + '/?vip=cancelado',
  });
  if (!fila || !fila.stripe_subscription_id) f.set('subscription_data[trial_period_days]', '5'); // la prueba gratis solo la primera vez
  if (fila && fila.stripe_customer_id) f.set('customer', fila.stripe_customer_id);
  else f.set('customer_email', user.email);

  const s = await fetch('https://api.stripe.com/v1/checkout/sessions', { method: 'POST', headers: { Authorization: 'Basic ' + btoa(clave + ':'), 'Content-Type': 'application/x-www-form-urlencoded' }, body: f });
  const sesion = await s.json();
  if (!s.ok || !sesion.url) { console.error('stripe', s.status, JSON.stringify(sesion)); return json({ error: 'stripe' }, 502); }
  return json({ url: sesion.url });
});
