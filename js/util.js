// Pestaña «Útil»: calculadoras y chuletas para tener a mano mientras juegas.
// Las tablas salen de data/ayuda.js (verificado por tests/validar.js).

// ---------- cálculos (funciones puras: las usa también la pantalla y las pruebas) ----------
const UTIL = {
  cuentaVerdadera: (corriente, mazos) => (mazos > 0 ? corriente / mazos : 0),
  // Probabilidad de completar con N outs: regla del 4 y el 2 (aprox.) y valor exacto
  outsFlop: (o) => ({ aprox: o * 4, exacto: (1 - ((47 - o) * (46 - o)) / (47 * 46)) * 100 }),
  outsTurn: (o) => ({ aprox: o * 2, exacto: (o / 46) * 100 }),
  // Porcentaje del bote final que pones al pagar
  potOdds: (bote, pagar) => (bote + pagar > 0 ? (pagar / (bote + pagar)) * 100 : 0),
  valorHiLo: (grupo) => ({ bajas: 1, neutras: 0, altas: -1 }[grupo]),
  // Ventaja aproximada del jugador (%): +0,5 % por punto de cuenta verdadera, menos ~0,5 % de ventaja de la casa
  ventajaJugador: (tc) => 0.5 * tc - 0.5,
  // Unidades de apuesta sugeridas: 1 con cuenta neutra o mala, una más por cada punto de cuenta verdadera (máximo 12)
  unidadesApuesta: (tc) => Math.max(1, Math.min(12, Math.floor(tc))),
  // Unidad = 1 % del bankroll (mínimo 1 ficha)
  apuestaSugerida: (bankroll, tc) => { const unidad = Math.max(1, Math.round(bankroll / 100)); return { unidad, unidades: UTIL.unidadesApuesta(tc), apuesta: unidad * UTIL.unidadesApuesta(tc) }; },
  // Probabilidad (%) de pasarte de 21 al pedir una carta con una mano dura (el As cuenta 1). Mazo muy grande: 4 de cada 13 cartas valen 10
  pasarteAlPedir: (total) => { let p = 0; for (let v = 1; v <= 10; v++) if (total + v > 21) p += (v === 10 ? 4 : 1) / 13; return p * 100; },
  // Probabilidad (%) de que el crupier se pase según su carta (2 a 10; 11 = As). Mazo muy grande, se planta con 17 (también blando)
  crupierSePasa: (carta) => {
    const memo = new Map();
    const f = (total, ases) => { // ases = cuántos As cuentan ahora como 11
      if (total > 21) return ases ? f(total - 10, ases - 1) : 1;
      if (total >= 17) return 0;
      const k = total * 8 + ases;
      if (memo.has(k)) return memo.get(k);
      let p = 0;
      for (let v = 1; v <= 10; v++) p += ((v === 10 ? 4 : 1) / 13) * (v === 1 ? f(total + 11, ases + 1) : f(total + v, ases));
      memo.set(k, p);
      return p;
    };
    return f(carta, carta === 11 ? 1 : 0) * 100;
  },
  // Ruleta: apuesta que cubre k números en una rueda de n (37 europea, 38 americana) con b fichas
  ruleta: (k, n, b) => { const pago = 36 / k - 1; const prob = k / n; const ev = b * (prob * pago - (1 - prob)); return { pago, prob: prob * 100, ev, casa: (-ev / b) * 100 }; },
};

const fmt = (n, d = 1) => (Number.isInteger(n) ? String(n) : n.toFixed(d).replace('.', ','));
const conSigno = (n) => (n > 0 ? '+' + fmt(n) : n < 0 ? '−' + fmt(Math.abs(n)) : '0');

// Carta o mano de texto con los palos rojos en rojo: "A♥ K♠" -> <span>…</span>
function manoTexto(texto) {
  return el('span', { class: 'mano-texto' }, texto.split(' ').map((c) => el('span', { class: /[♥♦]$/.test(c) ? 'roja' : '' }, c + ' ')));
}

// Campo numérico con botones − y +
function campo(etiqueta, inicial, { min = 0, max = 99, paso = 1 } = {}, alCambiar) {
  let valor = inicial;
  const entrada = el('input', { type: 'number', inputmode: 'decimal', min: String(min), max: String(max), step: String(paso), value: String(inicial), 'aria-label': etiqueta });
  const poner = (v) => {
    if (Number.isNaN(v)) return;
    valor = Math.max(min, Math.min(max, Math.round(v / paso) * paso));
    entrada.value = String(valor);
    alCambiar(valor);
  };
  entrada.addEventListener('input', () => {
    const v = parseFloat(entrada.value.replace(',', '.'));
    if (!Number.isNaN(v)) {
      valor = Math.max(min, Math.min(max, v));
      alCambiar(valor);
    }
  });
  entrada.addEventListener('blur', () => poner(valor));
  const caja = el(
    'label',
    { class: 'campo' },
    el('span', { class: 'campo-etiqueta' }, etiqueta),
    el('span', { class: 'campo-fila' },
      el('button', { class: 'campo-paso', type: 'button', 'aria-label': `Quitar a ${etiqueta}`, onclick: () => poner(valor - paso) }, '−'),
      entrada,
      el('button', { class: 'campo-paso', type: 'button', 'aria-label': `Sumar a ${etiqueta}`, onclick: () => poner(valor + paso) }, '+')
    )
  );
  caja.poner = poner;
  return caja;
}

// Fila de botones para elegir una opción: [[valor, texto], ...]
function segmentos(etiqueta, opciones, inicial, alCambiar) {
  const caja = el('div', { class: 'segmentos', role: 'group', 'aria-label': etiqueta });
  const pintar = (v) => caja.querySelectorAll('.seg').forEach((b) => { const on = b.dataset.v === String(v); b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on)); });
  opciones.forEach(([v, t]) => caja.append(el('button', { class: 'seg', type: 'button', 'data-v': String(v), onclick: () => { pintar(v); alCambiar(v); } }, t)));
  pintar(inicial);
  return caja;
}

const bloque = (icono, titulo, desc, ...contenido) =>
  el('details', { class: 'util-bloque' },
    el('summary', {}, el('span', { class: 'util-icono' }, icono), el('span', { class: 'juego-texto' }, el('strong', {}, titulo), el('span', { class: 'juego-desc' }, desc)), el('span', { class: 'flecha', 'aria-hidden': 'true' }, '›')),
    el('div', { class: 'util-cuerpo' }, contenido)
  );

// ---------- calculadoras ----------
function calcCuentaVerdadera() {
  const salida = el('p', { class: 'resultado-calc', role: 'status', 'aria-live': 'polite' });
  const apuesta = el('p', { class: 'calc-extra' });
  const nota = el('p', { class: 'util-nota' });
  let corriente = 6;
  let mazos = 2;
  const calcular = () => {
    const v = UTIL.cuentaVerdadera(corriente, mazos);
    const t = Math.round(v * 10) / 10;
    const ventaja = UTIL.ventajaJugador(v);
    salida.textContent = `Cuenta verdadera: ${conSigno(t)}`;
    apuesta.textContent = `Apuesta sugerida: ${UTIL.unidadesApuesta(v)} ${UTIL.unidadesApuesta(v) === 1 ? 'unidad' : 'unidades'} · Ventaja aprox. ${ventaja > 0 ? '+' : ventaja < 0 ? '−' : ''}${fmt(Math.abs(ventaja))} %`;
    nota.textContent = v >= 2 ? 'Favorable: quedan muchas cartas altas. Es momento de subir la apuesta.' : v <= -1 ? 'Desfavorable: quedan más cartas bajas. Apuesta lo mínimo.' : 'Neutra: apuesta lo mínimo.';
  };
  calcular();
  return bloque('🧮', 'Cuenta verdadera', 'Cuenta corriente ÷ mazos, con apuesta sugerida',
    el('div', { class: 'campos' }, campo('Cuenta corriente', corriente, { min: -40, max: 40 }, (v) => ((corriente = v), calcular())), campo('Mazos que quedan', mazos, { min: 0.5, max: 8, paso: 0.5 }, (v) => ((mazos = v), calcular()))),
    salida, apuesta, nota);
}

function calcOuts() {
  const flop = el('p', { class: 'resultado-calc' });
  const turn = el('p', { class: 'resultado-calc' });
  let outs = 9;
  const calcular = () => {
    const f = UTIL.outsFlop(outs);
    const t = UTIL.outsTurn(outs);
    flop.textContent = `En el flop: ≈ ${fmt(f.aprox, 0)} % (exacto ${fmt(f.exacto, 0)} %)`;
    turn.textContent = `En el turn: ≈ ${fmt(t.aprox, 0)} % (exacto ${fmt(t.exacto, 0)} %)`;
  };
  calcular();
  const campoOuts = campo('Outs', outs, { min: 0, max: 20 }, (v) => ((outs = v), calcular()));
  const atajos = el('div', { class: 'atajos', role: 'group', 'aria-label': 'Proyectos habituales' },
    [['Color', 9], ['Escalera abierta', 8], ['Color + escalera', 15], ['Dos cartas altas', 6], ['Gutshot', 4], ['Pareja a trío', 2]].map(([t, n]) =>
      el('button', { class: 'atajo', type: 'button', onclick: () => campoOuts.poner(n) }, `${t} · ${n}`)));
  return bloque('🎯', 'Probabilidad con outs', 'Regla del 4 y el 2, con proyectos típicos',
    atajos,
    el('div', { class: 'campos' }, campoOuts),
    flop, turn, el('p', { class: 'util-nota' }, 'Regla rápida: outs × 4 en el flop (dos cartas por salir) y outs × 2 en el turn (una carta por salir).'));
}

function calcPotOdds() {
  const salida = el('p', { class: 'resultado-calc', role: 'status', 'aria-live': 'polite' });
  const relacion = el('p', { class: 'calc-extra' });
  const veredicto = el('p', { class: 'calc-veredicto', role: 'status', 'aria-live': 'polite' });
  const nota = el('p', { class: 'util-nota' });
  let bote = 100;
  let pagar = 25;
  let outs = 9;
  const calcular = () => {
    const p = UTIL.potOdds(bote, pagar);
    const t = UTIL.outsTurn(outs).exacto;
    salida.textContent = `Pagas el ${fmt(p, 0)} % del bote final`;
    relacion.textContent = pagar > 0 ? `Relación del bote: ${fmt(bote / pagar)} a 1` : 'Sin pagar nada, siempre compensa.';
    const compensa = t > p;
    veredicto.textContent = compensa ? `Compensa: con ${outs} outs completas el ${fmt(t, 0)} % de las veces.` : `No compensa: con ${outs} outs completas solo el ${fmt(t, 0)} %.`;
    veredicto.classList.toggle('si', compensa);
    veredicto.classList.toggle('no', !compensa);
    nota.textContent = `Pagar compensa a la larga si tu probabilidad de completar es mayor que ${fmt(p, 0)} %. Aquí se compara con una sola carta por salir.`;
  };
  calcular();
  return bloque('💰', 'Pot odds', 'Cuánto pagas frente a lo que puedes ganar',
    el('div', { class: 'campos' },
      campo('Fichas en el bote', bote, { min: 0, max: 9999, paso: 5 }, (v) => ((bote = v), calcular())),
      campo('Fichas que debes pagar', pagar, { min: 0, max: 9999, paso: 5 }, (v) => ((pagar = v), calcular())),
      campo('Tus outs', outs, { min: 0, max: 20 }, (v) => ((outs = v), calcular()))),
    salida, relacion, veredicto, nota);
}

function calcPasarte() {
  const salida = el('p', { class: 'resultado-calc', role: 'status', 'aria-live': 'polite' });
  const nota = el('p', { class: 'util-nota' });
  let total = 16;
  const calcular = () => {
    const p = UTIL.pasarteAlPedir(total);
    salida.textContent = total <= 11 ? 'Con ' + total + ' no puedes pasarte: 0 %' : `Con ${total}, si pides te pasas el ${fmt(p, 0)} %`;
    nota.textContent = total <= 11 ? 'Pide siempre: ninguna carta te pasa de 21.' : p >= 50 ? 'Más de la mitad de las cartas te pasan. Mira qué enseña el crupier antes de pedir.' : 'Menos de la mitad de las cartas te pasan. Pedir puede compensar según la carta del crupier.';
  };
  calcular();
  const tabla = el('div', { class: 'mini-tabla', role: 'table', 'aria-label': 'Probabilidad de que el crupier se pase según su carta' },
    [2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((c) => el('div', { class: 'mini-celda', role: 'row' }, el('b', {}, c === 11 ? 'A' : String(c)), el('span', { class: c <= 6 ? 'alta' : '' }, fmt(UTIL.crupierSePasa(c), 0) + ' %'))));
  return bloque('✋', 'Pasarte al pedir', 'Riesgo de pasarte y de que se pase el crupier',
    el('div', { class: 'campos' }, campo('Tu total (mano dura)', total, { min: 4, max: 21 }, (v) => ((total = v), calcular()))),
    salida, nota,
    el('h3', {}, 'Probabilidad de que el crupier se pase'),
    tabla,
    el('p', { class: 'util-nota' }, 'Con 2 a 6 se pasa a menudo: por eso con totales flojos conviene plantarte y dejar que se pase él.'));
}

function calcApuesta() {
  const salida = el('p', { class: 'resultado-calc', role: 'status', 'aria-live': 'polite' });
  const detalle = el('p', { class: 'calc-extra' });
  const nota = el('p', { class: 'util-nota' });
  let banca = 1000;
  let tc = 2;
  const calcular = () => {
    const r = UTIL.apuestaSugerida(banca, tc);
    salida.textContent = `Apuesta sugerida: ${r.apuesta} fichas`;
    detalle.textContent = `Unidad ${r.unidad} · ${r.unidades} ${r.unidades === 1 ? 'unidad' : 'unidades'} con cuenta verdadera ${conSigno(tc)}`;
    nota.textContent = tc <= 1 ? 'Sin ventaja: apuesta la unidad mínima (o no juegues la mano).' : 'Subes la apuesta solo cuando la cuenta te favorece. Nunca persigas las pérdidas.';
  };
  calcular();
  return bloque('🏦', 'Tamaño de apuesta', 'Cuánto apostar según tu banca y la cuenta',
    el('div', { class: 'campos' }, campo('Tu banca (fichas)', banca, { min: 100, max: 100000, paso: 100 }, (v) => ((banca = v), calcular())), campo('Cuenta verdadera', tc, { min: -10, max: 15 }, (v) => ((tc = v), calcular()))),
    salida, detalle, nota,
    el('p', { class: 'util-nota' }, 'Para practicar, sin dinero real: la unidad es el 1 % de tu banca.'));
}

const RULETA_APUESTAS = [[1, 'Pleno'], [2, 'Caballo'], [3, 'Calle'], [4, 'Cuadro'], [6, 'Línea'], [12, 'Docena'], [18, 'Rojo/Negro']];
function calcRuleta() {
  const salida = el('p', { class: 'resultado-calc', role: 'status', 'aria-live': 'polite' });
  const detalle = el('p', { class: 'calc-extra' });
  const nota = el('p', { class: 'util-nota' });
  let k = 1;
  let n = 37;
  let fichas = 10;
  const calcular = () => {
    const r = UTIL.ruleta(k, n, fichas);
    salida.textContent = `Paga ${fmt(r.pago, 0)} a 1: si ganas cobras ${fmt(r.pago * fichas, 0)} fichas`;
    detalle.textContent = `Probabilidad ${fmt(r.prob)} % · Ventaja de la casa ${fmt(r.casa, 2)} % · Pierdes de media ${fmt(-r.ev, 2)} fichas por tirada`;
    nota.textContent = n === 37 ? 'Rueda europea (un solo cero): todas las apuestas tienen la misma ventaja de la casa.' : 'Rueda americana (0 y 00): la ventaja de la casa casi se duplica. Si puedes, juega a la europea.';
  };
  calcular();
  return bloque('🎡', 'Ruleta: pagos y ventaja', 'Cuánto paga cada apuesta y cuánto te cuesta jugarla',
    el('p', { class: 'util-nota' }, 'Tipo de apuesta:'), segmentos('Tipo de apuesta', RULETA_APUESTAS, k, (v) => ((k = v), calcular())),
    el('p', { class: 'util-nota' }, 'Rueda:'), segmentos('Rueda', [[37, 'Europea'], [38, 'Americana']], n, (v) => ((n = v), calcular())),
    el('div', { class: 'campos' }, campo('Fichas apostadas', fichas, { min: 1, max: 9999, paso: 1 }, (v) => ((fichas = v), calcular()))),
    salida, detalle, nota);
}

// Contador manual para practicar con una baraja real
function contadorRapido() {
  let corriente = 0;
  let vistas = 0;
  let mazos = 6;
  const historial = [];
  const gran = el('p', { class: 'contador-gran', role: 'status', 'aria-live': 'polite' });
  const detalle = el('p', { class: 'util-nota' });
  const pinta = () => {
    const restantes = Math.max(0.5, mazos - vistas / 52);
    gran.textContent = conSigno(corriente);
    const tcv = UTIL.cuentaVerdadera(corriente, restantes);
    detalle.textContent = `${vistas} cartas vistas · quedan ≈ ${fmt(restantes)} mazos · cuenta verdadera ${conSigno(Math.round(tcv * 10) / 10)} · apuesta sugerida ${UTIL.unidadesApuesta(tcv)} ${UTIL.unidadesApuesta(tcv) === 1 ? 'unidad' : 'unidades'}`;
  };
  const sumar = (grupo, texto) =>
    el('button', { class: 'contador-boton', type: 'button', onclick: () => { corriente += UTIL.valorHiLo(grupo); vistas += 1; historial.push(grupo); pinta(); } }, el('strong', {}, conSigno(UTIL.valorHiLo(grupo))), el('small', {}, texto));
  pinta();
  const mazosSel = el('div', { class: 'segmentos', role: 'group', 'aria-label': 'Mazos al empezar' },
    [1, 2, 4, 6, 8].map((n) => el('button', { class: 'seg' + (n === mazos ? ' on' : ''), type: 'button', 'aria-pressed': String(n === mazos), onclick: (e) => { mazos = n; mazosSel.querySelectorAll('.seg').forEach((b) => { b.classList.toggle('on', b === e.currentTarget); b.setAttribute('aria-pressed', String(b === e.currentTarget)); }); pinta(); } }, `${n} ${n === 1 ? 'mazo' : 'mazos'}`)));
  return bloque('🃏', 'Contador rápido', 'Cuenta cartas reales: toca según salgan',
    el('p', { class: 'util-nota' }, 'Mazos al empezar:'), mazosSel, gran,
    el('div', { class: 'contador-botones' }, sumar('bajas', '2 a 6'), sumar('neutras', '7 a 9'), sumar('altas', '10 a As')),
    detalle,
    el('div', { class: 'ajuste-botones' },
      el('button', { class: 'boton secundario', type: 'button', onclick: () => { const g = historial.pop(); if (g) { corriente -= UTIL.valorHiLo(g); vistas -= 1; pinta(); } } }, 'Deshacer'),
      el('button', { class: 'boton secundario', type: 'button', onclick: () => { corriente = 0; vistas = 0; historial.length = 0; pinta(); } }, 'Reiniciar')));
}

// ---------- chuletas (gratis) y bloques exclusivos del VIP ----------
// Las calculadoras son exclusivas del VIP: llevan borde dorado y, sin VIP, el bloque lleva un candado y abre la pantalla del pase.
function exclusivoVip(b) {
  b.classList.add('exclusivo-vip');
  if (esVip()) {
    b.querySelector('.util-icono').after(el('span', { class: 'etiqueta-vip' }, el('span', { class: 'ico-vip', 'aria-hidden': 'true' }, '👑'), 'VIP'));
    return b;
  }
  b.classList.add('bloqueada');
  const resumen = b.querySelector('summary');
  b.querySelector('.util-cuerpo').remove();
  resumen.querySelector('.flecha').replaceWith(el('span', { class: 'candado-vip', 'aria-hidden': 'true' }, '🔒'));
  resumen.setAttribute('aria-label', resumen.textContent.replace(/\s+/g, ' ').trim() + '. Exclusiva del pase VIP');
  resumen.addEventListener('click', (e) => { e.preventDefault(); sonido('toque'); mostrarPremium(() => mostrarUtil('atras')); });
  return b;
}
const CODIGOS = { P: ['Pe', 'pedir'], S: ['Pl', 'plantarte'], D: ['Do', 'doblar'], X: ['Di', 'dividir'] };
function tablaEstrategia(titulo, filas) {
  return el('div', { class: 'tabla-caja' },
    el('table', { class: 'tabla-bj' },
      el('caption', {}, titulo),
      el('thead', {}, el('tr', {}, el('th', { scope: 'col' }, 'Tú'), AYUDA.crupier.map((c) => el('th', { scope: 'col', 'aria-label': `Crupier ${c}` }, c)))),
      el('tbody', {}, filas.map((f) => el('tr', {}, el('th', { scope: 'row' }, f.etiqueta), f.celdas.split('').map((k, i) => el('td', { class: 'c-' + k, 'aria-label': `${f.etiqueta} contra ${AYUDA.crupier[i]}: ${CODIGOS[k][1]}` }, CODIGOS[k][0])))))
    ));
}
function chuletaBlackjack() {
  return bloque('2️⃣', 'Blackjack: estrategia básica', 'Qué hacer con cada mano',
    el('p', { class: 'util-nota' }, 'Arriba, la carta que enseña el crupier. Para 4-8 mazos, el crupier se planta con 17 blando.'),
    el('div', { class: 'leyenda' }, Object.entries(CODIGOS).map(([k, [a, t]]) => el('span', { class: 'leyenda-item c-' + k }, `${a} ${t}`))),
    tablaEstrategia('Manos duras (sin As, o con As que vale 1)', AYUDA.estrategia.duras),
    tablaEstrategia('Manos blandas (con un As que vale 11)', AYUDA.estrategia.blandas),
    tablaEstrategia('Parejas', AYUDA.estrategia.parejas));
}
function chuletaConteo() {
  return bloque('➕', 'Blackjack: conteo Hi-Lo y pagos', 'Valores de las cartas y cuánto paga cada cosa',
    el('table', { class: 'tabla-simple' }, el('tbody', {},
      el('tr', {}, el('th', {}, '2 · 3 · 4 · 5 · 6'), el('td', { class: 'pos' }, '+1')),
      el('tr', {}, el('th', {}, '7 · 8 · 9'), el('td', {}, '0')),
      el('tr', {}, el('th', {}, '10 · J · Q · K · A'), el('td', { class: 'neg' }, '−1')))),
    el('ul', { class: 'util-lista' },
      el('li', {}, 'Cuenta corriente: suma los valores de todas las cartas que salen.'),
      el('li', {}, 'Cuenta verdadera: cuenta corriente ÷ mazos que quedan.'),
      el('li', {}, 'Blackjack natural: paga 3 a 2 (en algunas mesas, 6 a 5).'),
      el('li', {}, 'Seguro: hasta la mitad de tu apuesta, paga 2 a 1.'),
      el('li', {}, 'Rendirse: pierdes la mitad de la apuesta (donde se permite).')));
}
function chuletaPoker() {
  return bloque('♦️', 'Póker: ranking de manos', 'De la más fuerte a la más débil',
    el('ol', { class: 'ranking' }, AYUDA.poker.map((m) => el('li', {}, el('strong', {}, m.nombre), manoTexto(m.ejemplo), el('small', {}, m.desc)))),
    el('h3', {}, 'Outs más habituales'),
    el('table', { class: 'tabla-simple' }, el('tbody', {}, AYUDA.outs.map(([n, v]) => el('tr', {}, el('th', {}, n), el('td', {}, `${v} outs`))))));
}
function chuletaMus() {
  return bloque('🪙', 'Mus: valores y lances', 'Cartas, orden de los lances y piedras',
    el('ul', { class: 'util-lista' },
      el('li', {}, el('strong', {}, 'Valores: '), 'Rey, Caballo, Sota y 3 valen 10; As y 2 valen 1; las demás, lo que marcan.'),
      el('li', {}, el('strong', {}, '8 reyes: '), 'los treses cuentan como reyes y los doses como ases.'),
      el('li', {}, el('strong', {}, 'Lances, en orden: '), 'Grande, Chica, Pares y Juego (o Punto si nadie tiene juego).'),
      el('li', {}, el('strong', {}, 'Pares: '), 'pareja (1 piedra), medias (2) y duples (3).'),
      el('li', {}, el('strong', {}, 'Juego: '), 'de mejor a peor: 31, 32, 40, 37, 36, 35, 34 y 33. El 31 vale 3 piedras y los demás juegos, 2.'),
      el('li', {}, el('strong', {}, 'Punto: '), 'si nadie tiene juego, gana el que más se acerque a 30. Vale 1 piedra.'),
      el('li', {}, el('strong', {}, 'Amarraco: '), 'cinco piedras. La partida llega a 40.')));
}
function glosario() {
  return bloque('📖', 'Glosario', 'Los términos que más se repiten',
    el('dl', { class: 'glosario' }, AYUDA.glosario.flatMap(([t, d]) => [el('dt', {}, t), el('dd', {}, d)])));
}

function mostrarUtil(entrada = 'fundido') {
  alTeclear = null;
  pintar(
    entrada,
    el('header', { class: 'cabecera' }, logoMarca(), marcador()),
    el('main', { class: 'contenido' },
      el('h1', {}, '🧰 Útil'),
      el('p', { class: 'util-intro' }, 'Calculadoras y chuletas para tener a mano mientras juegas. Pulsa una para abrirla.'),
      el('h2', { class: 'util-grupo' }, 'Calculadoras · exclusivas VIP'),
      esVip() ? null : el('p', { class: 'util-nota' }, 'Cuenta verdadera, outs, pot odds, riesgo de pasarte, tamaño de apuesta, ruleta y un contador de cartas. Toca una calculadora para conocer el pase VIP.'),
      exclusivoVip(calcCuentaVerdadera()), exclusivoVip(calcOuts()), exclusivoVip(calcPotOdds()), exclusivoVip(calcPasarte()), exclusivoVip(calcApuesta()), exclusivoVip(calcRuleta()), exclusivoVip(contadorRapido()),
      el('h2', { class: 'util-grupo' }, 'Chuletas · gratis para todos'),
      chuletaBlackjack(), chuletaConteo(), chuletaPoker(), chuletaMus(), glosario()));
}
