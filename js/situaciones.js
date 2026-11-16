// Situaciones concretas de cada pregunta, para las estadísticas del tipo "fallas el 60 % de las jugadas con 12-16 contra 7+".
// No se etiqueta a mano: se deduce de los datos del ejercicio (mano y carta del crupier, o el tipo de comprobación).
//   situacionesDe(ejercicio)  -> lista de claves (['bj-12-16-f']), vacía si el ejercicio no tiene una situación clara
//   SITUACIONES[clave]        -> { nombre: 'jugadas con 12-16 contra 7+', corto: '12-16 contra 7+' }
const SITUACIONES = {
  'bj-par': { nombre: 'jugadas con pares (dividir o no)' },
  'bj-blando': { nombre: 'jugadas con manos blandas (con As)' },
  'bj-8': { nombre: 'jugadas con 8 o menos' },
  'bj-9-11': { nombre: 'jugadas con 9, 10 y 11 (doblar)' },
  'bj-12-16-d': { nombre: 'jugadas con 12-16 contra un crupier de 2 a 6' },
  'bj-12-16-f': { nombre: 'jugadas con 12-16 contra 7 o más' },
  'bj-17': { nombre: 'jugadas con 17 o más' },
  hilo: { nombre: 'preguntas de contar cartas con Hi-Lo' },
  cuentaVerdadera: { nombre: 'preguntas de cuenta verdadera' },
  pk: { nombre: 'preguntas de reconocer manos de póker' },
  potOdds: { nombre: 'preguntas de «¿compensa pagar?» (pot odds)' },
  outs: { nombre: 'preguntas de outs y probabilidades' },
  mus: { nombre: 'preguntas de contar puntos en el mus' },
  musJuego: { nombre: 'preguntas de «¿hay juego?» en el mus' },
  bacTotal: { nombre: 'preguntas de totales del bacarrá' },
  bacNatural: { nombre: 'preguntas de naturales del bacarrá' },
  bacJugador: { nombre: 'preguntas de la regla del Jugador en bacarrá' },
  vpPaga: { nombre: 'preguntas de qué manos pagan en vídeo póker' },
};
const KIND_A_SITUACION = {
  hilo: 'hilo', cuentaVerdadera: 'cuentaVerdadera', pk: 'pk', potOdds: 'potOdds', potOddsSi: 'potOdds', outs: 'outs', mus: 'mus', musJuego: 'musJuego',
  bacTotal: 'bacTotal', bacNatural: 'bacNatural', bacJugador: 'bacJugador', vpPaga: 'vpPaga', vpPagaRel: 'vpPaga',
};
function claveBlackjack(jugador, crupier) {
  const v = (c) => (c === 'A' ? 11 : 'KQJ'.includes(c) ? 10 : Number(c));
  if (!Array.isArray(jugador) || jugador.some((c) => !/^(10|[2-9AJQK])$/.test(String(c))) || !/^(10|[2-9AJQK])$/.test(String(crupier))) return null;
  if (jugador.length === 2 && v(jugador[0]) === v(jugador[1])) return 'bj-par';
  let t = jugador.reduce((s, c) => s + v(c), 0), ases = jugador.filter((c) => c === 'A').length;
  while (t > 21 && ases > 0) { t -= 10; ases--; }
  if (ases > 0) return 'bj-blando';
  if (t <= 8) return 'bj-8';
  if (t <= 11) return 'bj-9-11';
  if (t <= 16) return v(crupier) <= 6 ? 'bj-12-16-d' : 'bj-12-16-f';
  return 'bj-17';
}
// Lista de claves de un ejercicio. En el relámpago, una por cada situación (con `i` se pide solo la del elemento i).
function situacionesDe(e, i = null) {
  if (!e) return [];
  if (e.base) e = e.base; // formas nuevas: la situación es la del ejercicio original
  if (e.tipo === 'accion' && e.situacion && e.situacion.jugador) { const c = claveBlackjack(e.situacion.jugador, e.situacion.crupier); return c ? [c] : []; }
  const ch = e.chequeo || {};
  if (e.tipo === 'relampago') {
    if (ch.bjRel) { const L = ch.bjRel.map(([a, b, cru]) => claveBlackjack([a, b], cru)); return i === null ? [...new Set(L.filter(Boolean))] : L[i] ? [L[i]] : []; }
  }
  for (const k of Object.keys(ch)) if (KIND_A_SITUACION[k] && ch[k]) return [KIND_A_SITUACION[k]];
  return [];
}
