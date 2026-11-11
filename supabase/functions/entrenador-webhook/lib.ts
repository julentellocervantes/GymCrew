// Lógica pura del webhook de Stripe (sin tipos para poder probarla también con Node).

const aHex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');

// Comprueba la cabecera «Stripe-Signature» (t=marca,v1=firma) con tolerancia de 5 minutos.
export async function firmaValida(cuerpo, cabecera, secreto, ahoraSeg = Math.floor(Date.now() / 1000)) {
  if (!cabecera || !secreto) return false;
  const partes = {};
  const v1 = [];
  for (const p of cabecera.split(',')) {
    const [k, v] = p.split('=');
    if (k === 'v1') v1.push(v);
    else partes[k] = v;
  }
  const t = Number(partes.t);
  if (!Number.isFinite(t) || Math.abs(ahoraSeg - t) > 300 || v1.length === 0) return false;
  const clave = await crypto.subtle.importKey('raw', new TextEncoder().encode(secreto), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const esperada = aHex(await crypto.subtle.sign('HMAC', clave, new TextEncoder().encode(`${t}.${cuerpo}`)));
  // comparación en tiempo constante
  return v1.some((f) => {
    if (f.length !== esperada.length) return false;
    let d = 0;
    for (let i = 0; i < f.length; i++) d |= f.charCodeAt(i) ^ esperada.charCodeAt(i);
    return d === 0;
  });
}

const VIGENTES = ['active', 'trialing'];

// Convierte una suscripción de Stripe en la fila de entrenador_vip (o null si no sabemos de quién es).
export function filaDeSuscripcion(sub, ahoraMs = Date.now()) {
  const userId = sub && sub.metadata && sub.metadata.user_id;
  if (!userId) return null;
  const finSeg = sub.current_period_end ?? (sub.items && sub.items.data && sub.items.data[0] && sub.items.data[0].current_period_end);
  const vigente = VIGENTES.includes(sub.status) && Number.isFinite(finSeg);
  return {
    user_id: userId,
    stripe_customer_id: typeof sub.customer === 'string' ? sub.customer : sub.customer && sub.customer.id,
    stripe_subscription_id: sub.id,
    estado: sub.status,
    // si ya no está vigente, el VIP termina ahora mismo
    hasta: new Date(vigente ? finSeg * 1000 : ahoraMs).toISOString(),
    actualizado: new Date(ahoraMs).toISOString(),
  };
}
