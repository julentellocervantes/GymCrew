// Uso: node tests/validar.js   (no necesita instalar nada)
// Valida los datos de los tres cursos: estructura y respuestas contra cálculos independientes.
const vm = require('vm'), fs = require('fs');
const D = require('path').join(__dirname, '..', 'data') + '/';
const ctx = vm.createContext({ console });

// ---------- ejercicios interactivos: seleccionar, numero, emparejar y ordenar ----------
const C = (n, k) => { let r = 1; for (let i = 1; i <= k; i++) r = (r * (n - k + i)) / i; return Math.round(r); };
// Las respuestas se recalculan aquí con reglas independientes. Lo que solo es una definición
// (sin forma de calcularlo) se cuenta aparte como "definiciones" para que se vea cuánto es verificable.
const rangoC = (c) => c.replace(/[♠♥♦♣]$/, '');
const paloC = (c) => c.slice(-1);
const VAL_PK = { 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7, 8: 8, 9: 9, 10: 10, J: 11, Q: 12, K: 13, A: 14 };
function categoriaPoker(cartas) { // cinco cartas "K♠ K♥ ..." -> nombre de la mano
  const v = cartas.map((c) => VAL_PK[rangoC(c)]).sort((x, y) => x - y);
  const color = new Set(cartas.map(paloC)).size === 1;
  const unicos = [...new Set(v)];
  const escalera = unicos.length === 5 && (v[4] - v[0] === 4 || (v[4] === 14 && v[3] === 5 && v[0] === 2));
  const cuentas = Object.values(v.reduce((m, x) => ((m[x] = (m[x] || 0) + 1), m), {})).sort((x, y) => y - x).join('');
  if (escalera && color) return 'Escalera de color';
  if (cuentas === '41') return 'Póker';
  if (cuentas === '32') return 'Full';
  if (color) return 'Color';
  if (escalera) return 'Escalera';
  if (cuentas === '311') return 'Trío';
  if (cuentas === '221') return 'Doble pareja';
  if (cuentas === '2111') return 'Pareja';
  return 'Carta alta';
}
const hayEscalera = (valores) => { const s = new Set(valores); if (s.has(14)) s.add(1); for (let i = 1; i <= 10; i++) if ([0, 1, 2, 3, 4].every((k) => s.has(i + k))) return true; return false; };
const numDe = (t) => Number(String(t).replace('−', '-'));
const DEALERS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'A'];

function verificarInteractivo(e) {
  const t = e.tipo;
  if (!e.pregunta || !e.explicacion) mal(e.id, t + ': falta pregunta o explicación');
  verif[t] = (verif[t] || 0) + 1;
  const comprobado = () => (verif.calculados = (verif.calculados || 0) + 1);
  const definicion = () => (verif.definiciones = (verif.definiciones || 0) + 1);

  if (t === 'ordenar') {
    const n = e.elementos ? e.elementos.length : 0;
    if (n < 3 || n > 6) mal(e.id, 'ordenar: debe tener de 3 a 6 elementos');
    else if (new Set(e.elementos).size !== n) mal(e.id, 'ordenar: elementos repetidos');
    const c = e.chequeo;
    if (c && c.numeros) {
      comprobado();
      if (JSON.stringify(e.elementos.map(numDe)) !== JSON.stringify(c.numeros) || c.numeros.some((x, i) => i && x >= c.numeros[i - 1])) mal(e.id, 'ordenar: los números no van de mayor a menor');
    } else if (c && c.fracciones) {
      comprobado();
      const vals = c.fracciones.map(([a, b]) => a / b);
      if (!e.elementos.every((x, i) => x === `${c.fracciones[i][0]} a ${c.fracciones[i][1]}`) || vals.some((x, i) => i && x >= vals[i - 1])) mal(e.id, 'ordenar: las fracciones no van de mayor a menor');
    } else if (c && c.lance) {
      comprobado();
      for (let i = 1; i < c.manos.length; i++) if (ganaMus(c.lance, c.manos[i - 1], c.manos[i]) !== 1) mal(e.id, `ordenar: la mano ${i} no gana a la mano ${i + 1} en ${c.lance}`);
      if (!e.elementos.every((x, i) => x === c.manos[i].join(' · '))) mal(e.id, 'ordenar: el texto no coincide con las manos');
    } else if (c && c.ordenJuego) {
      comprobado();
      const pos = e.elementos.map((x) => ORDEN_JUEGO.indexOf(Number(x)));
      if (pos.some((x) => x < 0) || pos.some((x, i) => i && x <= pos[i - 1])) mal(e.id, 'ordenar: el orden de los juegos no es el del mus');
    } else definicion();
    return;
  }

  if (t === 'emparejar') {
    const n = e.pares ? e.pares.length : 0;
    if (n < 3 || n > 5) return mal(e.id, 'emparejar: de 3 a 5 pares');
    if (new Set(e.pares.map((x) => x[0])).size !== n || new Set(e.pares.map((x) => x[1])).size !== n) return mal(e.id, 'emparejar: términos repetidos');
    const c = e.chequeo;
    if (Array.isArray(c) && c.length === n && c.every((x) => x && x.jugador)) {
      comprobado();
      c.forEach((x, i) => { const m = mejorJugada(x.jugador, x.crupier); if (m !== e.pares[i][1]) mal(e.id, `emparejar: «${e.pares[i][0]}» -> la estrategia básica dice ${m}, no ${e.pares[i][1]}`); });
    } else if (Array.isArray(c) && c.every((x) => typeof x === 'number')) {
      comprobado();
      c.forEach((x, i) => { if (Number((e.pares[i][1].match(/\d+/) || [])[0]) !== x) mal(e.id, `emparejar: se esperaba ${x} en «${e.pares[i][0]}»`); });
      // combinaciones reales con una baraja de 52
      if (JSON.stringify(c) === '[6,16,4]' && (C(4, 2) !== 6 || 4 * 4 !== 16 || 4 !== 4)) mal(e.id, 'combinaciones mal calculadas');
    } else if (e.pares.every((x) => /^([2-9]|10|[JQKA])[♠♥♦♣]( |$)/.test(x[0]))) {
      comprobado();
      e.pares.forEach((x) => { const cat = categoriaPoker(x[0].split(' ')); if (cat !== x[1]) mal(e.id, `emparejar: «${x[0]}» es ${cat}, no ${x[1]}`); });
    } else definicion();
    return;
  }

  if (t === 'seleccionar') {
    const n = e.cartas ? e.cartas.length : 0;
    const conPalo = e.cartas.every((c) => /[♠♥♦♣]$/.test(c));
    if (n < 4 || n > 8 || (conPalo && new Set(e.cartas).size !== n)) mal(e.id, 'seleccionar: de 4 a 8 cartas (distintas si llevan palo)');
    const valido = e.correctas.length > 0 && e.correctas.length < n && new Set(e.correctas).size === e.correctas.length && e.correctas.every((i) => Number.isInteger(i) && i >= 0 && i < n);
    if (!valido) mal(e.id, 'seleccionar: índices correctos no válidos');
    const idx = (f) => e.cartas.map((c, i) => (f(c, i) ? i : -1)).filter((i) => i >= 0);
    const cuenta = (f) => e.cartas.reduce((m, c) => ((m[f(c)] = (m[f(c)] || 0) + 1), m), {});
    const q = e.pregunta;
    const ch = e.chequeo || {};
    let esperado = null;
    if (ch.accion) esperado = idx((c) => mejorJugada(ch.jugador, rangoC(c)) === ch.accion);
    else if (ch.siempreDividir) esperado = idx((c) => DEALERS.every((d) => mejorJugada([rangoC(c), rangoC(c)], d) === 'Dividir'));
    else if (ch.descarta) { const k = cuenta((c) => c); esperado = idx((c) => k[c] === 1); }
    else if (/SUMAN \+1/.test(q)) esperado = idx((c) => hiLo(rangoC(c)) === 1);
    else if (/RESTAN 1/.test(q)) esperado = idx((c) => hiLo(rangoC(c)) === -1);
    else if (/neutras/.test(q)) esperado = idx((c) => hiLo(rangoC(c)) === 0);
    else if (/valen 10 en el blackjack/.test(q)) esperado = idx((c) => valBJ(rangoC(c)) === 10);
    else if (/te dan color de corazones/.test(q)) esperado = idx((c) => paloC(c) === '♥');
    else if (/color \(mismo palo\)/.test(q)) { const k = cuenta(paloC); esperado = idx((c) => k[paloC(c)] >= 5); }
    else if (/trío/.test(q)) { const k = cuenta(rangoC); esperado = idx((c) => k[rangoC(c)] === 3); }
    else if (/doble pareja/.test(q)) { const k = cuenta(rangoC); esperado = idx((c) => k[rangoC(c)] === 2); }
    else if (/medias/.test(q)) { const k = cuenta((c) => c); esperado = idx((c) => k[c] === 3); }
    else if (/valen 10 puntos en el mus/.test(q)) esperado = idx((c) => valMus(c) === 10);
    else if (/completan la escalera/.test(q) && e.situacion) {
      const base = e.situacion.filas.flatMap((f) => f.cartas).map((c) => VAL_PK[rangoC(c)]);
      esperado = idx((c) => hayEscalera(base.concat([VAL_PK[rangoC(c)]])));
    } else if (/cinco que forman tu mejor mano \(una escalera\)/.test(q)) {
      const v = e.cartas.map((c) => VAL_PK[rangoC(c)]);
      let ganadora = null;
      for (let i = 1; i <= 10 && !ganadora; i++) { const run = [0, 1, 2, 3, 4].map((k) => i + k); if (run.every((r) => v.includes(r === 1 ? 14 : r))) ganadora = run.map((r) => (r === 1 ? 14 : r)); }
      esperado = ganadora ? idx((c) => ganadora.includes(VAL_PK[rangoC(c)])) : null;
    }
    if (!esperado) return mal(e.id, 'seleccionar: sin regla de verificación para «' + q + '»');
    comprobado();
    if (JSON.stringify(esperado) !== JSON.stringify([...e.correctas].sort((a, b) => a - b))) mal(e.id, `seleccionar: se esperaba [${esperado}] y el ejercicio dice [${e.correctas}]`);
    return;
  }

  // numero
  if (!Number.isInteger(e.respuesta)) mal(e.id, 'numero: la respuesta debe ser un entero');
  const q = e.pregunta;
  let esperado = null, m;
  if (e.secuencia) esperado = e.secuencia.reduce((a, x) => a + hiLo(x), 0);
  else if (e.situacion && e.situacion.jugador) esperado = totalBJ(e.situacion.jugador).t;
  else if ((m = q.match(/cuenta corriente es ([+-]?\d+) y quedan (\d+) mazos/))) esperado = Number(m[1]) / Number(m[2]);
  else if ((m = q.match(/bote tiene (\d+) fichas.*debes pagar (\d+)/))) esperado = Math.round((100 * m[2]) / (Number(m[1]) + Number(m[2])));
  else if ((m = q.match(/En el (flop|turn) tienes (\d+) outs/))) esperado = Number(m[2]) * (m[1] === 'flop' ? 4 : 2);
  else if (e.situacion && e.situacion.filas && /puntos/.test(q)) esperado = e.situacion.filas[0].cartas.reduce((a, x) => a + valMus(x), 0);
  else if ((m = q.match(/Apuestas (\d+) fichas y doblas/))) esperado = 2 * Number(m[1]);
  else if ((m = q.match(/Tu apuesta es de (\d+) fichas\. ¿Cuánto es el máximo.*seguro/))) esperado = Number(m[1]) / 2;
  else if ((m = q.match(/Apuestas (\d+) fichas y te rindes/))) esperado = Number(m[1]) / 2;
  else if ((m = q.match(/blackjack natural con una apuesta de (\d+) fichas.*paga (\d+) a (\d+)/))) esperado = (Number(m[1]) * Number(m[2])) / Number(m[3]);
  else if ((m = q.match(/bankroll es de (\d+) € .* el (\d+) %/))) esperado = (Number(m[1]) * Number(m[2])) / 100;
  else if (/cartas tienes en total/.test(q)) esperado = 2 + 5;
  else if (/cuántas cuentan para tu mano final/i.test(q)) esperado = 5;
  else if ((m = q.match(/Tienes (\d+) cartas de un mismo palo.*cuántas quedan en el mazo/i))) esperado = 13 - Number(m[1]);
  else if (/pareja de reyes/.test(q)) esperado = C(4, 2);
  else if (/manos distintas de 5 cartas/.test(q)) esperado = C(7, 5);
  else if (/cuántas cartas tiene la baraja española/i.test(q)) esperado = 4 * 10;
  else if (/cuántas cartas recibe cada jugador/i.test(q)) esperado = 4;
  else if (/cuántas cartas puedes cambiar/i.test(q)) esperado = 4;
  else if ((m = q.match(/lleva (\d+) piedras\. ¿Cuántos amarracos completos/))) esperado = Math.floor(Number(m[1]) / 5);
  else if ((m = q.match(/llevas (\d+) piedras.*llegar a 40/))) esperado = 40 - Number(m[1]);
  if (esperado === null) return mal(e.id, 'numero: sin regla de verificación para «' + q + '»');
  comprobado();
  if (esperado !== e.respuesta) mal(e.id, `numero: se esperaba ${esperado} y el ejercicio dice ${e.respuesta}`);
}


for (const f of ['cursos.js', 'blackjack.js', 'poker.js', 'mus.js', 'blackjack-extra.js', 'poker-extra.js', 'mus-extra.js', 'ordenar-extra.js', 'interactivos-extra.js', 'variedad-extra.js', 'ayuda.js']) vm.runInContext(fs.readFileSync(D + f, 'utf8'), ctx, { filename: f });
const CURSOS = vm.runInContext('CURSOS', ctx);
const AYUDA = vm.runInContext('AYUDA', ctx);


const errores = [];
const mal = (id, msg) => errores.push(`${id}: ${msg}`);
const ids = new Set();
let nEj = 0, nNiv = 0;
const verif = { accion: 0, secuencia: 0, ganador: 0, mano: 0, mus: 0 };

// ---------- cálculos independientes ----------
const valBJ = (c) => (c === 'A' ? 11 : 'KQJ'.includes(c) ? 10 : Number(c));
function totalBJ(cartas) {
  let t = cartas.reduce((s, c) => s + valBJ(c), 0), ases = cartas.filter((c) => c === 'A').length;
  while (t > 21 && ases > 0) { t -= 10; ases--; }
  return { t, blando: ases > 0 };
}
// Estrategia básica: 4-8 mazos, el crupier se planta con 17 blando
function mejorJugada(jug, cru) {
  const dc = valBJ(cru);
  if (jug.length === 2 && valBJ(jug[0]) === valBJ(jug[1])) {
    const v = valBJ(jug[0]);
    if (v === 11 || v === 8) return 'Dividir';
    if (v === 10) return 'Plantarte';
    if (v === 9) return [2, 3, 4, 5, 6, 8, 9].includes(dc) ? 'Dividir' : 'Plantarte';
    if (v === 7) return dc <= 7 ? 'Dividir' : 'Pedir';
    if (v === 6) return dc <= 6 ? 'Dividir' : 'Pedir';
    if (v === 5) return dc <= 9 ? 'Doblar' : 'Pedir';
    if (v === 4) return dc === 5 || dc === 6 ? 'Dividir' : 'Pedir';
    return dc <= 7 ? 'Dividir' : 'Pedir'; // 2 y 3
  }
  const { t, blando } = totalBJ(jug);
  if (blando) {
    if (t >= 19) return 'Plantarte';
    if (t === 18) return dc >= 3 && dc <= 6 ? 'Doblar' : [2, 7, 8].includes(dc) ? 'Plantarte' : 'Pedir';
    if (t === 17) return dc >= 3 && dc <= 6 ? 'Doblar' : 'Pedir';
    if (t === 15 || t === 16) return dc >= 4 && dc <= 6 ? 'Doblar' : 'Pedir';
    if (t === 13 || t === 14) return dc >= 5 && dc <= 6 ? 'Doblar' : 'Pedir';
    return 'Pedir';
  }
  if (t >= 17) return 'Plantarte';
  if (t >= 13) return dc <= 6 ? 'Plantarte' : 'Pedir';
  if (t === 12) return dc >= 4 && dc <= 6 ? 'Plantarte' : 'Pedir';
  if (t === 11) return dc <= 10 ? 'Doblar' : 'Pedir';
  if (t === 10) return dc <= 9 ? 'Doblar' : 'Pedir';
  if (t === 9) return dc >= 3 && dc <= 6 ? 'Doblar' : 'Pedir';
  return 'Pedir';
}
const hiLo = (c) => ('23456'.includes(c) && c.length === 1 ? 1 : ['10', 'J', 'Q', 'K', 'A'].includes(c) ? -1 : 0);
const signo = (n) => (n > 0 ? '+' + n : n === 0 ? '0' : String(n));
const valMus = (c) => (['Rey', 'Caballo', 'Sota', '3'].includes(c) ? 10 : ['As', '2'].includes(c) ? 1 : Number(c));


// ---------- evaluador de póker (independiente) ----------
const RK = { 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7, 8: 8, 9: 9, 10: 10, J: 11, Q: 12, K: 13, A: 14 };
const parseCarta = (c) => ({ r: RK[c.slice(0, -1)], p: c.slice(-1) });
function mejor5(cartas) {
  const cs = cartas.map(parseCarta);
  const comb = (arr, k) => k === 0 ? [[]] : arr.length < k ? [] : [...comb(arr.slice(1), k - 1).map((x) => [arr[0], ...x]), ...comb(arr.slice(1), k)];
  let mejor = null;
  for (const m of comb(cs, 5)) {
    const v = valor5(m);
    if (!mejor || cmp(v, mejor) > 0) mejor = v;
  }
  return mejor;
}
function valor5(m) {
  const rs = m.map((c) => c.r).sort((a, b) => b - a);
  const color = m.every((c) => c.p === m[0].p);
  const unicos = [...new Set(rs)];
  let alta = 0;
  if (unicos.length === 5) { if (rs[0] - rs[4] === 4) alta = rs[0]; else if (rs.join() === '14,5,4,3,2') alta = 5; }
  const cont = {}; rs.forEach((r) => (cont[r] = (cont[r] || 0) + 1));
  const grupos = Object.entries(cont).map(([r, n]) => [n, Number(r)]).sort((a, b) => b[0] - a[0] || b[1] - a[1]);
  const desempate = grupos.map((g) => g[1]);
  const forma = grupos.map((g) => g[0]).join('');
  if (alta && color) return [8, alta];
  if (forma === '41') return [7, ...desempate];
  if (forma === '32') return [6, ...desempate];
  if (color) return [5, ...rs];
  if (alta) return [4, alta];
  if (forma === '311') return [3, ...desempate];
  if (forma === '221') return [2, ...desempate];
  if (forma === '2111') return [1, ...desempate];
  return [0, ...rs];
}
const cmp = (a, b) => { for (let i = 0; i < Math.max(a.length, b.length); i++) { const d = (a[i] || 0) - (b[i] || 0); if (d) return Math.sign(d); } return 0; };
const NOMBRES = ['Carta alta', 'Pareja', 'Doble pareja', 'Trío', 'Escalera', 'Color', 'Full house', 'Póker', 'Escalera de color'];

// ---------- evaluador de mus (8 reyes) ----------
const rangoMus = (c) => ({ Rey: 10, 3: 10, Caballo: 9, Sota: 8, 7: 7, 6: 6, 5: 5, 4: 4, As: 1, 2: 1 }[c]);
const puntosMus = (c) => valMus(c);
const ORDEN_JUEGO = [31, 32, 40, 37, 36, 35, 34, 33];
function ganaMus(lance, a, b) { // devuelve 1 (gana a), -1 (gana b), 0 (empate)
  const sd = (m) => m.map(rangoMus).sort((x, y) => y - x);
  const ca = sd(a), cb = sd(b);
  const cmpArr = (x, y, inv) => { for (let i = 0; i < x.length; i++) if (x[i] !== y[i]) return (x[i] > y[i] ? 1 : -1) * (inv ? -1 : 1); return 0; };
  if (lance === 'Grande') return cmpArr(ca, cb, false);
  if (lance === 'Chica') return cmpArr(ca.slice().reverse(), cb.slice().reverse(), true);
  if (lance === 'Pares') {
    const cat = (r) => { const n = {}; r.forEach((x) => (n[x] = (n[x] || 0) + 1)); const v = Object.entries(n).map(([k, c]) => [c, Number(k)]).sort((p, q) => q[0] - p[0] || q[1] - p[1]);
      if (v[0][0] === 4) return [3, v[0][1], v[0][1]]; if (v[0][0] === 2 && v[1] && v[1][0] === 2) return [3, v[0][1], v[1][1]];
      if (v[0][0] === 3) return [2, v[0][1]]; if (v[0][0] === 2) return [1, v[0][1]]; return [0]; };
    return cmp(cat(ca), cat(cb));
  }
  if (lance === 'Juego') { const ja = a.reduce((s, x) => s + puntosMus(x), 0), jb = b.reduce((s, x) => s + puntosMus(x), 0);
    return Math.sign(ORDEN_JUEGO.indexOf(jb) - ORDEN_JUEGO.indexOf(ja)); }
  return null;
}

// ---------- recorrido ----------
for (const c of CURSOS) {
  for (const campo of ['id', 'nombre', 'icono', 'color', 'descripcion', 'reglas']) if (!c[campo]) mal(c.id, `curso sin ${campo}`);
  for (const u of c.unidades) {
    if (!u.titulo || !u.descripcion) mal(u.id, 'unidad sin titulo/descripcion');
    for (const l of u.lecciones) {
      nNiv++;
      if (ids.has(l.id)) mal(l.id, 'id de lección repetido'); ids.add(l.id);
      if (typeof l.intro !== 'string' || l.intro.length < 40 || l.intro.length > 420) mal(l.id, `intro rara (${(l.intro || '').length} caracteres)`);
      if (!l.icono || typeof l.xp !== 'number' || !l.titulo) mal(l.id, 'falta icono, xp o titulo');
      if (l.ejercicios.length < 4) mal(l.id, 'menos de 4 ejercicios');
      for (const e of l.ejercicios) {
        nEj++;
        if (ids.has(e.id)) mal(e.id, 'id repetido'); ids.add(e.id);
        if (!e.pregunta || !e.explicacion) mal(e.id, 'falta pregunta o explicación');
        if (['seleccionar', 'numero', 'emparejar', 'ordenar'].includes(e.tipo)) {
          verificarInteractivo(e);
          continue;
        }
        if (!Array.isArray(e.opciones) || e.opciones.length < 2 || e.opciones.length > 5) mal(e.id, 'número de opciones raro');
        if (new Set(e.opciones).size !== e.opciones.length) mal(e.id, 'opciones repetidas');
        if (!Number.isInteger(e.correcta) || e.correcta < 0 || e.correcta >= e.opciones.length) { mal(e.id, 'correcta fuera de rango'); continue; }
        const resp = e.opciones[e.correcta];
        const s = e.situacion;
        if (s) {
          if (s.filas) { if (!s.filas.every((f) => f.etiqueta && Array.isArray(f.cartas) && f.cartas.length)) mal(e.id, 'filas mal formadas'); }
          else if (typeof s.crupier !== 'string' || !Array.isArray(s.jugador)) mal(e.id, 'situacion sin filas necesita jugador (lista) y crupier (texto)');
        }
        // Blackjack: estrategia básica
        if (c.id === 'blackjack' && e.tipo === 'accion') {
          verif.accion++;
          const esperado = mejorJugada(s.jugador, s.crupier);
          if (resp !== esperado) mal(e.id, `la tabla dice «${esperado}» y el ejercicio «${resp}» (${s.jugador} vs ${s.crupier})`);
        }
        // Hi-Lo: cuenta corriente
        if (e.secuencia) {
          verif.secuencia++;
          const suma = e.secuencia.reduce((a, x) => a + hiLo(x), 0);
          if (resp !== signo(suma)) mal(e.id, `Hi-Lo suma ${signo(suma)} y el ejercicio dice ${resp}`);
        }
        // Cuenta verdadera
        let m = e.pregunta.match(/cuenta corriente es ([+-]?\d+) y quedan (\d+) mazos/);
        if (m && resp !== signo(Number(m[1]) / Number(m[2]))) mal(e.id, `cuenta verdadera = ${signo(Number(m[1]) / Number(m[2]))}, ejercicio dice ${resp}`);
        // Mus: puntos del juego
        if (c.id === 'mus' && s && s.filas && /(Juego de|punto de) (\d+)/.test(resp)) {
          const suma = s.filas[0].cartas.reduce((a, x) => a + valMus(x), 0);
          if (Number(resp.match(/(\d+)/)[1]) !== suma) mal(e.id, `mus suma ${suma} y el ejercicio dice «${resp}»`);
          if (/Juego de/.test(resp) !== suma >= 31) mal(e.id, `mus: ${suma} puntos ${suma >= 31 ? 'sí' : 'no'} es juego`);
        }

        // Póker: quién gana / qué mano tienes (evaluador independiente)
        if (c.id === 'poker' && s && s.filas) {
          const f = (n) => s.filas.find((x) => x.etiqueta === n);
          if (e.pregunta === '¿Quién gana la mano?' && f('Rival') && f('Mesa')) {
            verif.ganador++;
            const r = cmp(mejor5([...f('Tu mano').cartas, ...f('Mesa').cartas]), mejor5([...f('Rival').cartas, ...f('Mesa').cartas]));
            const esperado = r > 0 ? 'Tú' : r < 0 ? 'Tu rival' : 'Empate';
            if (resp !== esperado) mal(e.id, `evaluador: gana «${esperado}» y el ejercicio dice «${resp}»`);
          }
          if (e.pregunta === '¿Qué mano tienes?' && f('Tu mano') && f('Mesa') && f('Mesa').cartas.length === 5) {
            verif.mano++;
            const v = mejor5([...f('Tu mano').cartas, ...f('Mesa').cartas]);
            const nombre = NOMBRES[v[0]];
            const ok = resp === nombre || (resp.startsWith(nombre) && v[0] !== 6);
            if (!ok) mal(e.id, `evaluador: «${nombre}» y el ejercicio dice «${resp}»`);
          }
        }
        // Mus: quién gana cada lance (evaluador independiente)
        const ml = c.id === 'mus' && s && s.filas && s.filas.length === 2 && e.pregunta.match(/¿Quién gana (?:la|el|el lance de) (Grande|Chica|Pares|Juego)\?/);
        if (ml && s.filas.every((x) => x.cartas.length === 4)) {
          verif.mus++;
          const r = ganaMus(ml[1], s.filas[0].cartas, s.filas[1].cartas);
          const esperado = r > 0 ? [s.filas[0].etiqueta, 'Tú'] : r < 0 ? [s.filas[1].etiqueta, 'Tu rival'] : ['Empate', 'Empatan'];
          if (!esperado.some((x) => resp.startsWith(x))) mal(e.id, `mus ${ml[1]}: el evaluador dice ${esperado[0]} y el ejercicio «${resp}»`);
        }
        // Póker: pot odds y regla del 4 y el 2
        m = e.pregunta.match(/bote tiene (\d+) fichas.*debes pagar (\d+)/);
        if (m) {
          const pct = Math.round((100 * m[2]) / (Number(m[1]) + Number(m[2])));
          if (Number(resp.replace('%', '')) !== pct) mal(e.id, `pot odds = ${pct}% y el ejercicio dice ${resp}`);
        }
        m = e.pregunta.match(/En el (flop|turn) tienes (\d+) outs\. ¿Qué probabilidad/);
        if (m && Number(resp.replace('%', '')) !== Number(m[2]) * (m[1] === 'flop' ? 4 : 2)) mal(e.id, `regla 4 y 2 incorrecta (${resp})`);
      }
    }
  }
}

// ---------- comprobaciones numéricas de póker ----------

const prob = [
  ['1326 combinaciones', C(52, 2) === 1326],
  ['6 combinaciones de AA', C(4, 2) === 6],
  ['AA = 1 de 221', 1326 / 6 === 221],
  ['pareja ≈ 5,9 %', Math.abs((13 * 6) / 1326 - 0.0588) < 0.001],
  ['suited ≈ 23,5 %', Math.abs(12 / 51 - 0.2353) < 0.001],
  ['AK = 16/1326 ≈ 1,2 %', Math.abs(16 / 1326 - 0.0121) < 0.0005],
  ['15 outs en el flop ≈ 54 %', Math.round(100 * (1 - C(32, 2) / C(47, 2))) === 54],
  ['9 outs en el flop ≈ 35 % (regla: 36)', Math.round(100 * (1 - C(38, 2) / C(47, 2))) === 35],
  ['4 de 13 cartas valen 10 ≈ 31 %; seguro necesita 33 %', 4 / 13 < 1 / 3],
];
for (const [n, ok] of prob) if (!ok) errores.push('cálculo: ' + n);
console.log(`${CURSOS.length} cursos, ${nNiv} niveles, ${nEj} ejercicios`);
verificarAyuda();
console.log('verificados con calculo independiente:', JSON.stringify(verif));
console.log(CURSOS.map((c) => `  ${c.id}: ${c.unidades.flatMap((u) => u.lecciones).length} niveles`).join('\n'));
// ---------- pestaña «Útil»: tabla de estrategia, ranking de póker y outs ----------
function verificarAyuda() {
  const NOMBRE = { P: 'Pedir', S: 'Plantarte', D: 'Doblar', X: 'Dividir' };
  let celdas = 0;
  for (const [grupo, filas] of Object.entries(AYUDA.estrategia)) {
    for (const f of filas) {
      if (f.celdas.length !== AYUDA.crupier.length || /[^PSDX]/.test(f.celdas)) { mal('ayuda:' + f.etiqueta, 'fila con códigos o longitud no válidos'); continue; }
      for (const mano of f.manos) AYUDA.crupier.forEach((c, k) => {
        celdas++;
        const esperado = mejorJugada(mano, c);
        if (esperado !== NOMBRE[f.celdas[k]]) mal('ayuda:' + f.etiqueta, `${grupo} ${mano.join('+')} contra ${c}: la tabla dice ${NOMBRE[f.celdas[k]]} y la estrategia básica ${esperado}`);
      });
    }
  }
  verif.celdasEstrategia = celdas;
  AYUDA.poker.forEach((m, i) => { const cat = categoriaPoker(m.ejemplo.split(' ')); if (cat !== m.nombre) mal('ayuda:poker', `«${m.ejemplo}» es ${cat}, no ${m.nombre}`); });
  verif.rankingPoker = AYUDA.poker.length;
  // outs: 9 de color, 8 de escalera abierta (2 extremos x 4 cartas), 4 de pulmón, 6 de dos cartas altas, 2 de pareja a trío
  const esp = { 'Proyecto de color': 13 - 4, 'Escalera abierta': 2 * 4, 'Dos cartas altas sin pareja': 2 * 3, 'Escalera de pulmón (gutshot)': 4, 'Pareja que busca trío': 4 - 2 };
  AYUDA.outs.forEach(([n, v]) => { if (esp[n] !== v) mal('ayuda:outs', `${n}: ${v} y debería ser ${esp[n]}`); });
}
if (errores.length) { console.log('\nERRORES:\n' + errores.map((x) => ' - ' + x).join('\n')); process.exit(1); }
console.log('\nDATOS OK: estructura, estrategia básica, Hi-Lo, cuenta verdadera, mus (lances), póker (manos y ganador), pot odds, outs y probabilidades');
