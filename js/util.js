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
  return el(
    'label',
    { class: 'campo' },
    el('span', { class: 'campo-etiqueta' }, etiqueta),
    el('span', { class: 'campo-fila' },
      el('button', { class: 'campo-paso', type: 'button', 'aria-label': `Quitar a ${etiqueta}`, onclick: () => poner(valor - paso) }, '−'),
      entrada,
      el('button', { class: 'campo-paso', type: 'button', 'aria-label': `Sumar a ${etiqueta}`, onclick: () => poner(valor + paso) }, '+')
    )
  );
}

const bloque = (icono, titulo, desc, ...contenido) =>
  el('details', { class: 'util-bloque' },
    el('summary', {}, el('span', { class: 'util-icono' }, icono), el('span', { class: 'juego-texto' }, el('strong', {}, titulo), el('span', { class: 'juego-desc' }, desc)), el('span', { class: 'flecha', 'aria-hidden': 'true' }, '›')),
    el('div', { class: 'util-cuerpo' }, contenido)
  );

// ---------- calculadoras ----------
function calcCuentaVerdadera() {
  const salida = el('p', { class: 'resultado-calc', role: 'status', 'aria-live': 'polite' });
  const nota = el('p', { class: 'util-nota' });
  let corriente = 6;
  let mazos = 2;
  const calcular = () => {
    const v = UTIL.cuentaVerdadera(corriente, mazos);
    salida.textContent = `Cuenta verdadera: ${conSigno(Math.round(v * 10) / 10)}`;
    nota.textContent = v >= 2 ? 'Favorable: quedan muchas cartas altas. Es momento de subir la apuesta.' : v <= -1 ? 'Desfavorable: quedan más cartas bajas. Apuesta lo mínimo.' : 'Neutra: apuesta lo mínimo.';
  };
  calcular();
  return bloque('🧮', 'Cuenta verdadera', 'Cuenta corriente ÷ mazos que quedan',
    el('div', { class: 'campos' }, campo('Cuenta corriente', corriente, { min: -40, max: 40 }, (v) => ((corriente = v), calcular())), campo('Mazos que quedan', mazos, { min: 0.5, max: 8, paso: 0.5 }, (v) => ((mazos = v), calcular()))),
    salida, nota);
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
  return bloque('🎯', 'Probabilidad con outs', 'Regla del 4 y el 2',
    el('div', { class: 'campos' }, campo('Outs', outs, { min: 0, max: 20 }, (v) => ((outs = v), calcular()))),
    flop, turn, el('p', { class: 'util-nota' }, 'Regla rápida: outs × 4 en el flop (dos cartas por salir) y outs × 2 en el turn (una carta por salir).'));
}

function calcPotOdds() {
  const salida = el('p', { class: 'resultado-calc', role: 'status', 'aria-live': 'polite' });
  const nota = el('p', { class: 'util-nota' });
  let bote = 100;
  let pagar = 25;
  const calcular = () => {
    const p = UTIL.potOdds(bote, pagar);
    salida.textContent = `Pagas el ${fmt(p, 0)} % del bote final`;
    nota.textContent = `Pagar compensa a la larga si tu probabilidad de completar es mayor que ${fmt(p, 0)} %.`;
  };
  calcular();
  return bloque('💰', 'Pot odds', 'Cuánto pagas frente a lo que puedes ganar',
    el('div', { class: 'campos' }, campo('Fichas en el bote', bote, { min: 0, max: 9999, paso: 5 }, (v) => ((bote = v), calcular())), campo('Fichas que debes pagar', pagar, { min: 0, max: 9999, paso: 5 }, (v) => ((pagar = v), calcular()))),
    salida, nota);
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
    detalle.textContent = `${vistas} cartas vistas · quedan ≈ ${fmt(restantes)} mazos · cuenta verdadera ${conSigno(Math.round(UTIL.cuentaVerdadera(corriente, restantes) * 10) / 10)}`;
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

// ---------- chuletas ----------
// Las chuletas son exclusivas del VIP: llevan borde dorado y, sin VIP, el bloque lleva un candado y abre la pantalla del pase.
function chuleta(b) {
  b.classList.add('chuleta');
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
    el('header', { class: 'cabecera' }, el('span', { class: 'logo' }, el('span', { class: 'logo-palo' }, '♥'), 'Entrenador de cartas'), marcador()),
    el('main', { class: 'contenido' },
      el('h1', {}, '🧰 Útil'),
      el('p', { class: 'util-intro' }, 'Calculadoras y chuletas para tener a mano mientras juegas. Pulsa una para abrirla.'),
      el('h2', { class: 'util-grupo' }, 'Calculadoras'),
      calcCuentaVerdadera(), calcOuts(), calcPotOdds(), contadorRapido(),
      el('h2', { class: 'util-grupo' }, 'Chuletas · exclusivas VIP'),
      esVip() ? null : el('p', { class: 'util-nota' }, 'Estrategia básica, ranking de manos, valores del mus y glosario, siempre a mano. Toca una chuleta para conocer el pase VIP.'),
      chuleta(chuletaBlackjack()), chuleta(chuletaConteo()), chuleta(chuletaPoker()), chuleta(chuletaMus()), chuleta(glosario())));
}
