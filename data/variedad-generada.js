// Un ejercicio más de variedad en cada nivel normal (150 en total): clasificar, deslizador o relámpago.
// Se generan con una semilla fija (el id del nivel), así que siempre salen los mismos y la repetición espaciada puede seguirles la pista.
// `chequeo` solo lo usa tests/validar.js, que recalcula cada respuesta con reglas independientes.
//
// relampago: { opciones, items: [[texto, opciónCorrecta, etiqueta], ...], segundos } -> decisiones rápidas con cuenta atrás.
(function () {
  const semilla = (t) => { let h = 1779033703; for (const c of t) h = Math.imul(h ^ c.charCodeAt(0), 3432918353) << 13 | h >>> 19; return () => { h = Math.imul(h ^ h >>> 16, 2246822507); h = Math.imul(h ^ h >>> 13, 3266489909); return ((h ^= h >>> 16) >>> 0) / 4294967296; }; };
  const GEN = (r) => ({
    ent: (a, b) => a + Math.floor(r() * (b - a + 1)),
    uno: (l) => l[Math.floor(r() * l.length)],
    mezclar: (l) => { const a = l.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; },
  });
  const PALOS = ['♠', '♥', '♦', '♣'];
  const RANGOS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
  const VAL = { 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7, 8: 8, 9: 9, 10: 10, J: 11, Q: 12, K: 13, A: 14 };
  const signo = (n) => (n > 0 ? '+' + n : n < 0 ? '−' + Math.abs(n) : '0');

  // Categoría de cinco cartas (para fabricar manos de la categoría que se pide)
  function categoria(cartas) {
    const v = cartas.map((c) => VAL[c.slice(0, -1)]).sort((a, b) => a - b);
    const color = new Set(cartas.map((c) => c.slice(-1))).size === 1;
    const u = [...new Set(v)];
    const esc = u.length === 5 && (v[4] - v[0] === 4 || (v[4] === 14 && v[3] === 5));
    const cu = Object.values(v.reduce((m, x) => ((m[x] = (m[x] || 0) + 1), m), {})).sort((a, b) => b - a).join('');
    if (esc && color) return 'Escalera de color';
    if (cu === '41') return 'Póker';
    if (cu === '32') return 'Full';
    if (color) return 'Color';
    if (esc) return 'Escalera';
    if (cu === '311') return 'Trío';
    if (cu === '221') return 'Doble pareja';
    if (cu === '2111') return 'Pareja';
    return 'Carta alta';
  }
  function manoDe(g, cat, ejecta = []) {
    for (let k = 0; k < 4000; k++) {
      const mazo = g.mezclar(RANGOS.flatMap((r) => PALOS.map((p) => r + p)));
      let cartas;
      if (cat === 'Pareja') { const r = g.uno(RANGOS); cartas = [...g.mezclar(PALOS).slice(0, 2).map((p) => r + p), ...mazo.filter((c) => !c.startsWith(r) || c.length !== r.length + 1).slice(0, 3)]; }
      else if (cat === 'Doble pareja') { const [a, b] = g.mezclar(RANGOS); cartas = [...g.mezclar(PALOS).slice(0, 2).map((p) => a + p), ...g.mezclar(PALOS).slice(0, 2).map((p) => b + p), mazo.find((c) => c.slice(0, -1) !== a && c.slice(0, -1) !== b)]; }
      else if (cat === 'Trío') { const r = g.uno(RANGOS); cartas = [...g.mezclar(PALOS).slice(0, 3).map((p) => r + p), ...mazo.filter((c) => c.slice(0, -1) !== r).slice(0, 2)]; }
      else if (cat === 'Escalera') { const base = g.ent(0, 8); cartas = [0, 1, 2, 3, 4].map((i) => RANGOS[base + i] + g.uno(PALOS)); }
      else if (cat === 'Color') { const p = g.uno(PALOS); cartas = g.mezclar(RANGOS).slice(0, 5).map((r) => r + p); }
      else if (cat === 'Full') { const [a, b] = g.mezclar(RANGOS); cartas = [...g.mezclar(PALOS).slice(0, 3).map((p) => a + p), ...g.mezclar(PALOS).slice(0, 2).map((p) => b + p)]; }
      else cartas = mazo.slice(0, 5);
      if (cartas.length === 5 && new Set(cartas).size === 5 && categoria(cartas) === cat && !ejecta.includes(cartas.join(' '))) return g.mezclar(cartas);
    }
    throw new Error('no se pudo fabricar la mano ' + cat);
  }

  const HILO = ['+1', '0', '−1'];
  const MUS3 = ['Vale 10', 'Vale 1', 'Vale su número'];
  const catMus = { Rey: 0, Caballo: 0, Sota: 0, 3: 0, As: 1, 2: 1, 4: 2, 5: 2, 6: 2, 7: 2 };
  const CL = (id, pregunta, categorias, elementos, explicacion, chequeo) => ({ tipo: 'clasificar', id, pregunta, categorias, elementos, explicacion, chequeo });
  const DE = (id, pregunta, min, max, respuesta, tolerancia, unidad, explicacion, chequeo) => ({ tipo: 'deslizador', id, pregunta, min, max, paso: 1, respuesta, tolerancia, unidad, explicacion, chequeo });
  const RL = (id, pregunta, opciones, items, explicacion, chequeo, segundos = 8) => ({ tipo: 'relampago', id, pregunta, opciones, items, segundos, explicacion, chequeo });

  // ---------- generadores por juego ----------
  const hiloCarta = (r) => (['2', '3', '4', '5', '6'].includes(r) ? 0 : ['7', '8', '9'].includes(r) ? 1 : 2);
  const G = {
    bjHilo(id, g) {
      for (;;) {
        const rangos = g.mezclar(RANGOS).slice(0, 6);
        if (new Set(rangos.map(hiloCarta)).size < 3) continue;
        const el = rangos.map((r) => [r + g.uno(PALOS), hiloCarta(r)]);
        return CL(id, 'Lleva cada carta al cajón de lo que suma en el Hi-Lo.', HILO, el, 'Del 2 al 6 suman +1, del 7 al 9 valen 0 y del 10 al As restan 1.', { hilo: true });
      }
    },
    bjRelampago(id, g) {
      const ranksDe = (v) => (v === 10 ? g.uno(['10', 'J', 'Q', 'K']) : String(v));
      const items = [], manos = [];
      while (items.length < 5) {
        const a = g.ent(2, 10), b = g.ent(2, 10), t = a + b, cru = g.ent(2, 10);
        if (a === b || (t >= 9 && t <= 11) || t === 20 || manos.some((m) => m.join('+') === `${a}${b}${cru}`)) continue;
        const pedir = t <= 8 || (t >= 13 && t <= 16 && cru >= 7) || (t === 12 && (cru <= 3 || cru >= 7));
        const ra = ranksDe(a), rb = ranksDe(b);
        if (ra === rb) continue;
        items.push([`${ra}${g.uno(PALOS)} ${rb}${g.uno(PALOS)}`, pedir ? 0 : 1, `Crupier: ${cru}`]);
        manos.push([ra, rb, String(cru)]);
      }
      return RL(id, 'Relámpago: ¿pides o te plantas? Decide antes de que se acabe el tiempo.', ['Pedir', 'Plantarte'], items,
        'Sin ases ni parejas: con 8 o menos pides; con 13 a 16 te plantas si el crupier enseña 2 a 6 y pides si enseña 7 o más; con 12 te plantas solo contra 4 a 6; con 17 o más te plantas.', { bjRel: manos });
    },
    bjCuenta(id, g) {
      const m = g.ent(2, 6), k = g.ent(-4, 5), c = k * m;
      return DE(id, `La cuenta corriente es ${signo(c)} y quedan ${m} mazos. Mueve el control hasta la cuenta verdadera.`, -8, 8, k, 0, '', `Cuenta verdadera = cuenta corriente ÷ mazos que quedan: ${signo(c)} ÷ ${m} = ${signo(k)}.`, { cuentaVerdadera: [c, m] });
    },
    pkManos(id, g) {
      const cats = g.mezclar(['Pareja', 'Doble pareja', 'Trío', 'Escalera', 'Color', 'Full']).slice(0, 3);
      const manos = [];
      const elementos = [];
      for (let k = 0; k < 6; k++) { const m = manoDe(g, cats[k % 3], manos); manos.push(m.join(' ')); elementos.push([m.join(' '), k % 3]); }
      return CL(id, 'Lleva cada mano de cinco cartas a su cajón.', cats, g.mezclar(elementos), 'Primero mira el palo (color), después si los valores son seguidos (escalera) y por último las cartas repetidas.', { pk: true });
    },
    pkOuts(id, g) {
      const n = g.ent(2, 12), flop = g.uno([true, false]);
      return DE(id, flop ? `Tienes ${n} outs en el flop. ¿Qué probabilidad aproximada tienes de completar tu mano?` : `Tienes ${n} outs en el turn. ¿Qué probabilidad aproximada tienes de acertar en el river?`,
        0, 100, flop ? n * 4 : n * 2, flop ? 3 : 2, ' %', flop ? `Regla del 4 en el flop: ${n} outs × 4 = ${n * 4} %.` : `Regla del 2 en el turn: ${n} outs × 2 = ${n * 2} %.`, { outs: { n, fase: flop ? 'flop' : 'turn' } });
    },
    pkPotOdds(id, g) {
      const items = [], datos = [];
      while (items.length < 5) {
        const b = g.uno([40, 60, 80, 100, 120]), p = g.uno([10, 20, 30, 40]), eq = g.ent(8, 60), req = (100 * p) / (b + p);
        if (Math.abs(eq - req) < 4) continue;
        items.push([`Tu probabilidad: ${eq} %`, eq > req ? 0 : 1, `Bote ${b} · Te piden ${p}`]);
        datos.push([b, p, eq]);
      }
      return RL(id, 'Relámpago: ¿compensa pagar? Compara tu probabilidad con lo que cuesta ver la carta.', ['Pagar', 'Tirar'], items,
        'Compensa pagar cuando tu probabilidad de ganar supera lo que pones: pagar ÷ (bote + pagar).', { potOddsSi: datos }, 10);
    },
    msValores(id, g) {
      for (;;) {
        const rs = g.mezclar(Object.keys(catMus)).slice(0, 6);
        if (new Set(rs.map((r) => catMus[r])).size < 3) continue;
        return CL(id, 'Lleva cada carta al cajón de lo que vale en el mus.', MUS3, rs.map((r) => [r, catMus[r]]), 'Rey, Caballo, Sota y 3 valen 10; el As y el 2 valen 1; las demás valen su número.', { valMus: true });
      }
    },
    msPuntos(id, g) {
      const rs = Array.from({ length: 4 }, () => g.uno(Object.keys(catMus)));
      const v = (r) => (catMus[r] === 0 ? 10 : catMus[r] === 1 ? 1 : Number(r));
      const total = rs.reduce((a, r) => a + v(r), 0);
      return DE(id, `Tu mano es ${rs.slice(0, -1).join(', ')} y ${rs[3]}. ¿Cuántos puntos tienes?`, 4, 40, total, 0, '', `Suma de valores: ${rs.map((r) => `${r} (${v(r)})`).join(' + ')} = ${total}.`, { mus: rs });
    },
    msJuego(id, g) {
      const v = (r) => (catMus[r] === 0 ? 10 : catMus[r] === 1 ? 1 : Number(r));
      const items = [], manos = [];
      while (items.length < 5) {
        const rs = Array.from({ length: 4 }, () => g.uno(Object.keys(catMus)));
        const t = rs.reduce((a, r) => a + v(r), 0);
        if (t === 30 || t === 31 || manos.some((m) => m.join() === rs.join())) continue;
        items.push([rs.join(' · '), t > 31 ? 0 : 1, '']);
        manos.push(rs);
      }
      // se quitan las pistas de la etiqueta que no aporten
      items.forEach((it) => (it[2] = '¿Hay juego? (31 o más)'));
      return RL(id, 'Relámpago: ¿tienes juego? Suma rápido los puntos de la mano.', ['Hay juego', 'No hay juego'], items, 'En el mus hay juego con 31 puntos o más (Rey, Caballo, Sota y 3 valen 10; el As y el 2, 1).', { musJuego: manos }, 9);
    },
    baJugador(id, g) {
      for (;;) {
        const ts = g.mezclar([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, 6);
        const c = (t) => (t >= 8 ? 2 : t >= 6 ? 1 : 0);
        if (new Set(ts.map(c)).size < 3) continue;
        return CL(id, 'Regla del Jugador: lleva cada total al cajón de lo que hace.', ['Pide carta', 'Se planta', 'Natural'], ts.map((t) => ['Total ' + t, c(t)]), 'Con 0 a 5 el Jugador pide, con 6 o 7 se planta y con 8 o 9 es un natural.', { bacJugador: ts });
      }
    },
    baNatural(id, g) {
      const val = (r) => (['10', 'J', 'Q', 'K'].includes(r) ? 0 : r === 'A' ? 1 : Number(r));
      const items = [], manos = [];
      while (items.length < 5) {
        const a = g.uno(RANGOS), b = g.uno(RANGOS), t = (val(a) + val(b)) % 10;
        if (manos.some((m) => m.join() === a + ',' + b)) continue;
        items.push([`${a}${g.uno(PALOS)} ${b}${g.uno(PALOS)}`, t >= 8 ? 0 : 1, '']);
        manos.push([a, b]);
      }
      return RL(id, 'Relámpago: ¿es un natural? Suma las dos cartas (solo cuenta la cifra de las unidades).', ['Natural', 'No natural'], items, 'Un natural es un total de 8 o 9 con las dos primeras cartas. El 10 y las figuras valen 0 y el As vale 1.', { bacNatural: manos }, 8);
    },
    baTotal(id, g) {
      const val = (r) => (['10', 'J', 'Q', 'K'].includes(r) ? 0 : r === 'A' ? 1 : Number(r));
      const n = g.uno([2, 3]);
      const rs = Array.from({ length: n }, () => g.uno(RANGOS));
      const total = rs.reduce((a, r) => a + val(r), 0) % 10;
      return DE(id, `Tienes ${rs.slice(0, -1).join(', ')} y ${rs[n - 1]}. ¿Cuánto vale el total en el bacarrá?`, 0, 9, total, 0, '', `Suma de valores (el 10 y las figuras valen 0, el As vale 1) = ${rs.reduce((a, r) => a + val(r), 0)}; solo cuenta la cifra de las unidades: ${total}.`, { bacTotal: rs });
    },
    vpPaga(id, g) {
      const paga = ['Pareja de J o mejor', 'Doble pareja', 'Trío', 'Escalera', 'Color', 'Full'];
      const usadas = [];
      const elementos = [];
      const mano = (cat, alta) => {
        for (let k = 0; k < 500; k++) {
          const m = manoDe(g, cat, usadas);
          if (cat === 'Pareja') {
            const par = Object.entries(m.reduce((o, c) => ((o[c.slice(0, -1)] = (o[c.slice(0, -1)] || 0) + 1), o), {})).find(([, n]) => n === 2)[0];
            if ((VAL[par] >= 11) !== alta) continue;
          }
          usadas.push(m.join(' '));
          return m.join(' ');
        }
        throw new Error('mano de vídeo póker');
      };
      const tipos = g.mezclar(['Trío', 'Doble pareja', 'Color', 'Escalera', 'Full']).slice(0, 2);
      elementos.push([mano('Pareja', true), 0], [mano(tipos[0], true), 0], [mano(tipos[1], true), 0]);
      elementos.push([mano('Pareja', false), 1], [mano('Carta alta', false), 1], [mano(g.uno(['Pareja', 'Carta alta']), false), 1]);
      return CL(id, 'Lleva cada mano a su cajón: ¿paga en Jacks or Better o no?', ['Paga', 'No paga'], g.mezclar(elementos), 'Paga la pareja de J o mejor y cualquier jugada superior. Una pareja de 10 o menos y la carta alta no pagan.', { vpPaga: true });
    },
    vpRelampago(id, g) {
      const items = [];
      const usadas = [];
      const puntos = [['Pareja', true, 0], ['Pareja', false, 1], ['Carta alta', false, 1], ['Doble pareja', true, 0], ['Escalera', true, 0], ['Trío', true, 0]];
      for (const [cat, alta, k] of g.mezclar(puntos).slice(0, 5)) {
        for (let n = 0; n < 500; n++) {
          const m = manoDe(g, cat, usadas);
          if (cat === 'Pareja') { const par = Object.entries(m.reduce((o, c) => ((o[c.slice(0, -1)] = (o[c.slice(0, -1)] || 0) + 1), o), {})).find(([, x]) => x === 2)[0]; if ((VAL[par] >= 11) !== alta) continue; }
          usadas.push(m.join(' '));
          items.push([m.join(' '), k, '']);
          break;
        }
      }
      return RL(id, 'Relámpago: ¿esta mano paga en Jacks or Better?', ['Paga', 'No paga'], items, 'Paga la pareja de J o mejor y cualquier jugada superior. Una pareja de 10 o menos y la carta alta no pagan.', { vpPagaRel: true }, 9);
    },
  };
  const ROTACION = {
    blackjack: ['bjHilo', 'bjRelampago', 'bjCuenta'],
    poker: ['pkManos', 'pkOuts', 'pkPotOdds'],
    mus: ['msValores', 'msPuntos', 'msJuego'],
    baccarat: ['baJugador', 'baNatural', 'baTotal'],
    videopoker: ['vpPaga', 'vpRelampago'],
  };
  for (const curso of CURSOS) {
    const rot = ROTACION[curso.id];
    if (!rot) continue;
    curso.unidades.flatMap((u) => u.lecciones).forEach((l, i) => {
      const nombre = rot[i % rot.length];
      let ej, intento = 0;
      do { ej = G[nombre](l.id + '-v1', GEN(semilla(l.id + nombre + (intento || '')))); intento++; }
      while (ej.tipo === 'relampago' && ej.opciones.some((_, k) => !ej.items.some((x) => x[1] === k)) && intento < 200);
      l.ejercicios.splice(Math.ceil(l.ejercicios.length / 2), 0, ej);
    });
  }
})();
