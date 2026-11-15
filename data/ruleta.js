// RULETA EUROPEA (un solo cero): apuestas, pagos, probabilidades y ventaja de la casa.
// Los ejercicios con números se generan con código (semilla fija por nivel) y tests/validar.js los recalcula
// con código independiente. El campo "chequeo" solo lo usa el validador; la app lo ignora.
// Necesita data/generadores.js (GEN).

const RULETA = (function () {
  const { pick, barajar, construir } = GEN;
  const coma = (x, d = 1) => x.toFixed(d).replace('.', ',');

  // nombre, casillas que cubre, pago «N a 1»
  const APUESTAS = [
    { n: 'Pleno', cubre: 1, pago: 35, txt: 'a un solo número' },
    { n: 'Caballo', cubre: 2, pago: 17, txt: 'a dos números vecinos' },
    { n: 'Calle', cubre: 3, pago: 11, txt: 'a una fila de tres números' },
    { n: 'Cuadro', cubre: 4, pago: 8, txt: 'a cuatro números en cuadrado' },
    { n: 'Línea', cubre: 6, pago: 5, txt: 'a dos filas seguidas (seis números)' },
    { n: 'Docena', cubre: 12, pago: 2, txt: 'a una docena (1–12, 13–24 o 25–36)' },
    { n: 'Columna', cubre: 12, pago: 2, txt: 'a una columna de doce números' },
    { n: 'Rojo', cubre: 18, pago: 1, txt: 'a rojo' },
    { n: 'Par', cubre: 18, pago: 1, txt: 'a par' },
    { n: 'Falta (1–18)', cubre: 18, pago: 1, txt: 'a falta (1–18)' },
  ];
  const DISTINTAS = [APUESTAS[0], APUESTAS[1], APUESTAS[2], APUESTAS[3], APUESTAS[4], APUESTAS[5], APUESTAS[7]]; // un pago distinto cada una
  const ROJOS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
  const euros = (x) => `${x} €`;

  const T = {
    rlCubre(r) {
      const a = pick(r, APUESTAS), ops = barajar(r, [...new Set([a.cubre, 1, 2, 3, 4, 6, 12, 18].filter((x) => x !== a.cubre))]).slice(0, 3).concat(a.cubre);
      const o = barajar(r, ops);
      return { tipo: 'opcion_unica', pregunta: `¿Cuántos números cubre una apuesta ${a.txt}?`, opciones: o.map(String), correcta: o.indexOf(a.cubre), explicacion: `${a.n}: cubre ${a.cubre} ${a.cubre === 1 ? 'número' : 'números'} y paga ${a.pago} a 1. Cuantos más números cubres, menos paga.`, chequeo: { k: 'rlCubre', pago: a.pago, cubre: a.cubre, opciones: o.slice() } };
    },
    rlPagoGana(r) {
      const a = pick(r, DISTINTAS), m = pick(r, [2, 5, 10, 20]);
      return { tipo: 'numero', pregunta: `Apuestas ${euros(m)} ${a.txt} y sale uno de tus números. ¿Cuántos euros ganas, sin contar tu apuesta?`, unidad: '€', respuesta: a.pago * m, explicacion: `${a.n} paga ${a.pago} a 1: ${a.pago} × ${m} = ${a.pago * m} €. Además te devuelven tu apuesta.`, chequeo: { k: 'rlPago', pago: a.pago, m, total: false } };
    },
    rlPagoTotal(r) {
      const a = pick(r, DISTINTAS), m = pick(r, [1, 2, 5, 10]);
      return { tipo: 'numero', pregunta: `Apuestas ${euros(m)} ${a.txt} y ganas. ¿Cuántos euros recibes en total, contando tu apuesta?`, unidad: '€', respuesta: (a.pago + 1) * m, explicacion: `Ganas ${a.pago} × ${m} = ${a.pago * m} € y te devuelven los ${m} € apostados: ${(a.pago + 1) * m} €.`, chequeo: { k: 'rlPago', pago: a.pago, m, total: true } };
    },
    rlProb(r) {
      const a = pick(r, APUESTAS.filter((x) => x.cubre <= 12 || x.n === 'Rojo'));
      const otras = barajar(r, [...new Set(APUESTAS.map((x) => x.cubre))].filter((c) => c !== a.cubre)).slice(0, 3);
      const cs = barajar(r, otras.concat(a.cubre));
      const pct = (c) => coma((100 * c) / 37) + ' %';
      return { tipo: 'opcion_unica', pregunta: `¿Qué probabilidad tienes de ganar en una tirada con una apuesta ${a.txt}?`, opciones: cs.map(pct), correcta: cs.indexOf(a.cubre), explicacion: `Hay 37 casillas (0 al 36) y tu apuesta cubre ${a.cubre}: ${a.cubre}/37 ≈ ${pct(a.cubre)}. El cero verde pierde casi todas las apuestas.`, chequeo: { k: 'rlProb', cubre: a.cubre, opciones: cs.slice() } };
    },
    rlColor(r) {
      const n = pick(r, [...Array(36).keys()].map((i) => i + 1)), c = ROJOS.includes(n) ? 'Rojo' : 'Negro';
      return { tipo: 'opcion_unica', pregunta: `Sale el ${n}. ¿De qué color es?`, opciones: ['Rojo', 'Negro', 'Verde'], correcta: ['Rojo', 'Negro', 'Verde'].indexOf(c), explicacion: `El ${n} es ${c.toLowerCase()}. Hay 18 rojos, 18 negros y el 0 verde.`, chequeo: { k: 'rlColor', n, color: c } };
    },
    rlOrd(r) {
      const as = barajar(r, DISTINTAS).slice(0, 4).sort((x, y) => x.pago - y.pago);
      return { tipo: 'ordenar', pregunta: 'Ordena estas apuestas de la que menos paga a la que más.', elementos: as.map((x) => x.n), explicacion: as.map((x) => `${x.n} paga ${x.pago} a 1`).join('; ') + '.', chequeo: { k: 'rlOrd' } };
    },
    rlEm(r) {
      const as = barajar(r, DISTINTAS).slice(0, 4);
      return { tipo: 'emparejar', pregunta: 'Une cada apuesta con lo que paga.', pares: as.map((x) => [x.n, `${x.pago} a 1`]), explicacion: 'Pleno 35 a 1, caballo 17, calle 11, cuadro 8, línea 5, docena y columna 2, y las apuestas simples (rojo/negro, par/impar, falta/pasa) 1 a 1.', chequeo: { k: 'rlEm' } };
    },
    rlPerdida(r) {
      const m = pick(r, [1, 2, 5, 10]);
      return { tipo: 'numero', pregunta: `Imagina que salen los 37 números una vez cada uno y apuestas ${euros(m)} a pleno en cada tirada. ¿Cuántos euros pierdes en total?`, unidad: '€', respuesta: m, explicacion: `Apuestas 37 × ${m} = ${37 * m} € y solo cobras una vez: 36 × ${m} = ${36 * m} € (35 más tu apuesta). Pierdes ${m} €: es la ventaja de la casa, 1/37 ≈ 2,7 %.`, chequeo: { k: 'rlPerdida', m } };
    },
    rlEsperada(r) {
      const m = pick(r, [370, 740, 1110, 1850, 3700]);
      return { tipo: 'numero', pregunta: `Con la ruleta europea la casa gana de media 1/37 de lo apostado. Si a lo largo de la noche apuestas ${m} € en total, ¿cuánto pierdes de media?`, unidad: '€', respuesta: m / 37, explicacion: `${m} ÷ 37 = ${m / 37} €. Da igual a qué apuestes: la ventaja de la casa es 2,7 % en todas las apuestas de la ruleta europea.`, chequeo: { k: 'rlEsperada', m } };
    },
    rlCuantas(r) {
      const a = pick(r, [APUESTAS[0], APUESTAS[1], APUESTAS[3], APUESTAS[4]]), fichas = pick(r, [2, 3, 5]);
      return { tipo: 'numero', pregunta: `Pones ${fichas} apuestas de 1 € cada una, todas ${a.txt}, en casillas distintas. ¿Cuántos números cubres entre todas?`, unidad: 'números', respuesta: a.cubre * fichas, explicacion: `${fichas} × ${a.cubre} = ${a.cubre * fichas} números cubiertos de 37: cuantos más cubres, más a menudo ganas pero menos cobras.`, chequeo: { k: 'rlCuantas', cubre: a.cubre, fichas } };
    },
  };

  const def = { k: 'def' };
  const op = (id, pregunta, opciones, correcta, explicacion) => ({ id, tipo: 'opcion_unica', pregunta, opciones, correcta, explicacion, chequeo: def });

  const UNIDADES = [
    { id: 'ru-u1', titulo: 'La mesa', descripcion: 'La rueda, el tapete y las apuestas', lecciones: [
      ['ru-1-1', '🎡', 'La rueda y el tapete', 10, 'La ruleta europea tiene 37 casillas: los números del 1 al 36 (18 rojos y 18 negros) y el 0 verde. Se lanza una bola contra el giro de la rueda y gana el número donde cae. Los números del tapete se agrupan en tres docenas y tres columnas.',
        [['¿Cuántas casillas tiene la ruleta europea?', ['37', '36', '38', '40'], 0, 'Del 0 al 36: 37 casillas. La ruleta americana añade un doble cero y tiene 38.'],
         ['¿De qué color es el cero?', ['Verde', 'Rojo', 'Negro', 'Depende de la rueda'], 0, 'El 0 es verde y no cuenta como rojo ni negro: ahí está la ventaja del casino.']], 'rlColor rlEm rlCuantas'],
      ['ru-1-2', '💶', 'Apuestas y pagos', 10, 'Cuanto menos cubre una apuesta, más paga. Pleno (un número) 35 a 1, caballo 17, calle 11, cuadro 8, línea 5, docena y columna 2, y las apuestas simples (rojo/negro, par/impar, falta/pasa) 1 a 1.',
        [['¿Qué apuesta paga más?', ['El pleno (35 a 1)', 'La docena (2 a 1)', 'Rojo (1 a 1)', 'La columna (2 a 1)'], 0, 'El pleno acierta solo con un número y paga 35 a 1.']], 'rlEm rlOrd rlPagoGana'],
      ['ru-1-3', '🔢', 'Cuántos números cubre cada apuesta', 10, 'Cada apuesta cubre un número distinto de casillas: pleno 1, caballo 2, calle 3, cuadro 4, línea 6, docena y columna 12, y las simples 18. Fíjate: cubrir más números siempre significa cobrar menos.',
        [['¿Cuántos números cubre una docena?', ['12', '3', '18', '6'], 0, 'Una docena son doce números seguidos: 1–12, 13–24 o 25–36.']], 'rlCubre rlCubre rlCuantas rlEm'],
    ] },
    { id: 'ru-u2', titulo: 'Números y dinero', descripcion: 'Probabilidades, cobros y ventaja de la casa', lecciones: [
      ['ru-2-1', '🎯', 'Probabilidad de ganar', 15, 'La probabilidad es los números que cubres entre 37. Un pleno tiene 1/37 ≈ 2,7 %; una docena 12/37 ≈ 32,4 %; rojo 18/37 ≈ 48,6 %. Nunca llegas al 50 %, ni siquiera con rojo o negro, porque el 0 siempre te quita.',
        [['¿Cuál es la probabilidad de ganar con rojo?', ['≈ 48,6 %', '50 %', '≈ 51,4 %', '≈ 37 %'], 0, '18 de 37 casillas: 48,6 %. Si no existiese el 0 sería justo 50 %.']], 'rlProb rlProb rlCuantas rlOrd'],
      ['ru-2-2', '🪙', 'Cuánto cobras', 15, 'Si ganas, cobras el pago por tu apuesta y te devuelven la apuesta. Un pleno de 5 € gana 35 × 5 = 175 € y recibes 180 € en total. Si pierdes, pierdes lo apostado. Cuidado con confundir «ganancia» con «dinero que recibes».',
        [['Apuestas 10 € a rojo y ganas. ¿Cuánto recibes en total?', ['20 €', '10 €', '35 €', '18 €'], 0, 'Rojo paga 1 a 1: ganas 10 € y te devuelven los 10 € de la apuesta: 20 €.']], 'rlPagoGana rlPagoTotal rlOrd rlPagoGana'],
      ['ru-2-3', '📉', 'Ventaja de la casa', 20, 'Con 37 casillas pero un pago pensado para 36, la casa se queda de media 1/37 ≈ 2,7 % de todo lo apostado, sea cual sea la apuesta. Es poco por tirada, pero a la larga siempre gana: cuanto más juegas, más se acerca tu resultado a esa pérdida.',
        [['¿Qué apuesta tiene mejor ventaja para el jugador en la ruleta europea?', ['Todas tienen la misma (2,7 %)', 'El pleno', 'Rojo o negro', 'La docena'], 0, 'En la ruleta europea toda apuesta tiene la misma ventaja de la casa: 1/37 ≈ 2,7 %.']], 'rlPerdida rlEsperada rlEm rlPerdida'],
    ] },
    { id: 'ru-u3', titulo: 'Cabeza fría', descripcion: 'Mitos, rachas y juego responsable', lecciones: [
      ['ru-3-1', '🧠', 'Mitos de la ruleta', 15, 'La rueda no tiene memoria. Que haya salido rojo siete veces seguidas no hace más probable el negro (la falacia del jugador). Tampoco existen «números calientes» ni sistemas que cambien la ventaja de la casa: solo cambian cuánto y con qué ritmo pierdes.',
        [['Ha salido rojo siete veces seguidas. ¿Qué es más probable en la siguiente tirada?', ['Lo mismo de siempre: rojo 48,6 %, negro 48,6 %', 'Negro, que ya toca', 'Rojo, que está de racha', 'El cero'], 0, 'Cada tirada es independiente: la rueda no recuerda las anteriores.'],
         ['Un sistema promete ganar siempre duplicando la apuesta tras cada pérdida (martingala). ¿Qué problema tiene?', ['Un par de pérdidas seguidas exigen apuestas enormes o topes de mesa', 'Es ilegal', 'Solo funciona en ruleta americana', 'Ninguno'], 0, 'La martingala no cambia la ventaja de la casa: una racha mala puede costarte todo tu dinero o chocar con el límite de apuesta.']], 'rlProb rlOrd rlEsperada'],
      ['ru-3-2', '🧊', 'Presupuesto y límites', 15, 'Aunque entiendas las probabilidades, la ruleta sale cara. Decide antes cuánto dinero de ocio gastas, apuesta una parte pequeña en cada tirada y deja de jugar al llegar al límite: ni «una más» ni recuperar. Es un gasto de entretenimiento, no una forma de ganar dinero.',
        [['Has perdido el presupuesto que fijaste. ¿Qué haces?', ['Paro y lo dejo para otro día', 'Apuesto más para recuperarlo', 'Pido dinero prestado', 'Cambio de mesa'], 0, 'Perseguir pérdidas es la forma más rápida de perder más. Parar es la decisión correcta.']], 'rlEsperada rlEm rlPagoTotal'],
    ] },
  ];

  function curso() {
    return {
      id: 'ruleta', nombre: 'Ruleta', icono: '🎡', color: '#0f8a5f',
      descripcion: 'La ruleta europea: apuestas, pagos y por qué la casa siempre gana',
      reglas: 'Ruleta europea de 37 casillas (0–36). Cada apuesta cubre unos números y paga según cuántos cubra; el cero verde da a la casa un 2,7 % de ventaja.',
      unidades: UNIDADES.map((u) => ({
        id: u.id, titulo: u.titulo, descripcion: u.descripcion,
        lecciones: u.lecciones.map(([id, icono, titulo, xp, intro, fijos, receta]) => ({
          id, titulo, icono, xp, intro,
          ejercicios: fijos.map(([p, o, c, ex], i) => op(`${id}-e${i + 1}`, p, o, c, ex)).concat(construir(id, receta, T)),
        })),
      })),
    };
  }

  CURSOS.push(curso());
  return { T, APUESTAS };
})();
