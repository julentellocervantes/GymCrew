// SIMULADOR DE BLACKJACK: manos completas contra el crupier, con la estrategia básica corrigiendo cada decisión.
// Mazo de 6 barajas que se va gastando (la cuenta Hi-Lo es real), apuesta fija, el crupier se planta con 17 (también blando), sin seguro.
// Se carga después de extras.js y usa sus funciones (el, pintar, naiFila, carta, finalizarLeccion...).

const SIM_MANOS = 10; // manos por sesión
const SIM_APUESTA = 10;
const SIM_SALDO = 200;

// ---------- reglas (funciones puras; tests/validar.js las comprueba contra la tabla de estrategia) ----------
const simRango = (c) => String(c).replace(/[♠♥♦♣]/g, '');
const simValor = (c) => { const r = simRango(c); return r === 'A' ? 11 : 'JQK'.includes(r) ? 10 : Number(r); };
function simTotal(cartas) {
  let t = cartas.reduce((s, c) => s + simValor(c), 0), ases = cartas.filter((c) => simRango(c) === 'A').length;
  while (t > 21 && ases > 0) { t -= 10; ases--; }
  return { t, blando: ases > 0 };
}
const simHiLo = (c) => { const v = simValor(c), r = simRango(c); return v >= 2 && v <= 6 && r !== 'A' ? 1 : v >= 10 || r === 'A' ? -1 : 0; };
const simEsBlackjack = (cartas) => cartas.length === 2 && simTotal(cartas).t === 21;

// Jugada que marca la estrategia básica (la tabla de AYUDA). Si no se puede doblar o dividir se usa la alternativa habitual.
function simEstrategia(cartas, crupier, puedeDoblar = true, puedeDividir = true) {
  const col = AYUDA.crupier.indexOf(simValor(crupier) === 11 ? 'A' : String(simValor(crupier)));
  const letra = (fila) => fila.celdas[col];
  let a;
  if (cartas.length === 2 && simValor(cartas[0]) === simValor(cartas[1])) {
    const v = simValor(cartas[0]);
    const etiqueta = v === 11 ? 'A,A' : v === 10 ? '10,10' : v === 3 || v === 2 ? '3,3 · 2,2' : `${v},${v}`;
    a = letra(AYUDA.estrategia.parejas.find((f) => f.etiqueta === etiqueta));
    if (a === 'X' && !puedeDividir) a = null; // se juega como mano normal
    else if (a) return a === 'D' && !puedeDoblar ? 'P' : a;
  }
  const { t, blando } = simTotal(cartas);
  if (blando && t <= 21) {
    const filas = AYUDA.estrategia.blandas;
    const fila = t >= 19 ? filas[4] : t === 18 ? filas[3] : t === 17 ? filas[2] : t >= 15 ? filas[1] : filas[0];
    a = letra(fila);
    if (a === 'D' && !puedeDoblar) return t === 18 ? 'S' : 'P'; // «doblar, si no pedir» (y con A,7 «doblar, si no plantarse»)
    return a;
  }
  const f = AYUDA.estrategia.duras;
  const fila = t <= 8 ? f[0] : t === 9 ? f[1] : t === 10 ? f[2] : t === 11 ? f[3] : t === 12 ? f[4] : t <= 16 ? f[5] : f[6];
  a = letra(fila);
  return a === 'D' && !puedeDoblar ? 'P' : a;
}
const SIM_NOMBRE = { P: 'Pedir', S: 'Plantarte', D: 'Doblar', X: 'Dividir' };
function simPorQue(a, crupier) {
  const debil = ['2', '3', '4', '5', '6'].includes(simRango(crupier));
  const quien = debil ? 'una carta débil (se pasa a menudo)' : 'una carta fuerte';
  if (a === 'D') return `Doblar: tu mano puede mejorar mucho y el crupier enseña ${quien}.`;
  if (a === 'X') return `Dividir: dos manos por separado rinden más que esta pareja junta contra ${quien}.`;
  if (a === 'S') return `Plantarte: con este total pedir arriesga más de lo que gana frente a ${quien}.`;
  return `Pedir: quedarte aquí no basta frente a ${quien}.`;
}

// Mazo de n barajas, mezclado
function simMazo(n = 6) {
  const m = [];
  for (let k = 0; k < n; k++) for (const p of ['♠', '♥', '♦', '♣']) for (const r of ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A']) m.push(r + p);
  for (let i = m.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [m[i], m[j]] = [m[j], m[i]]; }
  return m;
}

// ---------- pantalla de inicio ----------
let simConfig = { contar: false };
function mostrarSimulador(entrada = 'adelante') {
  alTeclear = null;
  const { fila } = naiFila('feliz', `Jugamos ${SIM_MANOS} manos de verdad. Tú decides; después de cada jugada te digo qué marca la estrategia básica y por qué.`, 'pequena');
  const mejor = progreso.simulador && progreso.simulador.mejor;
  pintar(
    entrada,
    el('header', { class: 'cabecera' }, el('button', { class: 'volver', type: 'button', 'aria-label': 'Volver', onclick: () => mostrarInicio('atras') }, '←'), marcador()),
    el('main', { class: 'contenido' },
      el('h1', {}, '🃏 Simulador de blackjack'),
      fila,
      el('section', { class: 'ajuste' }, el('h2', {}, 'Cuenta de cartas'),
        el('div', { class: 'segmentos', role: 'group', 'aria-label': 'Cuenta de cartas' },
          [[false, 'Solo estrategia'], [true, 'Estrategia y cuenta Hi-Lo']].map(([v, t]) =>
            el('button', { class: 'seg' + (v === simConfig.contar ? ' on' : ''), type: 'button', 'aria-pressed': String(v === simConfig.contar), onclick: () => { simConfig.contar = v; mostrarSimulador('sin'); } }, t))),
        el('p', { class: 'aviso' }, simConfig.contar ? 'Al acabar cada mano te pregunto cuánto vale la cuenta corriente.' : 'Sin preguntas de cuenta: solo decides pedir, plantarte, doblar o dividir.')),
      el('p', { class: 'aviso' }, `Empiezas con ${SIM_SALDO} fichas de mentira y apuestas ${SIM_APUESTA} por mano. Mazo de 6 barajas, el crupier se planta con 17, sin seguro. Es práctica: no se juega dinero real.`),
      mejor ? el('p', { class: 'aviso' }, `Tu mejor sesión: ${mejor} % de decisiones correctas.`) : null),
    el('div', { class: 'pie' }, el('button', { class: 'boton', type: 'button', onclick: () => correrSimulador() }, 'Empezar'))
  );
}

// ---------- la partida ----------
function correrSimulador() {
  const mazo = simMazo(6);
  const e = { mano: 0, saldo: SIM_SALDO, cuenta: 0, decisiones: 0, buenas: 0, errores: [], pregC: 0, buenasC: 0, neto: 0 };
  let manos = [], actual = 0, crupier = [], fase = 'inicio', aviso = null, resultados = [], pregunta = null, final = false;
  const sacar = (visible = true) => { const c = mazo.pop(); if (visible) e.cuenta += simHiLo(c); return c; };

  const nuevaMano = () => {
    e.mano += 1;
    manos = [{ cartas: [], apuesta: SIM_APUESTA, doblada: false, fin: false }];
    actual = 0; resultados = []; aviso = null; pregunta = null; crupierDestapada = false;
    manos[0].cartas = [sacar(), null]; crupier = [sacar(), null];
    manos[0].cartas[1] = sacar(); crupier[1] = sacar(false); // la carta tapada del crupier no entra en la cuenta hasta que se descubre
    fase = 'jugar';
    // blackjack del jugador o del crupier: la mano se resuelve al momento
    if (simEsBlackjack(manos[0].cartas) || simEsBlackjack(crupier)) return resolver();
    dibujar();
  };

  const manoActual = () => manos[actual];
  const siguienteMano = () => {
    actual += 1;
    while (actual < manos.length && manos[actual].fin) actual += 1;
    if (actual >= manos.length) return crupierJuega();
    if (manos[actual].cartas.length === 1) manos[actual].cartas.push(sacar());
    dibujar();
  };

  function decidir(jugada) {
    const m = manoActual();
    const primera = m.cartas.length === 2;
    const puedeDividir = primera && manos.length === 1 && simValor(m.cartas[0]) === simValor(m.cartas[1]);
    const puedeDoblar = primera && e.saldo - manos.reduce((s, x) => s + x.apuesta, 0) >= m.apuesta;
    const correcta = simEstrategia(m.cartas, crupier[0], puedeDoblar, puedeDividir);
    e.decisiones += 1;
    const bien = jugada === correcta;
    if (bien) e.buenas += 1;
    else e.errores.push({ mano: e.mano, tuMano: m.cartas.join(' '), crupier: crupier[0], tuya: SIM_NOMBRE[jugada], correcta: SIM_NOMBRE[correcta] });
    aviso = { bien, jugada, correcta, texto: bien ? `¡Bien! ${simPorQue(correcta, crupier[0])}` : `La estrategia básica marca ${SIM_NOMBRE[correcta].toLowerCase()}. ${simPorQue(correcta, crupier[0])}` };
    sonido(bien ? 'acierto' : 'error');
    if (jugada === 'P') {
      m.cartas.push(sacar());
      const { t } = simTotal(m.cartas);
      if (t > 21) { m.fin = true; return siguienteMano(); }
      if (t === 21) { m.fin = true; return siguienteMano(); }
    } else if (jugada === 'S') {
      m.fin = true; return siguienteMano();
    } else if (jugada === 'D') {
      m.apuesta *= 2; m.doblada = true; m.cartas.push(sacar()); m.fin = true; return siguienteMano();
    } else if (jugada === 'X') {
      const [a, b] = m.cartas;
      manos = [{ cartas: [a], apuesta: m.apuesta, doblada: false, fin: false }, { cartas: [b], apuesta: m.apuesta, doblada: false, fin: false }];
      actual = 0; manos[0].cartas.push(sacar());
      if (simRango(a) === 'A') { manos.forEach((x, i) => { if (i === 1) x.cartas.push(sacar()); x.fin = true; }); return crupierJuega(); } // con ases solo se da una carta a cada uno
    }
    dibujar();
  }

  function crupierJuega() {
    fase = 'crupier';
    e.cuenta += simHiLo(crupier[1]); // se destapa la carta tapada
    crupierDestapada = true;
    const vivas = manos.some((m) => simTotal(m.cartas).t <= 21);
    if (vivas) while (simTotal(crupier).t < 17) crupier.push(sacar());
    resolver();
  }

  function resolver() {
    fase = 'resultado';
    if (!crupierDestapada) { e.cuenta += simHiLo(crupier[1]); crupierDestapada = true; } // blackjack nada más repartir: se destapa ahora
    const ct = simTotal(crupier).t, cbj = simEsBlackjack(crupier);
    resultados = manos.map((m) => {
      const { t } = simTotal(m.cartas), bj = manos.length === 1 && simEsBlackjack(m.cartas);
      let neto, texto;
      if (bj && !cbj) { neto = m.apuesta * 1.5; texto = '¡Blackjack! Cobras 3 a 2'; }
      else if (bj && cbj) { neto = 0; texto = 'Blackjack de los dos: empate'; }
      else if (cbj) { neto = -m.apuesta; texto = 'El crupier tiene blackjack'; }
      else if (t > 21) { neto = -m.apuesta; texto = `Te pasas con ${t}`; }
      else if (ct > 21) { neto = m.apuesta; texto = `El crupier se pasa con ${ct}`; }
      else if (t > ct) { neto = m.apuesta; texto = `Ganas ${t} a ${ct}`; }
      else if (t < ct) { neto = -m.apuesta; texto = `Pierdes ${t} a ${ct}`; }
      else { neto = 0; texto = `Empate a ${t}`; }
      return { neto, texto };
    });
    const total = resultados.reduce((s, r) => s + r.neto, 0);
    e.saldo += total; e.neto += total;
    if (total > 0) sonido('unir');
    dibujar();
  }
  let crupierDestapada = false;

  const siguienteTrasMano = () => {
    if (e.mano >= SIM_MANOS) return terminar();
    nuevaMano();
  };
  const preguntarCuenta = () => {
    const real = e.cuenta;
    const desde = real - Math.floor(Math.random() * 4); // la cuenta correcta puede caer en cualquiera de las 4 posiciones
    const opciones = [0, 1, 2, 3].map((k) => desde + k);
    pregunta = { real, opciones, respondida: null };
    dibujar();
  };
  const signo = (n) => (n > 0 ? '+' + n : n < 0 ? '−' + Math.abs(n) : '0');

  function terminar() {
    final = true;
    const pct = e.decisiones ? Math.round((100 * e.buenas) / e.decisiones) : 100;
    progreso.simulador = progreso.simulador || { sesiones: 0, mejor: 0 };
    progreso.simulador.sesiones += 1;
    progreso.simulador.mejor = Math.max(progreso.simulador.mejor || 0, pct);
    alTeclear = null;
    const curso = { id: 'global', nombre: 'Simulador', icono: '🃏', color: '#2e8b57', unidades: [], global: true };
    const hecho = { id: 'simulador', titulo: 'Simulador de blackjack', icono: '🃏', xp: 20, repaso: true };
    guardarProgreso();
    mostrarResumenSimulador(e, pct, () => finalizarLeccion(curso, hecho, pct));
  }

  function dibujar() {
    if (final) return;
    const m = manos[actual] || manos[0];
    const jugando = fase === 'jugar';
    const primera = jugando && m.cartas.length === 2;
    const puedeDividir = primera && manos.length === 1 && simValor(m.cartas[0]) === simValor(m.cartas[1]);
    const puedeDoblar = primera && e.saldo - manos.reduce((s, x) => s + x.apuesta, 0) >= m.apuesta;
    const tapada = fase === 'jugar';
    const verMano = (x, i) => {
      const { t, blando } = simTotal(x.cartas);
      const etiqueta = manos.length > 1 ? `Mano ${i + 1}` : 'Tu mano';
      return [
        el('p', { class: 'mesa-etiqueta' + (i > 0 || true ? ' separada' : '') + (jugando && i === actual && manos.length > 1 ? ' activa' : '') }, `${etiqueta} · ${t}${blando && t < 21 ? ' blando' : ''}${x.doblada ? ' · doblada' : ''}${t > 21 ? ' · te pasas' : ''}`),
        el('div', { class: 'fila' }, x.cartas.map((c, k) => carta(c, k))),
        fase === 'resultado' && resultados[i] ? el('p', { class: 'sim-resultado ' + (resultados[i].neto > 0 ? 'gana' : resultados[i].neto < 0 ? 'pierde' : 'empata') }, `${resultados[i].texto} (${resultados[i].neto > 0 ? '+' : resultados[i].neto < 0 ? '−' : ''}${Math.abs(resultados[i].neto)})`) : null,
      ];
    };
    const crupierTotal = tapada ? simValor(crupier[0]) : simTotal(crupier).t;
    const mesa = el('div', { class: 'mesa sim-mesa' },
      el('p', { class: 'mesa-etiqueta' }, `Crupier · ${tapada ? 'enseña ' + (simRango(crupier[0]) === 'A' ? 'As' : simValor(crupier[0])) : crupierTotal}`),
      el('div', { class: 'fila' }, tapada ? [carta(crupier[0], 0), el('div', { class: 'carta dorso', role: 'img', 'aria-label': 'Carta tapada' }, '?')] : crupier.map((c, k) => carta(c, k))),
      manos.map(verMano));
    const boton = (clave, texto, activo) => el('button', { class: 'sim-boton', type: 'button', 'data-jugada': clave, disabled: activo ? null : '', onclick: () => decidir(clave) }, texto);
    const acciones = jugando
      ? el('div', { class: 'sim-acciones', role: 'group', 'aria-label': 'Tu jugada' }, boton('P', 'Pedir', true), boton('S', 'Plantarte', true), boton('D', 'Doblar', puedeDoblar), boton('X', 'Dividir', puedeDividir))
      : null;
    const cabecera = el('header', { class: 'cabecera-leccion' },
      el('button', { class: 'cerrar', type: 'button', 'aria-label': 'Salir del simulador', onclick: () => { final = true; mostrarSimulador('atras'); } }, '✕'),
      el('div', { class: 'barra', role: 'progressbar', 'aria-label': 'Manos jugadas', 'aria-valuemin': '0', 'aria-valuemax': String(SIM_MANOS), 'aria-valuenow': String(e.mano - (fase === 'resultado' ? 0 : 1)) },
        el('div', { class: 'barra-relleno', style: `transform:scaleX(${(e.mano - (fase === 'resultado' ? 0 : 1)) / SIM_MANOS})` })),
      el('span', { class: 'rapida-puntos' }, el('strong', {}, `${e.saldo}`), ' fichas'));
    let pie = null;
    if (fase === 'resultado') {
      if (simConfig.contar && !pregunta) {
        preguntarCuenta(); return;
      }
      if (pregunta) {
        pie = el('div', { class: 'sim-cuenta' },
          el('p', { class: 'ordenar-etiqueta' }, pregunta.respondida === null ? '¿Cuánto vale la cuenta corriente (Hi-Lo)?' : pregunta.respondida === pregunta.real ? `¡Eso es! La cuenta es ${signo(pregunta.real)}` : `La cuenta era ${signo(pregunta.real)}`),
          el('div', { class: 'sim-opciones-cuenta' }, pregunta.opciones.map((v) => el('button', { class: 'sim-cuenta-op' + (pregunta.respondida !== null ? (v === pregunta.real ? ' bien' : v === pregunta.respondida ? ' mal' : '') : ''), type: 'button', 'data-cuenta': String(v), disabled: pregunta.respondida !== null ? '' : null,
            onclick: () => { pregunta.respondida = v; e.pregC += 1; if (v === pregunta.real) e.buenasC += 1; sonido(v === pregunta.real ? 'acierto' : 'error'); dibujar(); } }, signo(v)))),
          pregunta.respondida !== null ? el('button', { class: 'boton', type: 'button', onclick: siguienteTrasMano }, e.mano >= SIM_MANOS ? 'Ver resumen' : 'Siguiente mano') : null);
      } else pie = el('div', { class: 'sim-cuenta' }, el('button', { class: 'boton', type: 'button', onclick: siguienteTrasMano }, e.mano >= SIM_MANOS ? 'Ver resumen' : 'Siguiente mano'));
    }
    alTeclear = (ev) => {
      if (fase !== 'jugar') return;
      const k = { p: 'P', s: 'S', d: 'D', x: 'X' }[ev.key.toLowerCase()];
      if (k === 'D' && !puedeDoblar || k === 'X' && !puedeDividir) return;
      if (k) decidir(k);
    };
    pintar('sin',
      cabecera,
      el('main', { class: 'contenido sim' },
        el('p', { class: 'ordenar-etiqueta' }, `Mano ${e.mano} de ${SIM_MANOS}` + (simConfig.contar ? ' · cuenta oculta' : '')),
        mesa,
        aviso ? el('div', { class: 'sim-aviso ' + (aviso.bien ? 'bien' : 'mal'), role: 'status', 'aria-live': 'polite' }, aviso.texto) : el('p', { class: 'aviso' }, 'Decide: pedir, plantarte, doblar o dividir (teclas P, S, D, X).'),
        acciones, pie));
  }

  nuevaMano();
}

function mostrarResumenSimulador(e, pct, alTerminar) {
  const { fila } = naiFila(pct >= 80 ? 'celebrando' : 'feliz', pct === 100 ? '¡Ni una decisión fallada! Así se juega.' : pct >= 80 ? '¡Muy buena sesión! Casi todo según la estrategia básica.' : 'Buena práctica: los fallos de abajo son lo que más te enseña.', 'grande');
  const peor = e.errores.reduce((o, x) => ((o[x.correcta + ' con ' + x.tuMano] = (o[x.correcta + ' con ' + x.tuMano] || 0) + 1), o), {});
  pintar('adelante',
    el('main', { class: 'contenido centro' },
      el('h1', { class: 'resultado-titulo' }, 'Resumen del simulador'),
      fila,
      el('p', { class: 'resultado-dato' }, `Decisiones correctas: ${e.buenas} de ${e.decisiones} (${pct} %)`),
      e.pregC ? el('p', { class: 'resultado-dato' }, `Cuenta Hi-Lo: ${e.buenasC} de ${e.pregC}`) : null,
      el('p', { class: 'resultado-dato' }, `Fichas: ${e.neto >= 0 ? '+' : '−'}${Math.abs(e.neto)} (${e.saldo} al final)`),
      e.errores.length
        ? el('section', { class: 'sim-fallos' }, el('h2', {}, 'Para repasar'),
            el('ul', {}, e.errores.slice(0, 6).map((x) => el('li', {}, `Mano ${x.mano}: ${x.tuMano} contra ${simRango(x.crupier) === 'A' ? 'As' : simValor(x.crupier)}. Hiciste ${x.tuya.toLowerCase()} y tocaba ${x.correcta.toLowerCase()}.`))))
        : null),
    el('div', { class: 'pie' }, el('button', { class: 'boton', type: 'button', onclick: alTerminar }, 'Continuar')));
}
