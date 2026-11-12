// Calcula, por enumeración exacta, la mejor jugada (qué cartas guardar) de manos de vídeo póker
// Jacks or Better 9/6 (pagos por moneda: pareja de J o mejor 1, doble pareja 2, trío 3, escalera 4,
// color 6, full 9, póker 25, escalera de color 50, escalera real 250).
// Uso: node tools/generar-videopoker.js <semilla> <cuántas> > salida.json
// Los resultados se guardan en data/videopoker-datos.js (ya generado). No hace falta ejecutarlo para usar la app.

const PAGO = { royal: 250, escColor: 50, poker: 25, full: 9, color: 6, escalera: 4, trio: 3, dobles: 2, pareja: 1, nada: 0 };

function categoria(rs, ss) {
  // rs: rangos 2..14, ss: palos 0..3 (5 cartas)
  const cont = new Array(15).fill(0);
  for (let i = 0; i < 5; i++) cont[rs[i]]++;
  let pares = 0, trios = 0, cuatros = 0, parAlto = false;
  for (let r = 2; r <= 14; r++) {
    if (cont[r] === 2) { pares++; if (r >= 11) parAlto = true; }
    else if (cont[r] === 3) trios++;
    else if (cont[r] === 4) cuatros++;
  }
  const color = ss[0] === ss[1] && ss[1] === ss[2] && ss[2] === ss[3] && ss[3] === ss[4];
  let escalera = false, alta = 0;
  if (pares === 0 && trios === 0 && cuatros === 0) {
    let mn = 99, mx = 0;
    for (let i = 0; i < 5; i++) { if (rs[i] < mn) mn = rs[i]; if (rs[i] > mx) mx = rs[i]; }
    if (mx - mn === 4) { escalera = true; alta = mx; }
    else if (mx === 14 && cont[2] && cont[3] && cont[4] && cont[5]) { escalera = true; alta = 5; }
  }
  if (escalera && color) return alta === 14 && cont[10] ? 'royal' : 'escColor';
  if (cuatros) return 'poker';
  if (trios && pares) return 'full';
  if (color) return 'color';
  if (escalera) return 'escalera';
  if (trios) return 'trio';
  if (pares === 2) return 'dobles';
  if (pares === 1 && parAlto) return 'pareja';
  return 'nada';
}

function evaluarJugada(mano, mantener) {
  // mano: array de 5 {r,s}; mantener: máscara de 5 bits. Devuelve el pago medio por moneda.
  const usadas = new Set(mano.map((c) => c.r * 4 + c.s));
  const mazo = [];
  for (let r = 2; r <= 14; r++) for (let s = 0; s < 4; s++) if (!usadas.has(r * 4 + s)) mazo.push([r, s]);
  const fijas = mano.filter((_, i) => mantener & (1 << i));
  const k = 5 - fijas.length;
  const rs = new Array(5), ss = new Array(5);
  fijas.forEach((c, i) => { rs[i] = c.r; ss[i] = c.s; });
  let total = 0, n = 0;
  const f = fijas.length;
  function rec(desde, puesto) {
    if (puesto === 5) { total += PAGO[categoria(rs, ss)]; n++; return; }
    for (let i = desde; i < mazo.length; i++) { rs[puesto] = mazo[i][0]; ss[puesto] = mazo[i][1]; rec(i + 1, puesto + 1); }
  }
  rec(0, f);
  return total / n;
}

function mejoresJugadas(mano) {
  const res = [];
  for (let m = 0; m < 32; m++) res.push({ m, ev: evaluarJugada(mano, m) });
  return res.sort((a, b) => b.ev - a.ev);
}

if (require.main === module) {
  const semilla = Number(process.argv[2] || 1), cuantas = Number(process.argv[3] || 10);
  let a = semilla >>> 0;
  const r = () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const out = [];
  while (out.length < cuantas) {
    const mazo = [];
    for (let rr = 2; rr <= 14; rr++) for (let s = 0; s < 4; s++) mazo.push({ r: rr, s });
    for (let i = mazo.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [mazo[i], mazo[j]] = [mazo[j], mazo[i]]; }
    const mano = mazo.slice(0, 5);
    const top = mejoresJugadas(mano).slice(0, 4);
    if (top[0].ev - top[1].ev < 0.03) continue; // empate o diferencia demasiado pequeña: se descarta
    out.push({ mano, top });
  }
  console.log(JSON.stringify(out));
}
module.exports = { categoria, evaluarJugada, mejoresJugadas, PAGO };
