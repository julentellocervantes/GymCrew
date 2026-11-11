import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { firmaValida, filaDeSuscripcion } from './lib.ts';

// Webhook de Stripe: mantiene la tabla entrenador_vip al día. Sin JWT: se autentica con la firma de Stripe.
const SB = Deno.env.get('SUPABASE_URL');
const SRV = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const cab = { apikey: SRV, Authorization: 'Bearer ' + SRV, 'Content-Type': 'application/json' };

const guardar = (fila) =>
  fetch(`${SB}/rest/v1/entrenador_vip?on_conflict=user_id`, { method: 'POST', headers: { ...cab, Prefer: 'resolution=merge-duplicates,return=minimal' }, body: JSON.stringify(fila) });

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('método no permitido', { status: 405 });
  const secreto = Deno.env.get('STRIPE_WEBHOOK_SECRET');
  if (!secreto) return new Response('no configurado', { status: 503 });
  const cuerpo = await req.text();
  if (!(await firmaValida(cuerpo, req.headers.get('stripe-signature'), secreto))) return new Response('firma no válida', { status: 400 });

  const evento = JSON.parse(cuerpo);
  const obj = evento.data && evento.data.object;
  let r = null;
  if (evento.type === 'checkout.session.completed' && obj.client_reference_id && obj.mode === 'subscription') {
    r = await guardar({
      user_id: obj.client_reference_id,
      stripe_customer_id: obj.customer,
      stripe_subscription_id: obj.subscription,
      actualizado: new Date().toISOString(),
    });
  } else if (['customer.subscription.created', 'customer.subscription.updated', 'customer.subscription.deleted'].includes(evento.type)) {
    const fila = filaDeSuscripcion(obj);
    if (fila) r = await guardar(fila);
  }
  if (r && !r.ok) {
    console.error('no se pudo guardar', r.status, await r.text());
    return new Response('error al guardar', { status: 500 }); // Stripe reintentará
  }
  return new Response('ok');
});
