// Genera data/videopoker-datos.js: manos de vídeo póker con sus mejores jugadas (EV exacto por enumeración).
// Uso: node tools/armar-datos-videopoker.js   (tarda unos segundos)
const fs = require('fs');
const { categoria, mejoresJugadas } = require('./generar-videopoker.js');

const SIMB = ['♠', '♥', '♦', '♣'], NOM = { 11: 'J', 12: 'Q', 13: 'K', 14: 'A' };
const nombre = (c) => (NOM[c.r] || String(c.r)) + SIMB[c.s];
const indices = (m) => [0, 1, 2, 3, 4].filter((i) => m & (1 << i));

function tipo(mano, m) {
  const h = indices(m).map((i) => mano[i]);
  const n = h.length;
  if (n === 0) return 'nada';
  const cont = {};
  h.forEach((c) => (cont[c.r] = (cont[c.r] || 0) + 1));
  const grupos = Object.entries(cont).map(([r, k]) => [k, Number(r)]).sort((a, b) => b[0] - a[0] || b[1] - a[1]);
  if (n === 5) return 'hecha';
  if (grupos[0][0] === 4) return 'poker';
  if (grupos[0][0] === 3) return 'trio';
  if (grupos[0][0] === 2 && grupos[1] && grupos[1][0] === 2) return 'dobles';
  if (grupos[0][0] === 2) return grupos[0][1] >= 11 ? 'pareja alta' : 'pareja baja';
  const mismoPalo = h.every((c) => c.s === h[0].s);
  const rs = h.map((c) => c.r).sort((a, b) => a - b);
  if (n === 4 && mismoPalo && rs[0] >= 10) return '4 escalera real';
  if (n === 4 && mismoPalo) return '4 color';
  if (n === 4 && rs[3] - rs[0] === 3) return '4 escalera';
  if (n === 3 && mismoPalo && rs[0] >= 10) return '3 escalera real';
  if (rs.every((r) => r >= 11)) return 'altas';
  return 'otra';
}

let a = 20261112;
const r = () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const rnd = (n) => Math.floor(r() * n);
const barajar = (xs) => { const b = xs.slice(); for (let i = b.length - 1; i > 0; i--) { const j = rnd(i + 1); [b[i], b[j]] = [b[j], b[i]]; } return b; };
const todas = [];
for (let rr = 2; rr <= 14; rr++) for (let s = 0; s < 4; s++) todas.push({ r: rr, s });

// Construye una mano que probablemente tenga la jugada pedida; el resultado real lo decide el cálculo exacto.
function armar(objetivo) {
  const mano = [];
  const tiene = (c) => mano.some((x) => x.r === c.r && x.s === c.s);
  const poner = (c) => { if (!tiene(c)) mano.push(c); };
  const palo = rnd(4);
  const par = (rangos) => { const rg = rangos[rnd(rangos.length)]; barajar([0, 1, 2, 3]).slice(0, 2).forEach((s) => poner({ r: rg, s })); };
  const altos = [10, 11, 12, 13, 14];
  if (objetivo === 'pareja alta') par([11, 12, 13, 14]);
  if (objetivo === 'pareja baja') par([2, 3, 4, 5, 6, 7, 8, 9, 10]);
  if (objetivo === 'dobles') { par([2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]); par([2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]); }
  if (objetivo === 'trio') { const rg = 2 + rnd(13); barajar([0, 1, 2, 3]).slice(0, 3).forEach((s) => poner({ r: rg, s })); }
  if (objetivo === 'poker') { const rg = 2 + rnd(13); [0, 1, 2, 3].forEach((s) => poner({ r: rg, s })); }
  if (objetivo === '4 color') barajar(todas.filter((c) => c.s === palo)).slice(0, 4).forEach(poner);
  if (objetivo === '4 escalera real') barajar(altos).slice(0, 4).forEach((rg) => poner({ r: rg, s: palo }));
  if (objetivo === '3 escalera real') barajar(altos).slice(0, 3).forEach((rg) => poner({ r: rg, s: palo }));
  if (objetivo === '4 escalera') { const b = 2 + rnd(10); [0, 1, 2, 3].forEach((k, i) => poner({ r: b + i, s: rnd(4) })); }
  if (objetivo === 'altas') barajar(altos.slice(1)).slice(0, 2 + rnd(2)).forEach((rg) => poner({ r: rg, s: rnd(4) }));
  if (objetivo === 'hecha') {
    const k = rnd(3);
    if (k === 0) { const b = 2 + rnd(9); for (let i = 0; i < 5; i++) poner({ r: b + i, s: rnd(4) }); }
    if (k === 1) barajar(todas.filter((c) => c.s === palo)).slice(0, 5).forEach(poner);
    if (k === 2) { const x = 2 + rnd(13); let y = 2 + rnd(13); if (y === x) y = x === 14 ? 2 : x + 1; barajar([0, 1, 2, 3]).slice(0, 3).forEach((s) => poner({ r: x, s })); barajar([0, 1, 2, 3]).slice(0, 2).forEach((s) => poner({ r: y, s })); }
  }
  for (const c of barajar(todas)) { if (mano.length >= 5) break; poner(c); }
  return barajar(mano.slice(0, 5));
}

const objetivos = ['hecha', 'poker', 'trio', 'dobles', 'pareja alta', 'pareja baja', '4 escalera real', '4 color', '4 escalera', '3 escalera real', 'altas', 'nada'];
const POR_TIPO = 24;
const filas = [], cuenta = {};
let intentos = 0;
for (const obj of objetivos) {
  let fallos = 0;
  while ((cuenta[obj] || 0) < POR_TIPO && fallos < 120) {
    intentos++;
    const mano = armar(obj);
    const top = mejoresJugadas(mano);
    if (top[0].ev - top[1].ev < 0.03) { fallos++; continue; }
    const t = tipo(mano, top[0].m);
    if (t !== obj) { fallos++; continue; }
    if (filas.some((f) => f.c.join() === mano.map(nombre).join())) continue;
    cuenta[t] = (cuenta[t] || 0) + 1;
    const alternativas = [];
    for (const x of top.slice(1)) if (alternativas.length < 3 && top[0].ev - x.ev >= 0.03 && alternativas.every((y) => Math.abs(y.ev - x.ev) > 0.0005)) alternativas.push(x);
    filas.push({ c: mano.map(nombre), m: indices(top[0].m), ev: +top[0].ev.toFixed(4), t, alt: alternativas.map((x) => ({ m: indices(x.m), ev: +x.ev.toFixed(4) })) });
  }
}
console.error(JSON.stringify(cuenta), filas.length, 'manos en', intentos, 'intentos');
const cab = '// MANOS DE VÍDEO PÓKER (Jacks or Better 9/6) con su mejor jugada, calculada por enumeración exacta.\n// c = cartas, m = posiciones que se guardan, ev = pago medio por moneda, t = tipo de jugada, alt = otras jugadas peores.\n// Generado con tools/armar-datos-videopoker.js; tests/validar.js lo recalcula con otro código.\n';
fs.writeFileSync(__dirname + '/../data/videopoker-datos.js', cab + 'const VP_MANOS = ' + JSON.stringify(filas) + ';\n');
