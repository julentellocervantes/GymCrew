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


// ---------- formas nuevas de responder: clasificar, deslizador y rellenar ----------
function verificarNuevos(e) {
  const t = e.tipo, ch = e.chequeo || {};
  verif[t] = (verif[t] || 0) + 1;
  const calculado = () => (verif.calculados = (verif.calculados || 0) + 1);
  const definicion = () => (verif.definiciones = (verif.definiciones || 0) + 1);
  if (t === 'clasificar') {
    const nc = e.categorias.length, n = e.elementos.length;
    if (nc < 2 || nc > 3 || new Set(e.categorias).size !== nc) return mal(e.id, 'clasificar: de 2 a 3 cajones distintos');
    if (n < 4 || n > 8 || new Set(e.elementos.map((x) => x[0])).size !== n) return mal(e.id, 'clasificar: de 4 a 8 elementos distintos');
    if (!e.elementos.every((x) => Number.isInteger(x[1]) && x[1] >= 0 && x[1] < nc)) return mal(e.id, 'clasificar: cajón fuera de rango');
    for (let k = 0; k < nc; k++) if (!e.elementos.some((x) => x[1] === k)) return mal(e.id, 'clasificar: un cajón queda vacío');
    const esperado = (texto) => {
      if (ch.valor10) return valBJ(rangoC(texto)) === 10 ? 'Vale 10' : 'Vale 2 a 9';
      if (ch.hilo) return signo(hiLo(rangoC(texto))).replace('-', '−');
      if (ch.valMus) { const v = valMus(texto); return v === 10 ? 'Vale 10' : v === 1 ? 'Vale 1' : 'Vale su número'; }
      if (ch.bacVal) return ['10', 'J', 'Q', 'K'].includes(rangoC(texto)) ? 'Vale 0' : 'Vale 1 a 9';
      if (ch.pk) return categoriaPoker(texto.split(' '));
      if (ch.vpPaga) {
        const cartas = texto.split(' '), cat = categoriaPoker(cartas);
        const paga = cat !== 'Carta alta' && !(cat === 'Pareja' && !Object.entries(cartas.reduce((m, c) => ((m[rangoC(c)] = (m[rangoC(c)] || 0) + 1), m), {})).some(([r, n2]) => n2 === 2 && VAL_PK[r] >= 11));
        return paga ? 'Paga' : 'No paga';
      }
      return null;
    };
    if (ch.bj) {
      calculado();
      if (ch.bj.manos.length !== n) return mal(e.id, 'clasificar: manos y elementos no coinciden');
      e.elementos.forEach(([txt, k], i) => {
        if (txt !== ch.bj.manos[i].join(' + ')) mal(e.id, `clasificar: el texto «${txt}» no coincide con la mano`);
        const m = mejorJugada(ch.bj.manos[i], ch.bj.crupier);
        if (e.categorias[k] !== m) mal(e.id, `clasificar: ${txt} contra ${ch.bj.crupier} es «${m}», no «${e.categorias[k]}»`);
      });
    } else if (ch.bacJugador) {
      calculado();
      e.elementos.forEach(([txt, k], i) => {
        const tot = ch.bacJugador[i];
        const c = tot >= 8 ? 'Natural' : tot >= 6 ? 'Se planta' : 'Pide carta';
        if (txt !== 'Total ' + tot || e.categorias[k] !== c) mal(e.id, `clasificar: con ${tot} el Jugador «${c}»`);
      });
    } else if (ch.valor10 || ch.hilo || ch.valMus || ch.bacVal || ch.pk || ch.vpPaga) {
      calculado();
      e.elementos.forEach(([txt, k]) => {
        const c = esperado(txt);
        if (e.categorias[k] !== c) mal(e.id, `clasificar: «${txt}» va a «${c}», no a «${e.categorias[k]}»`);
      });
      if (ch.hilo && JSON.stringify(e.categorias) !== JSON.stringify(['+1', '0', '−1'])) mal(e.id, 'clasificar: los cajones del Hi-Lo deben ser +1, 0 y −1');
    } else definicion();
    return;
  }
  if (t === 'deslizador') {
    const { min, max, paso, respuesta, tolerancia } = e;
    if (![min, max, paso, respuesta, tolerancia].every(Number.isFinite) || min >= max || paso <= 0) return mal(e.id, 'deslizador: números raros');
    if (respuesta < min || respuesta > max || (respuesta - min) % paso !== 0) return mal(e.id, 'deslizador: la respuesta no cae en el control');
    if (tolerancia < 0 || tolerancia > (max - min) / 8) return mal(e.id, 'deslizador: tolerancia demasiado grande');
    let esperado = null;
    if (ch.cuentaVerdadera) { const [c, m] = ch.cuentaVerdadera; esperado = c / m; if (!Number.isInteger(esperado)) return mal(e.id, 'deslizador: la cuenta verdadera debe ser entera'); }
    else if (ch.pago) { const [ap, a, b] = ch.pago; esperado = (ap / b) * a; }
    else if (ch.potOdds) { const [bote, pagar] = ch.potOdds; esperado = (100 * pagar) / (bote + pagar); if (Math.abs(esperado - respuesta) > tolerancia) return mal(e.id, `deslizador: pot odds ${esperado}, no ${respuesta}`); esperado = respuesta; }
    else if (ch.outs) {
      const o = ch.outs.n, exacto = ch.outs.fase === 'flop' ? (1 - ((47 - o) * (46 - o)) / (47 * 46)) * 100 : (o / 46) * 100;
      if (respuesta !== o * (ch.outs.fase === 'flop' ? 4 : 2)) return mal(e.id, 'deslizador: la regla del 4 y el 2 da otra cifra');
      if (Math.abs(exacto - respuesta) > tolerancia + 1.5) return mal(e.id, `deslizador: el valor exacto es ${exacto.toFixed(1)}, demasiado lejos de ${respuesta}`);
      esperado = respuesta;
    } else if (ch.mus) esperado = ch.mus.reduce((a, c) => a + valMus(c), 0);
    else if (ch.bacTotal) esperado = ch.bacTotal.reduce((a, c) => a + (['10', 'J', 'Q', 'K'].includes(c) ? 0 : c === 'A' ? 1 : Number(c)), 0) % 10;
    if ((ch.mus || ch.bacTotal) && /-v1$/.test(e.id)) {
      const dib = (e.situacion && e.situacion.filas && e.situacion.filas[0] ? e.situacion.filas[0].cartas : []).map((c) => String(c).replace(/[♠♥♦♣]$/, ''));
      if (dib.join() !== (ch.mus || ch.bacTotal).join()) return mal(e.id, 'deslizador: las cartas dibujadas no son las de la comprobación');
    }
    if (esperado === null) definicion();
    else { calculado(); if (esperado !== respuesta) mal(e.id, `deslizador: se esperaba ${esperado} y el ejercicio dice ${respuesta}`); }
    return;
  }
  if (t === 'rellenar') {
    const nh = (e.texto.match(/\{\}/g) || []).length;
    if (nh < 1 || nh > 3 || nh !== e.huecos.length) return mal(e.id, 'rellenar: los huecos no coinciden con las palabras');
    if (e.banco.length < 3 || e.banco.length > 6 || new Set(e.banco).size !== e.banco.length) return mal(e.id, 'rellenar: el banco debe tener de 3 a 6 palabras distintas');
    if (!e.huecos.every((h) => e.banco.includes(h)) || new Set(e.huecos).size !== nh) return mal(e.id, 'rellenar: cada hueco necesita su palabra distinta en el banco');
    if (e.banco.length <= nh) return mal(e.id, 'rellenar: falta alguna palabra de relleno en el banco');
    definicion();
    return;
  }
  if (t === 'relampago') {
    const no = e.opciones.length, n = e.items.length;
    if (no < 2 || no > 3 || new Set(e.opciones).size !== no) return mal(e.id, 'relampago: de 2 a 3 opciones distintas');
    if (n < 4 || n > 6) return mal(e.id, 'relampago: de 4 a 6 situaciones');
    if (!(e.segundos >= 5 && e.segundos <= 12)) return mal(e.id, 'relampago: segundos entre 5 y 12');
    if (!e.items.every((x) => typeof x[0] === 'string' && Number.isInteger(x[1]) && x[1] >= 0 && x[1] < no)) return mal(e.id, 'relampago: opción fuera de rango');
    for (let k = 0; k < no; k++) if (!e.items.some((x) => x[1] === k)) return mal(e.id, 'relampago: una opción nunca es la correcta');
    const pagaVP = (texto) => { const cartas = texto.split(' '), cat = categoriaPoker(cartas); return cat !== 'Carta alta' && !(cat === 'Pareja' && !Object.entries(cartas.reduce((m, c) => ((m[rangoC(c)] = (m[rangoC(c)] || 0) + 1), m), {})).some(([r, n2]) => n2 === 2 && VAL_PK[r] >= 11)); };
    const comprobar = (i, esperado, que) => { if (e.items[i][1] !== esperado) mal(e.id, `relampago: «${e.items[i][0]}» ${que}: se esperaba ${e.opciones[esperado]}`); };
    if (ch.bjRel) {
      calculado();
      if (ch.bjRel.length !== n) return mal(e.id, 'relampago: manos y situaciones no coinciden');
      e.items.forEach(([txt], i) => {
        const [a, b, cru] = ch.bjRel[i];
        if (!txt.startsWith(a) || !txt.includes(' ' + b)) mal(e.id, `relampago: «${txt}» no coincide con la mano ${a}+${b}`);
        if (e.items[i][2] !== 'Crupier: ' + cru) mal(e.id, 'relampago: la carta del crupier no coincide');
        const m = mejorJugada([a, b], cru);
        if (m === 'Dividir' || m === 'Doblar') return mal(e.id, `relampago: ${a}+${b} contra ${cru} es «${m}», no cabe en Pedir/Plantarte`);
        comprobar(i, e.opciones.indexOf(m), `contra ${cru} es ${m}`);
      });
    } else if (ch.potOddsSi) {
      calculado();
      e.items.forEach(([txt, , et], i) => {
        const [b, p, eq] = ch.potOddsSi[i], req = (100 * p) / (b + p);
        if (txt !== `Tu probabilidad: ${eq} %` || et !== `Bote ${b} · Te piden ${p}`) mal(e.id, 'relampago: los datos no coinciden');
        if (Math.abs(eq - req) < 3) mal(e.id, 'relampago: caso demasiado ajustado');
        comprobar(i, eq > req ? e.opciones.indexOf('Pagar') : e.opciones.indexOf('Tirar'), `(${eq} % contra ${req.toFixed(1)} %)`);
      });
    } else if (ch.musJuego) {
      calculado();
      e.items.forEach(([txt], i) => {
        const rs = ch.musJuego[i];
        if (txt !== rs.join(' · ')) mal(e.id, 'relampago: la mano no coincide');
        const tot = rs.reduce((a, c) => a + valMus(c), 0);
        if (tot === 30 || tot === 31) mal(e.id, 'relampago: caso límite');
        comprobar(i, tot >= 31 ? 0 : 1, `suma ${tot}`);
      });
    } else if (ch.bacNatural) {
      calculado();
      e.items.forEach(([txt], i) => {
        const [a, b] = ch.bacNatural[i];
        if (!txt.startsWith(a) || !txt.includes(' ' + b)) mal(e.id, 'relampago: la mano no coincide');
        const v = (r) => (['10', 'J', 'Q', 'K'].includes(r) ? 0 : r === 'A' ? 1 : Number(r));
        comprobar(i, (v(a) + v(b)) % 10 >= 8 ? 0 : 1, 'en el bacarrá');
      });
    } else if (ch.vpPagaRel) {
      calculado();
      e.items.forEach(([txt], i) => comprobar(i, pagaVP(txt) ? 0 : 1, 'en Jacks or Better'));
    } else definicion();
    return;
  }
  mal(e.id, 'tipo desconocido ' + t);
}

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
    } else if (c && c.pkOrden) {
      comprobado();
      const v = e.elementos.map((x) => valor5(x.split(' ').map(parseCarta)));
      v.forEach((x, i) => { if (i && cmp(v[i - 1], x) >= 0) mal(e.id, `ordenar: la mano ${i + 1} no es mejor que la ${i}`); });
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
    } else if (c && c.musCats) {
      comprobado();
      c.musCats.forEach((m, i) => {
        const k = {}; m.map(rangoMus).forEach((x) => (k[x] = (k[x] || 0) + 1));
        const n = Object.values(k).sort((p, q) => q - p);
        const cat = n[0] === 4 || (n[0] === 2 && n[1] === 2) ? 'Duples' : n[0] === 3 ? 'Medias' : n[0] === 2 ? 'Pares' : 'Sin pares';
        if (e.pares[i][0] !== m.join(' · ') || e.pares[i][1] !== cat) mal(e.id, `emparejar: «${m.join(' · ')}» es ${cat}, no ${e.pares[i][1]}`);
      });
    } else if (e.pares.every((x) => /^([2-9]|10|[JQKA])[♠♥♦♣]( |$)/.test(x[0]))) {
      comprobado();
      e.pares.forEach((x) => { const cat = categoriaPoker(x[0].split(' ')); if (cat !== x[1] && !(cat === 'Full' && x[1] === 'Full house')) mal(e.id, `emparejar: «${x[0]}» es ${cat}, no ${x[1]}`); });
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


for (const f of ['cursos.js', 'blackjack.js', 'poker.js', 'mus.js', 'blackjack-extra.js', 'poker-extra.js', 'mus-extra.js', 'ordenar-extra.js', 'interactivos-extra.js', 'variedad-extra.js', 'ayuda.js', 'generadores.js', 'practica.js', 'videopoker-datos.js', 'perezoso.js', 'casino.js', 'ruleta.js', 'ampliacion.js', 'mas-niveles.js', 'formas-nuevas.js', 'variedad-generada.js', 'premium.js', 'formas-interactivas.js']) vm.runInContext(fs.readFileSync(D + f, 'utf8'), ctx, { filename: f });
const CURSOS = vm.runInContext('CURSOS', ctx);
const AYUDA = vm.runInContext('AYUDA', ctx);
const CURSOS_ORO = vm.runInContext('CURSOS_ORO', ctx);
const ORO = vm.runInContext('ORO', ctx);
const PREMIUM = vm.runInContext('PREMIUM', ctx);


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

const errores_pre = [];
// ---------- casino: baccarat y vídeo póker (cálculos independientes) ----------
const BAC_VAL = { A: 1, 10: 0, J: 0, Q: 0, K: 0 };
const bacVal = (c) => { const r = c.slice(0, -1); return r in BAC_VAL ? BAC_VAL[r] : Number(r); };
const bacTotal = (cs) => cs.map(bacVal).reduce((a, b) => a + b, 0) % 10;
// tabla clásica: con este total la Banca pide si la tercera carta del Jugador vale alguno de estos valores
const BANCA_PIDE = { 0: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], 1: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], 2: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], 3: [0, 1, 2, 3, 4, 5, 6, 7, 9], 4: [2, 3, 4, 5, 6, 7], 5: [4, 5, 6, 7], 6: [6, 7], 7: [] };
function bancaDecide(totalBanca, jugador) { // jugador: sus cartas (2 o 3)
  if (jugador.length === 2) return totalBanca <= 5;
  return BANCA_PIDE[totalBanca].includes(bacVal(jugador[2]));
}
function bacSimular(p2, b2, zap) {
  let p = [...p2], b = [...b2], i = 0;
  if (bacTotal(p) < 8 && bacTotal(b) < 8) {
    if (bacTotal(p) < 6) p.push(zap[i++]);
    if (bancaDecide(bacTotal(b), p)) b.push(zap[i++]);
  }
  const x = bacTotal(p), y = bacTotal(b);
  return x > y ? 'Jugador' : y > x ? 'Banca' : 'Empate';
}
// Probabilidades exactas con mazo infinito: cada carta vale 0 con prob. 4/13 y 1..9 con 1/13
const BAC_EXACTO = (() => {
  const w = [4, 1, 1, 1, 1, 1, 1, 1, 1, 1].map((x) => x / 13);
  let pj = 0, pb = 0, pe = 0;
  const reg = (p, r) => (r === 'J' ? (pj += p) : r === 'B' ? (pb += p) : (pe += p));
  for (let a = 0; a < 10; a++) for (let b = 0; b < 10; b++) for (let c = 0; c < 10; c++) for (let d = 0; d < 10; d++) {
    const p0 = w[a] * w[b] * w[c] * w[d];
    const tp = (a + b) % 10, tb = (c + d) % 10;
    if (tp >= 8 || tb >= 8) { reg(p0, tp > tb ? 'J' : tb > tp ? 'B' : 'E'); continue; }
    const finalizar = (p, x, y) => reg(p, x > y ? 'J' : y > x ? 'B' : 'E');
    if (tp >= 6) { // Jugador se planta
      if (tb <= 5) { for (let e = 0; e < 10; e++) finalizar(p0 * w[e], tp, (tb + e) % 10); } else finalizar(p0, tp, tb);
    } else {
      for (let e = 0; e < 10; e++) {
        const pe3 = p0 * w[e], tp3 = (tp + e) % 10;
        if (BANCA_PIDE[tb].includes(e)) { for (let f = 0; f < 10; f++) finalizar(pe3 * w[f], tp3, (tb + f) % 10); } else finalizar(pe3, tp3, tb);
      }
    }
  }
  const ventaja = { Jugador: -(pj - pb) * 100, Banca: -(0.95 * pb - pj) * 100, Empate: -(8 * pe - (1 - pe)) * 100 };
  return { pj, pb, pe, ventaja };
})();

// Vídeo póker: evaluador y valor esperado exactos (otra implementación, por multiplicidades)
const VP_RANGO = { J: 11, Q: 12, K: 13, A: 14 };
const vpRango = (c) => { const r = c.slice(0, -1); return VP_RANGO[r] || Number(r); };
const VP_PALO = { '♠': 0, '♥': 1, '♦': 2, '♣': 3 };
const VP_PAGOS = { 'Nada (no paga)': 0, 'Pareja de J o mejor': 1, 'Doble pareja': 2, 'Trío': 3, 'Escalera': 4, 'Color': 6, 'Full': 9, 'Póker': 25, 'Escalera de color': 50, 'Escalera real': 250 };
const VP_ORDEN = Object.keys(VP_PAGOS);
const cnt15 = new Int8Array(15);
function vpNombre(rs, ss) {
  let min = 99, max = 0, flush = true, suma2 = 0, parAlto = false;
  for (let i = 0; i < 5; i++) { cnt15[rs[i]]++; if (rs[i] < min) min = rs[i]; if (rs[i] > max) max = rs[i]; if (ss[i] !== ss[0]) flush = false; }
  for (let i = 0; i < 5; i++) { const n = cnt15[rs[i]]; if (n) { suma2 += n * n; if (n === 2 && rs[i] >= 11) parAlto = true; cnt15[rs[i]] = 0; } }
  // suma de cuadrados de las multiplicidades: 5 = todo distinto, 7 = pareja, 9 = doble pareja, 11 = trío, 13 = full, 17 = póker
  const recta = suma2 === 5 && (max - min === 4 || (max === 14 && min === 2 && (rs.includes(3) && rs.includes(4) && rs.includes(5))));
  if (recta && flush) return min === 10 ? 'Escalera real' : 'Escalera de color';
  if (suma2 === 17) return 'Póker';
  if (suma2 === 13) return 'Full';
  if (flush) return 'Color';
  if (recta) return 'Escalera';
  if (suma2 === 11) return 'Trío';
  if (suma2 === 9) return 'Doble pareja';
  if (suma2 === 7) return parAlto ? 'Pareja de J o mejor' : 'Nada (no paga)';
  return 'Nada (no paga)';
}
const cacheEV = new Map();
function vpTodosEV(cartas) { // devuelve el valor medio de cada una de las 32 formas de guardar (máscara de 5 bits)
  const clave = cartas.join(',');
  if (cacheEV.has(clave)) return cacheEV.get(clave);
  const R = cartas.map(vpRango), S = cartas.map((c) => VP_PALO[c.slice(-1)]);
  const mazo = [];
  for (let r = 2; r <= 14; r++) for (let s = 0; s < 4; s++) if (!cartas.some((c, i) => R[i] === r && S[i] === s)) mazo.push([r, s]);
  const res = [];
  for (let mask = 0; mask < 32; mask++) {
    const rs = [0, 0, 0, 0, 0], ss = [0, 0, 0, 0, 0];
    let f = 0;
    for (let i = 0; i < 5; i++) if (mask & (1 << i)) { rs[f] = R[i]; ss[f] = S[i]; f++; }
    let suma = 0, n = 0;
    const rec = (desde, pos) => {
      if (pos === 5) { suma += VP_PAGOS[vpNombre(rs, ss)]; n++; return; }
      for (let j = desde; j < mazo.length; j++) { rs[pos] = mazo[j][0]; ss[pos] = mazo[j][1]; rec(j + 1, pos + 1); }
    };
    rec(0, f);
    res.push(suma / n);
  }
  cacheEV.set(clave, res);
  return res;
}
const mascaraDe = (idx) => idx.reduce((m, i) => m | (1 << i), 0);

function verificarCasino(e) {
  const t = e.tipo, ch = e.chequeo, k = ch && ch.k;
  const okTipo = (verif.casino = verif.casino || {});
  if (!k) return mal(e.id, 'casino: ejercicio sin chequeo');
  okTipo[t] = (okTipo[t] || 0) + 1;
  // estructura
  if (t === 'opcion_unica') {
    if (!Array.isArray(e.opciones) || e.opciones.length < 2 || e.opciones.length > 5 || new Set(e.opciones).size !== e.opciones.length) return mal(e.id, 'opciones raras o repetidas');
    if (!Number.isInteger(e.correcta) || e.correcta < 0 || e.correcta >= e.opciones.length) return mal(e.id, 'correcta fuera de rango');
    if (e.situacion && e.situacion.filas && !e.situacion.filas.every((f) => f.etiqueta && f.cartas.length)) return mal(e.id, 'filas mal formadas');
  } else if (t === 'seleccionar') {
    const n = e.cartas.length;
    if (n < 4 || n > 8 || new Set(e.cartas).size !== n) return mal(e.id, 'seleccionar: de 4 a 8 cartas distintas');
    if (!(e.correctas.length > 0 && e.correctas.length < n && new Set(e.correctas).size === e.correctas.length && e.correctas.every((i) => i >= 0 && i < n))) return mal(e.id, 'seleccionar: índices no válidos');
  } else if (t === 'emparejar') {
    const n = e.pares.length;
    if (n < 3 || n > 5 || new Set(e.pares.map((x) => x[0])).size !== n || new Set(e.pares.map((x) => x[1])).size !== n) return mal(e.id, 'emparejar: pares mal formados');
  } else if (t === 'ordenar') {
    const n = e.elementos.length;
    if (n < 3 || n > 6 || new Set(e.elementos).size !== n) return mal(e.id, 'ordenar: elementos mal formados');
  } else if (t === 'numero') {
    if (!Number.isInteger(e.respuesta)) return mal(e.id, 'numero: la respuesta debe ser un entero');
  } else return mal(e.id, 'tipo desconocido ' + t);
  if (k === 'def') { verif.definiciones = (verif.definiciones || 0) + 1; return; }
  verif.calculados = (verif.calculados || 0) + 1;
  const resp = t === 'opcion_unica' ? e.opciones[e.correcta] : null;
  const filas = e.situacion && e.situacion.filas;
  const fila = (n) => filas && filas.find((f) => f.etiqueta === n);
  const igual = (a, b, msg) => { if (JSON.stringify(a) !== JSON.stringify(b)) mal(e.id, `${msg}: se esperaba ${JSON.stringify(a)} y el ejercicio dice ${JSON.stringify(b)}`); };

  switch (k) {
    case 'bacVal': igual(e.cartas.map((c, i) => (bacVal(c) === 0 ? i : -1)).filter((i) => i >= 0), [...e.correctas].sort((a, b) => a - b), 'cartas que valen 0'); break;
    case 'bacTotal': igual(ch.cartas, fila('Tu mano').cartas, 'cartas'); igual(bacTotal(ch.cartas), e.respuesta, 'total del bacarrá'); break;
    case 'bacOrden': {
      const tt = ch.manos.map(bacTotal);
      if (tt.some((x, i) => i && x >= tt[i - 1])) mal(e.id, 'bacarrá: los totales no van de mayor a menor');
      igual(ch.manos.map((m) => m.join(' ')), e.elementos, 'elementos');
      if (new Set(ch.manos.flat()).size !== ch.manos.flat().length) mal(e.id, 'bacarrá: cartas repetidas');
      break;
    }
    case 'bacVals': e.pares.forEach(([c, v]) => { if (String(bacVal(c)) !== v) mal(e.id, `${c} vale ${bacVal(c)}, no ${v}`); }); break;
    case 'bacNat': igual(bacTotal(ch.cartas) >= 8 ? 0 : 1, e.correcta, 'natural'); igual(ch.cartas, fila('Jugador').cartas, 'cartas'); break;
    case 'bacJugador': { const tt = bacTotal(ch.cartas); if (tt >= 8) mal(e.id, 'el Jugador tiene natural'); igual(tt < 6 ? 'Pide carta' : 'Se planta', resp, 'regla del Jugador'); igual(ch.cartas, fila('Jugador').cartas, 'cartas'); break; }
    case 'bacBanca': {
      const tp = bacTotal(ch.jugador.slice(0, 2)), tb = bacTotal(ch.banca);
      if (tp >= 8 || tb >= 8) mal(e.id, 'hay un natural: no se aplica la regla');
      if ((tp < 6) !== (ch.jugador.length === 3)) mal(e.id, 'el Jugador tiene un número de cartas que no corresponde a su total');
      igual(bancaDecide(tb, ch.jugador) ? 'Pide carta' : 'Se planta', resp, 'regla de la Banca');
      igual(ch.jugador, fila('Jugador').cartas, 'cartas del Jugador'); igual(ch.banca, fila('Banca').cartas, 'cartas de la Banca');
      if (!e.pregunta.includes(String(tb))) mal(e.id, 'la pregunta no muestra el total de la Banca');
      if (/pedido/.test(e.pregunta) !== (ch.jugador.length === 3)) mal(e.id, 'la pregunta no cuadra con las cartas del Jugador');
      break;
    }
    case 'bacSelBanca': {
      const tb = bacTotal(fila('Banca').cartas);
      igual(ch.total, tb, 'total de la Banca');
      igual(e.cartas.map((c, i) => (BANCA_PIDE[tb].includes(bacVal(c)) ? i : -1)).filter((i) => i >= 0), [...e.correctas].sort((a, b) => a - b), 'terceras cartas que hacen pedir');
      break;
    }
    case 'bacGana': {
      const todas = [...ch.jugador, ...ch.banca, ...ch.zapato];
      if (new Set(todas).size !== todas.length) mal(e.id, 'cartas repetidas');
      igual(bacSimular(ch.jugador, ch.banca, ch.zapato), resp, 'ganador');
      igual(ch.jugador, fila('Jugador').cartas, 'cartas'); igual(ch.zapato, fila('Siguientes cartas del zapato').cartas, 'zapato');
      break;
    }
    case 'bacPago': {
      const x = ch.a === 'Jugador' ? ch.apuesta : ch.a === 'Banca' ? ch.apuesta * 0.95 : ch.apuesta * 8;
      igual(Math.round(x * 100) / 100, e.respuesta, 'pago');
      break;
    }
    case 'bacPagos': {
      const exp = { Jugador: /^1 a 1$/, Banca: /^1 a 1, menos 5 %/, Empate: /^8 a 1$/ };
      e.pares.forEach(([a, b]) => { if (!exp[a] || !exp[a].test(b)) mal(e.id, `pago de ${a} incorrecto: ${b}`); });
      break;
    }
    case 'bacMejor': {
      const v = BAC_EXACTO.ventaja, nombres = Object.keys(v);
      const mejor = nombres.reduce((a, b) => ((ch.pide === 'min' ? v[b] < v[a] : v[b] > v[a]) ? b : a));
      igual(mejor, resp, 'apuesta');
      break;
    }
    case 'bacEdgeOrden': {
      const v = BAC_EXACTO.ventaja;
      e.elementos.forEach((x, i) => { if (i && v[x] <= v[e.elementos[i - 1]]) mal(e.id, 'bacarrá: ventaja de la casa mal ordenada'); });
      break;
    }
    case 'bacPerd': igual(Math.round(BAC_EXACTO.ventaja[ch.a]), e.respuesta, 'pérdida por 100 €'); break;
    case 'porcentaje': igual((ch.base * ch.pct) / 100, e.respuesta, 'porcentaje'); break;
    case 'vpMano': { const nombre = vpNombre(...vpArrays(ch.cartas)); igual(nombre, resp, 'mano'); igual(ch.cartas, fila('Tu mano').cartas, 'cartas'); break; }
    case 'vpPago': { const nom = { pareja: 'Pareja de J o mejor', dobles: 'Doble pareja', trio: 'Trío', escalera: 'Escalera', color: 'Color', full: 'Full', poker: 'Póker', escColor: 'Escalera de color' }[ch.cat]; igual(VP_PAGOS[nom] * ch.m, e.respuesta, 'pago total'); break; }
    case 'vpOrdPagos': { const p = e.elementos.map((x) => VP_PAGOS[x]); if (p.some((x, i) => x === undefined || (i && x <= p[i - 1]))) mal(e.id, 'vídeo póker: jugadas mal ordenadas por pago'); break; }
    case 'vpPagos': e.pares.forEach(([a, b]) => { if (VP_PAGOS[a] === undefined || Number(b.match(/\d+/)[0]) !== VP_PAGOS[a]) mal(e.id, `pago de ${a}: ${b}`); }); break;
    case 'vpQuedan': igual(13 - ch.n, e.respuesta, 'cartas que quedan'); if (!e.pregunta.includes(`Guardas ${ch.n} cartas`)) mal(e.id, 'la pregunta no cuadra'); break;
    case 'vpCoste': igual(ch.m * ch.v * ch.manos, e.respuesta, 'coste'); break;
    case 'vpRet': igual(Math.round((ch.apostado * (100 - ch.ret)) / 100), e.respuesta, 'pérdida media'); break;
    case 'vpHold': case 'vpDuelo': {
      const cartas = t === 'seleccionar' ? e.cartas : fila('Tu mano').cartas;
      if (cartas.length !== 5 || new Set(cartas).size !== 5) return mal(e.id, 'la mano no tiene 5 cartas distintas');
      const evs = vpTodosEV(cartas);
      const orden = evs.map((v, m) => [v, m]).sort((a, b) => b[0] - a[0]);
      const mejor = orden[0][1];
      if (mejor !== mascaraDe(ch.m)) mal(e.id, `vídeo póker: la mejor jugada es guardar máscara ${mejor} (${orden[0][0].toFixed(4)}) y el ejercicio dice ${mascaraDe(ch.m)}`);
      if (orden[0][0] - orden[1][0] < 0.03) mal(e.id, 'vídeo póker: diferencia demasiado pequeña con la segunda mejor');
      if (Math.abs(evs[mascaraDe(ch.m)] - ch.ev) > 0.0006) mal(e.id, `vídeo póker: EV ${evs[mascaraDe(ch.m)].toFixed(4)} y el ejercicio dice ${ch.ev}`);
      if (!e.explicacion.includes(ch.ev.toFixed(2).replace('.', ','))) mal(e.id, 'la explicación no muestra el valor medio');
      if (t === 'seleccionar') igual(ch.m, [...e.correctas].sort((a, b) => a - b), 'cartas a guardar');
      else if (!ch.opciones) { igual(0, e.correcta, 'opción «guardas las cinco»'); igual(31, mascaraDe(ch.m), 'guardar las cinco'); }
      else {
        const masc = e.opciones.map((_, i) => mascaraDe(ch.opciones[i]));
        const mejorOpc = masc.reduce((a, b, i) => (evs[b] > evs[masc[a]] ? i : a), 0);
        igual(mejorOpc, e.correcta, 'opción correcta');
        e.opciones.forEach((txt, i) => { const esperado = ch.opciones[i].length ? ch.opciones[i].map((j) => cartas[j]).join(' ') : 'Ninguna: cambias las cinco'; if (txt !== esperado) mal(e.id, `texto de la opción ${i} no coincide con las cartas`); });
        ch.opciones.forEach((o, i) => { if (!e.explicacion.includes(evs[mascaraDe(o)].toFixed(2).replace('.', ','))) mal(e.id, `la explicación no muestra el valor medio de la opción ${i}`); });
      }
      break;
    }
    // ---- ruleta europea (37 casillas): todo se recalcula con fórmulas propias ----
    case 'rlCubre': { igual(36 / (ch.pago + 1), ch.cubre, 'casillas = 36 ÷ (pago + 1)'); igual(String(ch.cubre), resp, 'casillas'); break; }
    case 'rlPago': igual(ch.total ? (ch.pago + 1) * ch.m : ch.pago * ch.m, e.respuesta, 'cobro de la ruleta'); break;
    case 'rlProb': { igual(((100 * ch.cubre) / 37).toFixed(1).replace('.', ',') + ' %', resp, 'probabilidad k/37'); if (e.opciones.some((o, i) => o !== ((100 * ch.opciones[i]) / 37).toFixed(1).replace('.', ',') + ' %')) mal(e.id, 'opciones de probabilidad'); break; }
    case 'rlColor': { const rojos = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]); igual(rojos.has(ch.n) ? 'Rojo' : 'Negro', resp, 'color'); if (rojos.size !== 18) mal(e.id, 'hacen falta 18 rojos'); break; }
    case 'rlDocena': { igual(Math.ceil(ch.n / 12) - 1, e.correcta, 'docena'); if (!e.pregunta.includes(`el ${ch.n}?`)) mal(e.id, 'ruleta: número distinto en la pregunta'); break; }
    case 'rlColumna': { igual(ch.n % 3 === 1 ? 0 : ch.n % 3 === 2 ? 1 : 2, e.correcta, 'columna'); break; }
    case 'rlGana': {
      const R = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);
      const gana = { 'Rojo': (n) => R.has(n), 'Negro': (n) => n >= 1 && !R.has(n), 'Par': (n) => n % 2 === 0, 'Impar': (n) => n % 2 === 1, 'Falta (1–18)': (n) => n >= 1 && n <= 18, 'Pasa (19–36)': (n) => n >= 19, '1.ª docena': (n) => n >= 1 && n <= 12, '2.ª docena': (n) => n >= 13 && n <= 24, '3.ª docena': (n) => n >= 25 && n <= 36 };
      const ok = e.opciones.map((o) => gana[o](ch.n));
      if (ok.filter(Boolean).length !== 1 || !ok[e.correcta]) mal(e.id, 'ruleta: debe ganar exactamente la opción marcada');
      if (!e.pregunta.includes(`Sale el ${ch.n}.`)) mal(e.id, 'ruleta: número distinto en la pregunta');
      break;
    }
    case 'rlNeto': {
      const R = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);
      const pago = { Pleno: 35, Calle: 11, Línea: 5, Docena: 2, Rojo: 1, Negro: 1, Par: 1, Impar: 1, Falta: 1 };
      const cubre = { Pleno: (x, a) => x === a, Calle: (x, a) => x >= a && x <= a + 2, Línea: (x, a) => x >= (a - 1) * 3 + 1 && x <= (a - 1) * 3 + 6, Docena: (x, a) => x >= (a - 1) * 12 + 1 && x <= a * 12, Rojo: (x) => R.has(x), Negro: (x) => x >= 1 && !R.has(x), Par: (x) => x >= 1 && x % 2 === 0, Impar: (x) => x % 2 === 1, Falta: (x) => x >= 1 && x <= 18 };
      if (ch.ap.length !== 2) mal(e.id, 'ruleta: dos apuestas');
      igual(ch.ap.reduce((t, a) => t + (cubre[a.n](ch.sale, a.arg) ? (pago[a.n] + 1) * a.m : 0), 0), e.respuesta, 'dinero recibido con dos apuestas');
      if (!e.pregunta.includes(`Sale el ${ch.sale}.`) || !ch.ap.every((a) => e.pregunta.includes(`${a.m} €`))) mal(e.id, 'ruleta: la pregunta no coincide con las apuestas');
      break;
    }
    case 'rlMito': { igual('48,6 %', resp, 'probabilidad de una apuesta simple (18/37)'); if (((18 / 37) * 100).toFixed(1).replace('.', ',') + ' %' !== '48,6 %') mal(e.id, '18/37'); break; }
    case 'rlMasProb': { const cub = { Pleno: 1, Caballo: 2, Calle: 3, Cuadro: 4, 'Línea': 5 + 1, Docena: 12, Rojo: 18 }; const v = e.opciones.map((o) => cub[o]); if (v.some((x) => x === undefined) || v[e.correcta] !== Math.max(...v)) mal(e.id, 'ruleta: no es la apuesta más probable'); break; }
    case 'rlOrdProb': { const cub = { Pleno: 1, Caballo: 2, Calle: 3, Cuadro: 4, 'Línea': 6, Docena: 12, Rojo: 18 }; const v = e.elementos.map((o) => cub[o]); if (v.some((x, i) => x === undefined || (i && x <= v[i - 1]))) mal(e.id, 'ruleta: orden de probabilidad incorrecto'); break; }
    case 'rlBanca': { if (ch.B % ch.m) mal(e.id, 'ruleta: presupuesto no divisible'); igual(ch.B / ch.m, e.respuesta, 'tiradas posibles'); if (!e.pregunta.includes(`${ch.B} €`) || !e.pregunta.includes(`${ch.m} €`)) mal(e.id, 'ruleta: cifras distintas en la pregunta'); break; }
    case 'rlRojos': { const R = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]; let c = 0; for (let x = 1; x <= ch.n; x++) if (R.includes(x)) c++; igual(c, e.respuesta, 'rojos hasta N'); break; }
    case 'rlOrd': { const pagos = { Pleno: 35, Caballo: 17, Calle: 11, Cuadro: 8, 'Línea': 5, Docena: 2, Rojo: 1 }; const v = e.elementos.map((x) => pagos[x]); if (v.some((x) => x === undefined) || v.some((x, i) => i && x <= v[i - 1])) mal(e.id, 'ruleta: las apuestas no van de menos a más pago'); break; }
    case 'rlEm': { const pagos = { Pleno: '35 a 1', Caballo: '17 a 1', Calle: '11 a 1', Cuadro: '8 a 1', 'Línea': '5 a 1', Docena: '2 a 1', Rojo: '1 a 1' }; e.pares.forEach(([a, b]) => { if (pagos[a] !== b) mal(e.id, `${a} paga ${pagos[a]}, no ${b}`); }); break; }
    case 'rlPerdida': igual(37 * ch.m - 36 * ch.m, e.respuesta, 'pérdida de 37 tiradas a pleno'); break;
    case 'rlEsperada': { if (ch.m % 37) mal(e.id, 'ruleta: el total apostado debe ser múltiplo de 37'); igual(ch.m / 37, e.respuesta, 'pérdida esperada'); break; }
    case 'rlCuantas': { if (![1, 2, 4, 6].includes(ch.cubre)) mal(e.id, 'ruleta: apuesta que no existe'); if (!e.pregunta.includes(`Pones ${ch.fichas} apuestas`)) mal(e.id, 'ruleta: fichas distintas de la pregunta'); igual(ch.cubre * ch.fichas, e.respuesta, 'números cubiertos'); break; }
    default: mal(e.id, 'chequeo desconocido ' + k);
  }
}
const vpArrays = (cartas) => [cartas.map(vpRango), cartas.map((c) => VP_PALO[c.slice(-1)])];
{
  const v = BAC_EXACTO.ventaja;
  if (Math.abs(BAC_EXACTO.pj + BAC_EXACTO.pb + BAC_EXACTO.pe - 1) > 1e-9) errores_pre.push('bacarrá: las probabilidades no suman 1');
  if (Math.abs(v.Banca - 1.06) > 0.05 || Math.abs(v.Jugador - 1.24) > 0.05 || Math.abs(v.Empate - 14) > 0.5) errores_pre.push(`bacarrá: ventajas ${JSON.stringify(v)} no cuadran con las lecciones (1,06 / 1,24 / 14)`);
  if (Math.abs(BAC_EXACTO.pe - 0.095) > 0.002) errores_pre.push('bacarrá: la probabilidad de empate no es ≈ 9,5 %');
  verif.bacarraEmpate = +(BAC_EXACTO.pe * 100).toFixed(2);
}

// ---------- formas nuevas de responder (vf, duelo, eliminar, reloj, construir, memoria, errata) ----------
function verificarForma(e) {
  const b = e.base, t = e.tipo;
  verif.formas = verif.formas || {};
  verif.formas[t] = (verif.formas[t] || 0) + 1;
  const test = (b.tipo === 'opcion_unica' || b.tipo === 'accion') && Array.isArray(b.opciones) && Number.isInteger(b.correcta) && b.correcta >= 0 && b.correcta < b.opciones.length;
  const buena = test ? b.opciones[b.correcta] : null;
  if (t === 'vf') {
    if (!test) return mal(e.id, 'vf: el original no es de opciones');
    if (!b.opciones.includes(e.propuesta)) mal(e.id, 'vf: la propuesta no es una opción');
    if (e.verdadero !== (e.propuesta === buena)) mal(e.id, `vf: «${e.propuesta}» ${e.verdadero ? 'no es' : 'es'} la respuesta correcta («${buena}»)`);
    if (e.falsa === buena || !b.opciones.includes(e.falsa)) mal(e.id, 'vf: respuesta falsa mal elegida');
  } else if (t === 'duelo') {
    if (!test || b.opciones.length < 3) return mal(e.id, 'duelo: original no válido');
    if (e.acierto !== buena) mal(e.id, `duelo: la acertada es «${e.acierto}» y la correcta «${buena}»`);
    if (e.falsa === buena || !b.opciones.includes(e.falsa)) mal(e.id, 'duelo: la falsa no vale');
  } else if (t === 'eliminar') {
    if (!test || b.opciones.length < 3) mal(e.id, 'eliminar: original no válido');
  } else if (t === 'reloj') {
    if (!test || !(e.segundos >= 8)) mal(e.id, 'reloj: original no válido o poco tiempo');
  } else if (t === 'construir') {
    if (!test || b.tipo !== 'opcion_unica') return mal(e.id, 'construir: original no válido');
    if (e.palabras.join(' ') !== buena) mal(e.id, `construir: «${e.palabras.join(' ')}» no es la respuesta correcta «${buena}»`);
    const falta = e.palabras.slice();
    for (const w of e.banco) { const i = falta.indexOf(w); if (i >= 0) falta.splice(i, 1); }
    if (falta.length) mal(e.id, 'construir: faltan palabras en el banco');
    if (e.banco.length <= e.palabras.length) mal(e.id, 'construir: sin palabras de sobra');
  } else if (t === 'memoria') {
    if (b.tipo !== 'emparejar' || JSON.stringify(e.pares) !== JSON.stringify(b.pares)) mal(e.id, 'memoria: las parejas no son las del original');
    const lados = e.pares.flatMap((p) => p);
    if (new Set(lados).size !== lados.length || e.pares.length < 3) mal(e.id, 'memoria: cartas repetidas o pocas parejas');
  } else if (t === 'errata') {
    if (b.tipo !== 'ordenar' || JSON.stringify(e.elementos) !== JSON.stringify(b.elementos)) return mal(e.id, 'errata: los elementos no son los del original');
    const n = e.elementos.length;
    if (e.secuencia.length !== n || [...e.secuencia].sort((x, y) => x - y).some((v, i) => v !== i)) return mal(e.id, 'errata: la secuencia no es una permutación');
    const enOrden = (a) => a.every((v, i) => i === 0 || a[i - 1] < v);
    if (enOrden(e.secuencia)) mal(e.id, 'errata: la secuencia ya está en orden');
    const culpables = e.secuencia.map((_, k) => k).filter((k) => enOrden(e.secuencia.filter((__, j) => j !== k)));
    if (culpables.length !== 1 || culpables[0] !== e.intruso) mal(e.id, 'errata: la ficha fuera de sitio no es única o no coincide');
  } else mal(e.id, 'forma nueva desconocida ' + t);
}

// ---------- recorrido ----------
for (const c of CURSOS.concat(CURSOS_ORO)) {
  for (const campo of ['id', 'nombre', 'icono', 'color', 'descripcion', 'reglas']) if (!c[campo]) mal(c.id, `curso sin ${campo}`);
  for (const u of c.unidades) {
    if (!u.titulo || !u.descripcion) mal(u.id, 'unidad sin titulo/descripcion');
    for (const l of u.lecciones) {
      nNiv++;
      if (ids.has(l.id)) mal(l.id, 'id de lección repetido'); ids.add(l.id);
      if (typeof l.intro !== 'string' || l.intro.length < 40 || l.intro.length > 420) mal(l.id, `intro rara (${(l.intro || '').length} caracteres)`);
      if (!l.icono || typeof l.xp !== 'number' || !l.titulo) mal(l.id, 'falta icono, xp o titulo');
      if (l.ejercicios.length < 4) mal(l.id, 'menos de 4 ejercicios');
      for (const e0 of l.ejercicios) {
        nEj++;
        if (ids.has(e0.id)) mal(e0.id, 'id repetido'); ids.add(e0.id);
        if (!e0.pregunta || !e0.explicacion) mal(e0.id, 'falta pregunta o explicación');
        const e = e0.base || e0; // formas nuevas (data/formas-interactivas.js): se comprueba el ejercicio original y, aparte, la conversión
        if (e0.base) { verificarForma(e0); if (e.id !== e0.id) mal(e0.id, 'la forma nueva cambia el id'); }
        if (['clasificar', 'deslizador', 'rellenar', 'relampago'].includes(e.tipo)) { verificarNuevos(e); continue; }
        if (c.id === 'baccarat' || c.id === 'videopoker' || c.id === 'ruleta') { verificarCasino(e); continue; }
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
        if (e.chequeo && e.chequeo.decide) {
          const d = e.chequeo.decide;
          const eq = d.outs * (d.fase === 'flop' ? 4 : 2), nec = (100 * d.pagar) / (d.bote + d.pagar);
          verif.decisiones = (verif.decisiones || 0) + 1;
          if (Math.abs(eq - nec) < 3) mal(e.id, 'decisión demasiado ajustada');
          if (resp !== (eq > nec ? 'Sí, pagas' : 'No, te retiras')) mal(e.id, `pot odds: necesitas ${nec.toFixed(1)} % y tienes ${eq} %, la respuesta no cuadra`);
          continue;
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
console.log(`${CURSOS.length} cursos, ${nNiv} niveles (incluye la ruta dorada), ${nEj} ejercicios`);
// cada nivel normal tiene su nivel Oro y no hay Oros huérfanos
{
  const normales = CURSOS.flatMap((c) => c.unidades.flatMap((u) => u.lecciones.map((l) => l.id)));
  normales.forEach((id) => { if (!ORO[id]) mal(id, 'este nivel no tiene su nivel Oro'); });
  Object.keys(ORO).forEach((id) => { if (!normales.includes(id)) mal(id, 'nivel Oro sin nivel normal'); });
  CURSOS_ORO.flatMap((c) => c.unidades[0].lecciones).forEach((l) => {
    const tipos = new Set(l.ejercicios.map((e) => e.tipo));
    if (tipos.size < 3) mal(l.id, 'el nivel Oro mezcla menos de 3 tipos de ejercicio');
  });
  if (!PREMIUM.precio || typeof PREMIUM.modoPrueba !== 'boolean') mal('premium', 'ajustes de VIP incompletos');
}
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
// ---------- simulador de blackjack: su estrategia debe coincidir con la función independiente mejorJugada ----------
{
  const src = fs.readFileSync(require('path').join(__dirname, '..', 'js', 'simulador.js'), 'utf8').split('// ---------- pantalla de inicio ----------')[0];
  vm.runInContext(src + '\nthis.__sim = { simEstrategia, simTotal, simHiLo, simEsBlackjack, SIM_NOMBRE };', ctx, { filename: 'simulador.js' });
  const S = vm.runInContext('__sim', ctx);
  const rangos = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'A'];
  let n = 0;
  for (const c1 of rangos) for (const c2 of rangos) for (const cru of ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'K', 'A']) {
    const mano = [c1 + '♠', c2 + '♥'], esperada = mejorJugada([c1, c2], cru);
    const real = S.SIM_NOMBRE[S.simEstrategia(mano, cru + '♦')];
    n++;
    if (real !== esperada) mal('simulador', `${c1},${c2} contra ${cru}: el simulador dice ${real} y la tabla ${esperada}`);
  }
  // manos de tres cartas (no hay pareja ni se puede doblar con más de dos, pero sí se juega con la tabla)
  for (const m of [['5', '4', '2'], ['A', '2', '3'], ['10', '5', '2'], ['A', '3', '3']]) for (const cru of ['2', '6', '7', '10', 'A']) {
    const real = S.SIM_NOMBRE[S.simEstrategia(m.map((c) => c + '♠'), cru + '♦', false, false)], esperada = mejorJugada(m, cru);
    n++;
    if (esperada === 'Doblar' ? !['Pedir', 'Plantarte'].includes(real) : real !== esperada) mal('simulador', `${m.join(',')} contra ${cru} sin doblar: ${real} y la tabla ${esperada}`);
  }
  // Hi-Lo y blackjack natural
  for (const [c, v] of [['2', 1], ['6', 1], ['7', 0], ['9', 0], ['10', -1], ['K', -1], ['A', -1]]) if (S.simHiLo(c + '♠') !== v) mal('simulador', `Hi-Lo de ${c} debería ser ${v}`);
  if (!S.simEsBlackjack(['A♠', 'K♥']) || S.simEsBlackjack(['A♠', '5♥', '5♦'])) mal('simulador', 'blackjack natural mal detectado');
  verif.simulador = n;
}
// ---------- calculadoras de la pestaña Útil: se recalculan con métodos independientes ----------
{
  const src = fs.readFileSync(require('path').join(__dirname, '..', 'js', 'util.js'), 'utf8').split('const fmt =')[0];
  vm.runInContext(src + '\nthis.__util = UTIL;', ctx, { filename: 'util.js' });
  const U = vm.runInContext('__util', ctx);
  const cerca = (a, b, tol, quien) => { if (Math.abs(a - b) > tol) mal('calculadoras', `${quien}: ${a} y se esperaba ${b}`); };
  // pasarse al pedir: se cuentan las 13 cartas una a una
  for (let total = 4; total <= 21; total++) {
    let pasan = 0; for (let carta = 1; carta <= 13; carta++) if (total + Math.min(carta, 10) > 21) pasan++;
    cerca(U.pasarteAlPedir(total), (pasan / 13) * 100, 1e-9, `pasarse con ${total}`);
  }
  // el crupier se pasa: simulación con semilla (mazo muy grande, se planta con 17 también blando)
  let semilla = 12345; const azar = () => ((semilla = (Math.imul(semilla, 1664525) + 1013904223) >>> 0) / 4294967296);
  const carta = () => Math.min(1 + Math.floor(azar() * 13), 10);
  for (const up of [2, 3, 4, 5, 6, 7, 8, 9, 10, 11]) {
    let pasados = 0; const N = 200000;
    for (let i = 0; i < N; i++) {
      let total = up, ases = up === 11 ? 1 : 0;
      for (;;) {
        if (total > 21 && ases) { total -= 10; ases--; continue; }
        if (total > 21) { pasados++; break; }
        if (total >= 17) break;
        const c = carta(); if (c === 1) { total += 11; ases++; } else total += c;
      }
    }
    cerca(U.crupierSePasa(up), (pasados / N) * 100, 0.7, `el crupier se pasa con ${up}`);
  }
  // ruleta: ventaja de la casa clásica y pagos
  for (const [k, pago] of [[1, 35], [2, 17], [3, 11], [4, 8], [6, 5], [12, 2], [18, 1]]) {
    cerca(U.ruleta(k, 37, 1).pago, pago, 1e-9, `pago de ${k} números`);
    cerca(U.ruleta(k, 37, 1).casa, 100 / 37, 1e-9, `ventaja europea con ${k}`);
    cerca(U.ruleta(k, 38, 1).casa, 200 / 38, 1e-9, `ventaja americana con ${k}`);
  }
  // outs: combinaciones exactas
  const comb = (n, k) => { let r = 1; for (let i = 0; i < k; i++) r = (r * (n - i)) / (i + 1); return r; };
  for (let o = 0; o <= 20; o++) {
    cerca(U.outsFlop(o).exacto, (1 - comb(47 - o, 2) / comb(47, 2)) * 100, 1e-9, `outs ${o} en el flop`);
    cerca(U.outsTurn(o).exacto, (o / 46) * 100, 1e-9, `outs ${o} en el turn`);
  }
  // apuestas y ventaja
  cerca(U.ventajaJugador(2), 0.5, 1e-9, 'ventaja con +2');
  if (U.unidadesApuesta(-3) !== 1 || U.unidadesApuesta(0.9) !== 1 || U.unidadesApuesta(4.7) !== 4 || U.unidadesApuesta(30) !== 12) mal('calculadoras', 'unidades de apuesta mal calculadas');
  const ap = U.apuestaSugerida(1000, 3); if (ap.unidad !== 10 || ap.apuesta !== 30) mal('calculadoras', 'apuesta sugerida: 1000 con +3 debe dar 30');
  verif.calculadoras = 18 + 10 + 21 + 20 + 4;
}
errores.push(...errores_pre);
if (errores.length) { console.log('\nERRORES:\n' + errores.map((x) => ' - ' + x).join('\n')); process.exit(1); }
console.log('\nDATOS OK: estructura, estrategia básica, Hi-Lo, cuenta verdadera, mus (lances), póker (manos y ganador), pot odds, outs y probabilidades');
