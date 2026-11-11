// Prueba la lógica del webhook de Stripe (firma y conversión de la suscripción). Uso: node tests/webhook.mjs
import { copyFileSync, rmSync } from 'node:fs';
import { createHmac } from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
const raiz = join(dirname(fileURLToPath(import.meta.url)), '..', 'supabase', 'functions', 'entrenador-webhook');
const temporal = join(raiz, 'lib.temporal.mjs');
copyFileSync(join(raiz, 'lib.ts'), temporal);
const { firmaValida, filaDeSuscripcion } = await import(pathToFileURL(temporal).href);
rmSync(temporal);
let fallos = 0, n = 0;
const ok = (c, m) => { n++; if (!c) { fallos++; console.log('FALLO', m); } };
const cuerpo = '{"id":"evt_1"}', secreto = 'whsec_prueba', t = 1700000000;
const firma = createHmac('sha256', secreto).update(`${t}.${cuerpo}`).digest('hex');
ok(await firmaValida(cuerpo, `t=${t},v1=${firma}`, secreto, t + 10), 'firma correcta');
ok(!(await firmaValida(cuerpo + ' ', `t=${t},v1=${firma}`, secreto, t + 10)), 'cuerpo alterado');
ok(!(await firmaValida(cuerpo, `t=${t},v1=${firma}`, 'otro', t + 10)), 'secreto distinto');
ok(!(await firmaValida(cuerpo, `t=${t},v1=${firma}`, secreto, t + 301)), 'firma caducada');
ok(!(await firmaValida(cuerpo, `t=${t},v1=${'0'.repeat(64)}`, secreto, t)), 'firma falsa');
ok(!(await firmaValida(cuerpo, null, secreto, t)) && !(await firmaValida(cuerpo, 'basura', secreto, t)), 'sin cabecera o basura');
ok(await firmaValida(cuerpo, `t=${t},v1=deadbeef,v1=${firma}`, secreto, t), 'varias firmas v1');
const ahora = Date.parse('2026-11-12T10:00:00Z');
const fin = 1795000000;
let f = filaDeSuscripcion({ id: 'sub_1', customer: 'cus_1', status: 'trialing', current_period_end: fin, metadata: { user_id: 'u1' } }, ahora);
ok(f.estado === 'trialing' && f.hasta === new Date(fin * 1000).toISOString() && f.user_id === 'u1' && f.stripe_customer_id === 'cus_1', 'prueba vigente');
f = filaDeSuscripcion({ id: 'sub_1', customer: { id: 'cus_1' }, status: 'active', items: { data: [{ current_period_end: fin }] }, metadata: { user_id: 'u1' } }, ahora);
ok(f.hasta === new Date(fin * 1000).toISOString() && f.stripe_customer_id === 'cus_1', 'fin de periodo dentro de items');
for (const estado of ['canceled', 'past_due', 'unpaid', 'incomplete_expired']) {
  f = filaDeSuscripcion({ id: 'sub_1', customer: 'cus_1', status: estado, current_period_end: fin, metadata: { user_id: 'u1' } }, ahora);
  ok(f.hasta === new Date(ahora).toISOString(), `${estado}: sin VIP`);
}
ok(filaDeSuscripcion({ id: 'sub_1', status: 'active', current_period_end: fin, metadata: {} }) === null, 'sin user_id no se guarda');
console.log(fallos ? `WEBHOOK: ${fallos} fallos` : `WEBHOOK OK: ${n} comprobaciones`);
process.exit(fallos ? 1 : 0);
