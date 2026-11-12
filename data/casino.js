// JUEGOS DE CASINO: Baccarat (Punto Banco) y Vídeo póker (Jacks or Better 9/6).
//
// Los ejercicios se generan con código (semilla fija por nivel) y la respuesta se calcula al construirlos.
// tests/validar.js los recalcula con código independiente (reglas de la tercera carta, enumeración
// exacta de probabilidades del bacarrá y valor esperado exacto de cada jugada de vídeo póker).
// El campo "chequeo" solo lo usa el validador; la app lo ignora.
// Necesita data/generadores.js (GEN) y data/videopoker-datos.js (VP_MANOS).

const CASINO = (function () {
  const { pick, barajar, construir } = GEN;
  const PALOS = ['♠', '♥', '♦', '♣'];
  const comaDec = (x, d = 2) => x.toFixed(d).replace('.', ',');

  // =====================================================================
  //  BACCARAT
  // =====================================================================
  const RANGOS_BAC = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  const MAZO_BAC = RANGOS_BAC.flatMap((r) => PALOS.map((p) => r + p));
  const rangoDe = (c) => c.slice(0, -1);
  const bv = (c) => { const r = rangoDe(c); return r === 'A' ? 1 : ['10', 'J', 'Q', 'K'].includes(r) ? 0 : Number(r); };
  const tot = (cs) => cs.reduce((s, c) => s + bv(c), 0) % 10;
  const jugadorPide = (t) => t <= 5;
  function bancaPide(t, v) { // v = valor de la tercera carta del Jugador, o null si se plantó
    if (v === null) return t <= 5;
    if (t <= 2) return true;
    if (t === 3) return v !== 8;
    if (t === 4) return v >= 2 && v <= 7;
    if (t === 5) return v >= 4 && v <= 7;
    if (t === 6) return v === 6 || v === 7;
    return false;
  }
  const REGLA_BANCA = {
    0: 'con 0, 1 o 2 la Banca siempre pide', 1: 'con 0, 1 o 2 la Banca siempre pide', 2: 'con 0, 1 o 2 la Banca siempre pide',
    3: 'con 3 pide salvo que la tercera carta del Jugador valga 8', 4: 'con 4 pide si la tercera carta del Jugador vale de 2 a 7',
    5: 'con 5 pide si la tercera carta del Jugador vale de 4 a 7', 6: 'con 6 pide solo si la tercera carta del Jugador vale 6 o 7', 7: 'con 7 la Banca se planta',
  };
  function jugarBac(p2, b2, zapato) {
    const p = p2.slice(), b = b2.slice(); let k = 0; const pasos = [];
    const tp = tot(p), tb = tot(b);
    pasos.push(`Jugador ${p2.join(' ')} = ${tp}; Banca ${b2.join(' ')} = ${tb}.`);
    if (tp >= 8 || tb >= 8) pasos.push('Hay un natural (8 o 9): nadie roba carta.');
    else {
      let v = null;
      if (jugadorPide(tp)) { const c = zapato[k++]; p.push(c); v = bv(c); pasos.push(`El Jugador (${tp}) pide y recibe ${c}: ahora suma ${tot(p)}.`); }
      else pasos.push(`El Jugador (${tp}) se planta.`);
      const pideB = bancaPide(tb, v);
      if (pideB) { const c = zapato[k++]; b.push(c); pasos.push(`La Banca (${tb}) pide (${v === null ? 'como el Jugador se plantó, pide con 0–5' : REGLA_BANCA[tb]}) y recibe ${c}: suma ${tot(b)}.`); }
      else pasos.push(v === null ? `La Banca (${tb}) se planta: como el Jugador se plantó, la Banca pide con 0–5 y se planta con 6 o 7.` : `La Banca (${tb}) se planta (${REGLA_BANCA[tb]}).`);
    }
    const fp = tot(p), fb = tot(b);
    const ganador = fp > fb ? 'Jugador' : fb > fp ? 'Banca' : 'Empate';
    pasos.push(`Final: Jugador ${fp}, Banca ${fb}.`);
    return { ganador, pasos, p, b, usadas: k };
  }
  const filasBac = (...f) => ({ filas: f.map(([etiqueta, cartas]) => ({ etiqueta, cartas })) });
  const SI_NO_BAC = ['Pide carta', 'Se planta'];

  const BAC = {
    val(r) {
      for (;;) {
        const cs = barajar(r, MAZO_BAC).slice(0, 6);
        const idx = cs.map((c, i) => (bv(c) === 0 ? i : -1)).filter((i) => i >= 0);
        if (idx.length < 1 || idx.length > 4) continue;
        return { tipo: 'seleccionar', pregunta: 'Toca las cartas que valen 0 en el bacarrá.', cartas: cs, correctas: idx, explicacion: 'Valen 0 el 10, la J, la Q y la K. El As vale 1 y las demás cartas valen su número.', chequeo: { k: 'bacVal' } };
      }
    },
    tot(r) {
      const n = r() < 0.5 ? 2 : 3;
      const cs = barajar(r, MAZO_BAC).slice(0, n);
      const s = cs.map(bv);
      return { tipo: 'numero', pregunta: '¿Cuánto vale esta mano en el bacarrá? (solo cuenta la última cifra de la suma)', situacion: filasBac(['Tu mano', cs]), respuesta: tot(cs), explicacion: `${cs.map((c, i) => `${c} (${s[i]})`).join(' + ')} = ${s.reduce((a, b) => a + b, 0)}, y solo cuenta la cifra de las unidades: ${tot(cs)}.`, chequeo: { k: 'bacTotal', cartas: cs } };
    },
    ordT(r) {
      for (;;) {
        const totales = barajar(r, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, 4).sort((a, b) => b - a);
        const usadas = new Set(), manos = [];
        let ok = true;
        for (const t of totales) {
          const cand = barajar(r, MAZO_BAC);
          let hecha = null;
          for (const a of cand) for (const b of cand) {
            if (a === b || usadas.has(a) || usadas.has(b) || tot([a, b]) !== t) continue;
            hecha = [a, b]; break;
          }
          if (!hecha) { ok = false; break; }
          hecha.forEach((c) => usadas.add(c));
          manos.push(hecha);
        }
        if (!ok) continue;
        return { tipo: 'ordenar', pregunta: 'Ordena estas manos de bacarrá, de la que más vale a la que menos.', elementos: manos.map((m) => m.join(' ')), explicacion: manos.map((m, i) => `${m.join(' ')} = ${totales[i]}`).join('; ') + '. Gana la que más se acerca a 9.', chequeo: { k: 'bacOrden', manos } };
      }
    },
    emV(r) {
      const valores = barajar(r, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, 4);
      const pares = valores.map((v) => { const c = pick(r, MAZO_BAC.filter((x) => bv(x) === v)); return [c, String(v)]; });
      return { tipo: 'emparejar', pregunta: 'Une cada carta con lo que vale en el bacarrá.', pares, explicacion: 'As = 1, del 2 al 9 su número, y 10, J, Q y K valen 0.', chequeo: { k: 'bacVals' } };
    },
    nat(r) {
      for (;;) {
        const cs = barajar(r, MAZO_BAC).slice(0, 2);
        const t = tot(cs), esNat = t >= 8;
        if (!esNat && r() < 0.4) continue;
        return { tipo: 'opcion_unica', pregunta: 'Con estas dos primeras cartas, ¿qué ocurre?', situacion: filasBac(['Jugador', cs]), opciones: ['Natural: la mano termina', 'No es natural: se siguen las reglas de tercera carta'], correcta: esNat ? 0 : 1, explicacion: `${cs.join(' + ')} suma ${t}. ` + (esNat ? 'Con 8 o 9 en las dos primeras cartas es un natural y nadie roba más.' : 'Solo 8 o 9 son naturales; con menos se aplican las reglas de la tercera carta.'), chequeo: { k: 'bacNat', cartas: cs } };
      }
    },
    pj(r) {
      for (;;) {
        const cs = barajar(r, MAZO_BAC).slice(0, 2);
        const t = tot(cs);
        if (t >= 8) continue;
        return { tipo: 'opcion_unica', pregunta: 'El Jugador no tiene natural. ¿Qué hace?', situacion: filasBac(['Jugador', cs]), opciones: SI_NO_BAC.slice(), correcta: jugadorPide(t) ? 0 : 1, explicacion: `${cs.join(' + ')} suma ${t}. El Jugador pide con 0–5 y se planta con 6 o 7.`, chequeo: { k: 'bacJugador', cartas: cs } };
      }
    },
    banca(modo) {
      return (r) => {
        for (;;) {
          const d = barajar(r, MAZO_BAC);
          const p2 = d.slice(0, 2), b2 = d.slice(2, 4), tp = tot(p2), tb = tot(b2);
          if (tp >= 8 || tb >= 8) continue;
          const roba = jugadorPide(tp);
          if (modo === 'planta' && roba) continue;
          if (modo === 'roba' && !roba) continue;
          const pc = roba ? p2.concat([d[4]]) : p2, v = roba ? bv(d[4]) : null;
          const pide = bancaPide(tb, v);
          const expl = roba
            ? `La tercera carta del Jugador (${d[4]}) vale ${v}. Con ${tb}: ${REGLA_BANCA[tb]}.`
            : `El Jugador se plantó, así que la Banca sigue la regla simple: pide con 0–5 y se planta con 6 o 7. Con ${tb} ${pide ? 'pide' : 'se planta'}.`;
          return { tipo: 'opcion_unica', pregunta: roba ? `El Jugador ha pedido carta. La Banca suma ${tb}. ¿Qué hace?` : `El Jugador se ha plantado. La Banca suma ${tb}. ¿Qué hace?`, situacion: filasBac(['Jugador', pc], ['Banca', b2]), opciones: SI_NO_BAC.slice(), correcta: pide ? 0 : 1, explicacion: expl, chequeo: { k: 'bacBanca', jugador: pc, banca: b2 } };
        }
      };
    },
    selB(r) {
      for (;;) {
        const t = pick(r, [3, 4, 5, 6]);
        const b2 = (() => { for (;;) { const c = barajar(r, MAZO_BAC).slice(0, 2); if (tot(c) === t) return c; } })();
        const terceras = barajar(r, MAZO_BAC.filter((c) => !b2.includes(c))).slice(0, 6);
        const idx = terceras.map((c, i) => (bancaPide(t, bv(c)) ? i : -1)).filter((i) => i >= 0);
        if (idx.length < 1 || idx.length > 4 || new Set(terceras.map(bv)).size < 4) continue;
        return { tipo: 'seleccionar', pregunta: `La Banca suma ${t} y el Jugador acaba de pedir carta. Toca las terceras cartas del Jugador con las que la Banca pide.`, situacion: filasBac(['Banca', b2]), cartas: terceras, correctas: idx, explicacion: `${REGLA_BANCA[t][0].toUpperCase() + REGLA_BANCA[t].slice(1)}.`, chequeo: { k: 'bacSelBanca', total: t } };
      }
    },
    gana(r) {
      for (;;) {
        const d = barajar(r, MAZO_BAC);
        const p2 = d.slice(0, 2), b2 = d.slice(2, 4), zap = d.slice(4, 6);
        const res = jugarBac(p2, b2, zap);
        if ((tot(p2) >= 8 || tot(b2) >= 8) && r() < 0.7) continue;
        return { tipo: 'opcion_unica', pregunta: 'Aplica las reglas del bacarrá: ¿quién gana esta mano?', situacion: filasBac(['Jugador', p2], ['Banca', b2], ['Siguientes cartas del zapato', zap]), opciones: ['Jugador', 'Banca', 'Empate'], correcta: ['Jugador', 'Banca', 'Empate'].indexOf(res.ganador), explicacion: res.pasos.join(' '), chequeo: { k: 'bacGana', jugador: p2, banca: b2, zapato: zap } };
      }
    },
    pag(r) {
      const tipo = pick(r, ['Jugador', 'Banca', 'Empate']);
      const apuesta = tipo === 'Jugador' ? pick(r, [10, 20, 30, 50, 60, 80]) : tipo === 'Banca' ? pick(r, [20, 40, 60, 80, 100]) : pick(r, [10, 20, 25, 50]);
      const gana = tipo === 'Jugador' ? apuesta : tipo === 'Banca' ? apuesta * 0.95 : apuesta * 8;
      const expl = tipo === 'Jugador' ? `La apuesta al Jugador paga 1 a 1: ganas ${apuesta} €.` : tipo === 'Banca' ? `La Banca paga 1 a 1 pero cobra un 5 % de comisión sobre lo ganado: ${apuesta} − ${apuesta * 0.05} = ${gana} €.` : `El empate paga 8 a 1: ${apuesta} × 8 = ${gana} €.`;
      return { tipo: 'numero', pregunta: `Apuestas ${apuesta} € a ${tipo === 'Empate' ? 'el Empate' : 'la ' + (tipo === 'Banca' ? 'Banca' : 'mano del Jugador')} y ${tipo === 'Empate' ? 'sale empate' : 'gana'}. ¿Cuántos euros ganas, sin contar tu apuesta?${tipo === 'Banca' ? ' (la Banca paga 1 a 1 con un 5 % de comisión)' : ''}`, unidad: '€', respuesta: gana, explicacion: expl, chequeo: { k: 'bacPago', apuesta, a: tipo } };
    },
    emP() {
      return { tipo: 'emparejar', pregunta: 'Une cada apuesta con lo que paga.', pares: [['Jugador', '1 a 1'], ['Banca', '1 a 1, menos 5 % de comisión'], ['Empate', '8 a 1']], explicacion: 'Jugador y Banca pagan lo mismo, pero la Banca descuenta un 5 % porque gana algo más a menudo. El empate paga más porque sale poco.', chequeo: { k: 'bacPagos' } };
    },
    mej(r) {
      const q = pick(r, [
        { p: '¿Qué apuesta tiene la menor ventaja para la casa?', c: 'Banca' },
        { p: '¿Qué apuesta del bacarrá tiene la peor ventaja para el jugador?', c: 'Empate' },
      ]);
      const ops = barajar(r, ['Banca', 'Jugador', 'Empate']);
      return { tipo: 'opcion_unica', pregunta: q.p, opciones: ops, correcta: ops.indexOf(q.c), explicacion: q.c === 'Banca' ? 'Banca: ≈ 1,06 % de ventaja de la casa, con la comisión incluida. Jugador: ≈ 1,24 %. Empate: ≈ 14 %.' : 'El empate paga 8 a 1 pero solo sale ≈ 9,5 % de las manos: ventaja de la casa ≈ 14 %, mucho peor que las otras dos.', chequeo: { k: 'bacMejor', pide: q.c === 'Banca' ? 'min' : 'max' } };
    },
    edO() {
      return { tipo: 'ordenar', pregunta: 'Ordena las apuestas, de la que menos pierde a la que más pierde a largo plazo.', elementos: ['Banca', 'Jugador', 'Empate'], explicacion: 'Banca ≈ 1,06 %, Jugador ≈ 1,24 %, Empate ≈ 14 % de ventaja de la casa.', chequeo: { k: 'bacEdgeOrden' } };
    },
    perd(r) {
      const a = pick(r, ['Banca', 'Jugador', 'Empate']);
      const n = { Banca: 1, Jugador: 1, Empate: 14 }[a];
      return { tipo: 'numero', pregunta: `A la larga, ¿cuántos euros pierdes de media por cada 100 € apostados a ${a === 'Empate' ? 'el Empate' : 'la ' + a}? (redondea a euros)`, unidad: '€', respuesta: n, explicacion: a === 'Empate' ? 'La ventaja de la casa en el empate es ≈ 14 %: unos 14 € por cada 100 € apostados.' : `La ventaja de la casa es ≈ ${a === 'Banca' ? '1,06' : '1,24'} %: algo más de 1 € por cada 100 € apostados.`, chequeo: { k: 'bacPerd', a } };
    },
    bank(r) {
      const base = pick(r, [100, 200, 300, 500]), pct = pick(r, [1, 2, 5]);
      return { tipo: 'numero', pregunta: `Tu presupuesto de la sesión es de ${base} € y decides apostar solo el ${pct} % por mano. ¿Cuántos euros apuestas en cada mano?`, unidad: '€', respuesta: (base * pct) / 100, explicacion: `${base} × ${pct} ÷ 100 = ${(base * pct) / 100} €. Apostar poco por mano evita que una mala racha te deje sin dinero enseguida.`, chequeo: { k: 'porcentaje', base, pct } };
    },
  };

  // =====================================================================
  //  VÍDEO PÓKER (Jacks or Better 9/6)
  // =====================================================================
  const RANGOS_VP = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
  const NUM_VP = {}; RANGOS_VP.forEach((x, i) => (NUM_VP[x] = i + 2));
  const PAGO_VP = { nada: 0, pareja: 1, dobles: 2, trio: 3, escalera: 4, color: 6, full: 9, poker: 25, escColor: 50, royal: 250 };
  const NOMBRE_VP = { nada: 'Nada (no paga)', pareja: 'Pareja de J o mejor', dobles: 'Doble pareja', trio: 'Trío', escalera: 'Escalera', color: 'Color', full: 'Full', poker: 'Póker', escColor: 'Escalera de color', royal: 'Escalera real' };
  const catVP = (cartas) => {
    const rs = cartas.map((c) => NUM_VP[rangoDe(c)]).sort((a, b) => a - b);
    const color = new Set(cartas.map((c) => c.slice(-1))).size === 1;
    const cont = {}; rs.forEach((x) => (cont[x] = (cont[x] || 0) + 1));
    const forma = Object.values(cont).sort((a, b) => b - a).join('');
    const unicos = forma === '11111';
    const esc = unicos && (rs[4] - rs[0] === 4 || rs.join() === '2,3,4,5,14');
    if (esc && color) return rs.join() === '10,11,12,13,14' ? 'royal' : 'escColor';
    if (forma === '41') return 'poker';
    if (forma === '32') return 'full';
    if (color) return 'color';
    if (esc) return 'escalera';
    if (forma === '311') return 'trio';
    if (forma === '221') return 'dobles';
    if (forma === '2111') return Number(Object.keys(cont).find((k) => cont[k] === 2)) >= 11 ? 'pareja' : 'nada';
    return 'nada';
  };

  function armarMano(cat, r) {
    const R = RANGOS_VP, suits = (n) => barajar(r, PALOS).slice(0, n);
    const otros = (ex, n) => barajar(r, R.filter((x) => !ex.includes(x))).slice(0, n);
    const solta = (rg) => rg + pick(r, PALOS);
    for (let t = 0; t < 400; t++) {
      let cs;
      if (['nada', 'pareja', 'dobles', 'trio', 'full', 'poker'].includes(cat)) {
        const g = pick(r, R);
        if (cat === 'poker') cs = PALOS.map((p) => g + p).concat(otros([g], 1).map(solta));
        else if (cat === 'full') { const h = otros([g], 1)[0]; cs = suits(3).map((p) => g + p).concat(suits(2).map((p) => h + p)); }
        else if (cat === 'trio') cs = suits(3).map((p) => g + p).concat(otros([g], 2).map(solta));
        else if (cat === 'dobles') { const h = otros([g], 1)[0]; cs = suits(2).map((p) => g + p).concat(suits(2).map((p) => h + p), otros([g, h], 1).map(solta)); }
        else if (cat === 'pareja') { const a = pick(r, ['J', 'Q', 'K', 'A']); cs = suits(2).map((p) => a + p).concat(otros([a], 3).map(solta)); }
        else if (r() < 0.5) { const a = pick(r, ['2', '3', '4', '5', '6', '7', '8', '9', '10']); cs = suits(2).map((p) => a + p).concat(otros([a], 3).map(solta)); }
        else cs = otros([], 5).map(solta);
      } else if (cat === 'color') { const p = pick(r, PALOS); cs = otros([], 5).map((x) => x + p); }
      else if (cat === 'escalera') { const ini = 1 + Math.floor(r() * 10); cs = [0, 1, 2, 3, 4].map((k) => { const n = ini + k; return (n === 1 || n === 14 ? 'A' : R[n - 2]) + pick(r, PALOS); }); }
      else if (cat === 'escColor' || cat === 'royal') { const p = pick(r, PALOS), ini = cat === 'royal' ? 10 : 1 + Math.floor(r() * 9); cs = [0, 1, 2, 3, 4].map((k) => { const n = ini + k; return (n === 1 || n === 14 ? 'A' : R[n - 2]) + p; }); }
      if (cs && new Set(cs).size === 5 && catVP(cs) === cat) return barajar(r, cs);
    }
    throw new Error('No se pudo armar una mano de ' + cat);
  }

  const MANOS_TIPO = (tipos) => VP_MANOS.filter((m) => tipos.includes(m.t));
  const textoHold = (cartas, idx) => (idx.length ? idx.map((i) => cartas[i]).join(' ') : 'Ninguna: cambias las cinco');
  const monedas = (n) => `${n} ${n === 1 ? 'moneda' : 'monedas'}`;
  const filasVP = (cartas) => ({ filas: [{ etiqueta: 'Tu mano', cartas }] });
  const CONSEJO_TIPO = {
    hecha: 'Ya tienes una jugada que paga: cambiar cualquier carta te haría perder valor.',
    poker: 'Guardas el póker: cambias la carta suelta por si sale la quinta (sigue pagando 25).',
    trio: 'Guardas el trío y cambias las otras dos: buscas póker o full.',
    dobles: 'Guardas las dos parejas y cambias la carta suelta: con cualquiera de las 4 cartas que completan tienes full.',
    'pareja alta': 'Una pareja de J o mejor ya paga: guárdala y cambia las otras tres.',
    'pareja baja': 'Una pareja baja todavía no paga, pero tiene más opciones de mejorar que cartas sueltas: guárdala.',
    '4 color': 'Cuatro cartas del mismo palo: guardas el proyecto de color y cambias la quinta.',
    '4 escalera': 'Cuatro cartas seguidas: guardas el proyecto de escalera y cambias la quinta.',
    '4 escalera real': 'Cuatro cartas para la escalera real: el premio gordo de 250 por moneda compensa romper otras jugadas.',
    '3 escalera real': 'Tres cartas altas del mismo palo hacia la escalera real: vale la pena guardarlas por encima de cartas sueltas.',
    altas: 'Sin pareja ni proyecto mejor, guardas las cartas altas (J, Q, K, A): pueden formar una pareja que pague.',
  };
  const explicaHold = (f) => `${CONSEJO_TIPO[f.t] || ''} Valor medio de esta jugada: ≈ ${comaDec(f.ev)} monedas por cada moneda apostada.`.trim();

  const CATS_PAGO = ['pareja', 'dobles', 'trio', 'escalera', 'color', 'full', 'poker', 'escColor'];
  const ORD_VP = ['pareja', 'dobles', 'trio', 'escalera', 'color', 'full', 'poker', 'escColor', 'royal'];
  const textoCat = { pareja: 'una pareja de jotas o mejor', dobles: 'una doble pareja', trio: 'un trío', escalera: 'una escalera', color: 'un color', full: 'un full', poker: 'un póker', escColor: 'una escalera de color' };

  const vpG = (tipos) => (r) => {
    const f = pick(r, MANOS_TIPO(tipos));
    return { tipo: 'seleccionar', pregunta: 'Estas son tus cinco cartas. Toca las que debes guardar (jugada óptima de Jacks or Better 9/6).', cartas: f.c.slice(), correctas: f.m.slice(), explicacion: explicaHold(f), chequeo: { k: 'vpHold', m: f.m.slice(), ev: f.ev } };
  };
  const vpD = (tipos) => (r) => {
    const f = pick(r, MANOS_TIPO(tipos).filter((x) => x.alt.length >= 1));
    const ops = barajar(r, [f.m].concat(f.alt.slice(0, 2).map((x) => x.m)));
    const evs = new Map([[JSON.stringify(f.m), f.ev]]); f.alt.forEach((x) => evs.set(JSON.stringify(x.m), x.ev));
    return {
      tipo: 'opcion_unica', pregunta: '¿Qué es mejor guardar con esta mano?', situacion: filasVP(f.c.slice()),
      opciones: ops.map((m) => textoHold(f.c, m)), correcta: ops.findIndex((m) => JSON.stringify(m) === JSON.stringify(f.m)),
      explicacion: `${CONSEJO_TIPO[f.t] || ''} Valores medios: ` + ops.map((m) => `${textoHold(f.c, m)} ≈ ${comaDec(evs.get(JSON.stringify(m)))}`).join('; ') + ' (monedas por moneda apostada).',
      chequeo: { k: 'vpDuelo', m: f.m.slice(), ev: f.ev, opciones: ops.map((m) => m.slice()) },
    };
  };

  const VP = {
    vpMano(r) {
      const cat = pick(r, ['nada', 'pareja', 'dobles', 'trio', 'escalera', 'color', 'full', 'poker']);
      const cs = armarMano(cat, r);
      const ops = barajar(r, [cat].concat(barajar(r, ['nada', 'pareja', 'dobles', 'trio', 'escalera', 'color', 'full', 'poker'].filter((x) => x !== cat)).slice(0, 3)));
      const pg = PAGO_VP[cat];
      const bajaPar = cat === 'nada' && new Set(cs.map(rangoDe)).size === 4;
      return { tipo: 'opcion_unica', pregunta: '¿Qué mano has recibido?', situacion: filasVP(cs), opciones: ops.map((x) => NOMBRE_VP[x]), correcta: ops.indexOf(cat), explicacion: `${NOMBRE_VP[cat]}: ` + (pg ? `paga ${monedas(pg)} por cada moneda apostada.` : bajaPar ? 'una pareja de 10 o menos no paga: hace falta pareja de J o mejor.' : 'no hay ninguna jugada que pague.'), chequeo: { k: 'vpMano', cartas: cs } };
    },
    vpPago(r) {
      const cat = pick(r, CATS_PAGO), m = pick(r, [1, 2, 3, 4, 5]);
      return { tipo: 'numero', pregunta: `Apuestas ${monedas(m)} y sale ${textoCat[cat]}. ¿Cuántas monedas cobras en total?`, unidad: 'monedas', respuesta: PAGO_VP[cat] * m, explicacion: `${textoCat[cat][0].toUpperCase() + textoCat[cat].slice(1)} paga ${PAGO_VP[cat]} por moneda: ${PAGO_VP[cat]} × ${m} = ${PAGO_VP[cat] * m}.`, chequeo: { k: 'vpPago', cat, m } };
    },
    vpOrd(r) {
      const cats = barajar(r, ORD_VP).slice(0, 4).sort((a, b) => ORD_VP.indexOf(a) - ORD_VP.indexOf(b));
      return { tipo: 'ordenar', pregunta: 'Ordena estas jugadas de vídeo póker, de la que menos paga a la que más.', elementos: cats.map((c) => NOMBRE_VP[c]), explicacion: cats.map((c) => `${NOMBRE_VP[c]} paga ${PAGO_VP[c]}`).join('; ') + ' (por moneda apostada).', chequeo: { k: 'vpOrdPagos' } };
    },
    vpEm(r) {
      const cats = barajar(r, CATS_PAGO).slice(0, 4);
      return { tipo: 'emparejar', pregunta: 'Une cada jugada con lo que paga por moneda apostada.', pares: cats.map((c) => [NOMBRE_VP[c], monedas(PAGO_VP[c])]), explicacion: 'Tabla 9/6: pareja de J o mejor 1, doble pareja 2, trío 3, escalera 4, color 6, full 9, póker 25, escalera de color 50 y escalera real 250.', chequeo: { k: 'vpPagos' } };
    },
    vpHecha(r) {
      const f = pick(r, MANOS_TIPO(['hecha']));
      const cat = catVP(f.c);
      const ops = ['Guardas las cinco cartas', 'Cambias las cinco cartas', 'Guardas solo las tres más altas', 'Cambias la carta más baja'];
      return { tipo: 'opcion_unica', pregunta: `Tienes ${NOMBRE_VP[cat].toLowerCase()}. ¿Qué haces?`, situacion: filasVP(f.c.slice()), opciones: ops, correcta: 0, explicacion: `${NOMBRE_VP[cat]} paga ${monedas(PAGO_VP[cat])} por moneda y ya está hecha: cambiar cartas solo puede empeorarla en promedio. Valor medio de guardarla: ${comaDec(f.ev)} monedas por moneda apostada.`, chequeo: { k: 'vpHold', m: [0, 1, 2, 3, 4], ev: f.ev } };
    },
    gT: vpG(['trio', 'dobles', 'poker']),
    gP: vpG(['pareja alta', 'pareja baja']),
    gC: vpG(['4 color', '4 escalera']),
    gR: vpG(['4 escalera real', '3 escalera real']),
    gA: vpG(['trio', 'dobles', 'pareja alta', 'pareja baja', '4 color', '4 escalera', '4 escalera real', '3 escalera real', 'altas']),
    dT: vpD(['trio', 'dobles', 'poker']),
    dP: vpD(['pareja alta', 'pareja baja']),
    dC: vpD(['4 color', '4 escalera']),
    dR: vpD(['4 escalera real', '3 escalera real']),
    dA: vpD(['trio', 'dobles', 'pareja alta', 'pareja baja', '4 color', '4 escalera', '4 escalera real', '3 escalera real', 'altas']),
    vpQuedan(r) {
      const n = pick(r, [3, 4]), palo = pick(r, PALOS);
      return { tipo: 'numero', pregunta: `Guardas ${n} cartas de ${palo} para buscar el color. ¿Cuántas cartas de ${palo} quedan en el mazo?`, unidad: 'cartas', respuesta: 13 - n, explicacion: `Cada palo tiene 13 cartas y ya tienes ${n}: 13 − ${n} = ${13 - n} que pueden completar el color.`, chequeo: { k: 'vpQuedan', n } };
    },
    vpCoste(r) {
      const m = pick(r, [1, 2, 3, 5]), v = pick(r, [1, 2]), manos = pick(r, [20, 50, 100]);
      return { tipo: 'numero', pregunta: `Juegas ${manos} manos apostando ${monedas(m)} de ${v} € cada vez. ¿Cuántos euros apuestas en total?`, unidad: '€', respuesta: m * v * manos, explicacion: `${m} × ${v} € × ${manos} manos = ${m * v * manos} €. Los euros se van rápido aunque cada mano parezca barata.`, chequeo: { k: 'vpCoste', m, v, manos } };
    },
    vpRet(r) {
      const apostado = pick(r, [1000, 2000]), ret = pick(r, [99.5, 95, 90]);
      const perdida = Math.round((apostado * (100 - ret)) / 100);
      return { tipo: 'numero', pregunta: `Una máquina devuelve a largo plazo el ${String(ret).replace('.', ',')} % de lo apostado. Si apuestas ${apostado} € en total, ¿cuánto pierdes de media?`, unidad: '€', respuesta: perdida, explicacion: `Pierdes lo que no devuelve: ${apostado} × ${comaDec(100 - ret, ret === 99.5 ? 1 : 0)} % = ${perdida} €. Con juego perfecto la 9/6 devuelve ≈ 99,5 %, pero muchas máquinas pagan menos.`, chequeo: { k: 'vpRet', apostado, ret } };
    },
  };

  // =====================================================================
  //  CURSOS
  // =====================================================================
  const def = { k: 'def' };
  const op = (id, pregunta, opciones, correcta, explicacion) => ({ id, tipo: 'opcion_unica', pregunta, opciones, correcta, explicacion, chequeo: def });

  // [id, icono, título, xp, intro, ejercicios fijos, receta generada]
  const BAC_UNIDADES = [
    { id: 'ba-u1', titulo: 'Lo básico', descripcion: 'Valores, naturales y apuestas', lecciones: [
      ['ba-1-1', '🔢', 'Valores y total', 10, 'En el bacarrá cada carta tiene un valor: el As vale 1, del 2 al 9 su número, y el 10, la J, la Q y la K valen 0. Sumas las cartas y solo cuenta la cifra de las unidades: 7 + 8 = 15 vale 5. El máximo es 9.',
        [['¿Cuánto vale una K en el bacarrá?', ['0', '10', '13', '1'], 0, 'Las figuras y el 10 valen 0.']], 'val tot tot emV ordT'],
      ['ba-1-2', '⭐', 'Naturales', 10, 'Si con las dos primeras cartas el Jugador o la Banca suma 8 o 9, es un natural: la mano termina y nadie roba carta. Gana el total más alto; si empatan, es empate. Gana la mano que más se acerque a 9.',
        [['¿Qué totales son naturales?', ['8 y 9', 'Solo el 9', '7, 8 y 9', 'Cualquier total de 21']  , 0, 'Un natural es un 8 o un 9 con las dos primeras cartas.']], 'nat tot ordT nat gana'],
      ['ba-1-3', '💶', 'Apuestas y pagos', 10, 'Puedes apostar al Jugador (paga 1 a 1), a la Banca (1 a 1 menos un 5 % de comisión) o al Empate (8 a 1). «Jugador» y «Banca» son solo nombres de las dos manos: no importa quién eres tú, apuestas a la que creas que gana.',
        [['Apuestas a la Banca y gana. ¿Qué descuenta el casino?', ['Una comisión del 5 % sobre lo ganado', 'Nada', 'La mitad de la apuesta', 'Un 20 % de lo ganado'], 0, 'La Banca paga 1 a 1 pero el casino se queda el 5 % de lo que ganas.']], 'pag pag emP pag'],
    ] },
    { id: 'ba-u2', titulo: 'La tercera carta', descripcion: 'Quién pide y quién se planta', lecciones: [
      ['ba-2-1', '🃏', 'Regla del Jugador', 15, 'No decides nada: mandan las reglas. Si el Jugador suma de 0 a 5 pide una tercera carta; con 6 o 7 se planta; con 8 o 9 es natural y la mano termina. Así de simple.',
        [['El Jugador suma 5. ¿Qué hace?', SI_NO_BAC, 0, 'Con 0–5 el Jugador pide carta.']], 'pj pj tot pj ordT'],
      ['ba-2-2', '🏦', 'La Banca (Jugador plantado)', 15, 'Si el Jugador se plantó con 6 o 7, la Banca sigue la misma regla simple: pide con 0–5 y se planta con 6 o 7. Lo complicado llega cuando el Jugador pide carta: se verá en el siguiente nivel.',
        [['El Jugador se planta con 6. La Banca suma 5. ¿Qué hace?', SI_NO_BAC, 0, 'Si el Jugador se plantó, la Banca pide con 0–5.']], 'bP bP pj tot ordT'],
      ['ba-2-3', '🔀', 'La Banca (Jugador pide)', 20, 'Si el Jugador pidió carta, la Banca decide según su total y el valor de la tercera carta del Jugador: con 0–2 siempre pide; con 3 pide salvo si la tercera vale 8; con 4 pide si vale 2–7; con 5 pide si vale 4–7; con 6 pide si vale 6–7; con 7 se planta.',
        [['La Banca suma 7. ¿Qué hace siempre?', ['Se planta', 'Pide', 'Depende de la tercera carta del Jugador', 'Se rinde'], 0, 'Con 7 la Banca se planta siempre.']], 'bR bR selB bR tot'],
      ['ba-2-4', '🎯', 'Mano completa', 20, 'Ahora todo junto: reparto inicial, naturales, tercera carta del Jugador, tercera de la Banca y comparación final. Las cartas siguientes salen del zapato en el orden indicado: la primera es para el Jugador (si pide) y la siguiente para la Banca.',
        [['¿Quién actúa primero con la tercera carta?', ['El Jugador', 'La Banca', 'Quien tenga más', 'El crupier decide'], 0, 'Primero decide el Jugador y después la Banca, según lo que haya hecho el Jugador.']], 'gana gana tot ordT gana'],
    ] },
    { id: 'ba-u3', titulo: 'Dinero y cabeza', descripcion: 'Ventaja de la casa y juego responsable', lecciones: [
      ['ba-3-1', '📉', 'Ventaja de la casa', 15, 'El empate paga 8 a 1 pero sale solo ≈ 9,5 % de las manos: es la peor apuesta, con una ventaja de la casa de ≈ 14 %. La Banca gana algo más que el Jugador incluso con la comisión: ≈ 1,06 % frente a ≈ 1,24 %.',
        [['¿Cuál es la apuesta más cara a largo plazo?', ['El Empate', 'La Banca', 'El Jugador', 'Todas igual'], 0, 'Empate ≈ 14 % de ventaja de la casa.']], 'mej edO perd perd pag'],
      ['ba-3-2', '🧊', 'Cabeza fría', 15, 'Las manos son independientes: una racha no cambia lo que viene, aunque un panel de rachas lo parezca. Fija un presupuesto, apuesta un porcentaje pequeño y para cuando llegues al límite. Jugar es un gasto de ocio, no una forma de ganar dinero.',
        [['La Banca ha ganado seis manos seguidas. ¿Qué probabilidad hay de que gane la siguiente?', ['La misma de siempre', 'Mucha más', 'Mucha menos', 'Ninguna'], 0, 'Cada mano es independiente: el zapato no «se acuerda» de lo que pasó.'],
         ['Has perdido tu presupuesto de la sesión. ¿Qué haces?', ['Paro y lo dejo para otro día', 'Apuesto el doble para recuperarlo', 'Pido dinero prestado', 'Cambio de mesa'], 0, 'Perseguir pérdidas es la forma más rápida de perder más. Parar es la decisión correcta.']], 'bank bank edO perd'],
    ] },
  ];

  const VP_UNIDADES = [
    { id: 'vp-u1', titulo: 'La máquina', descripcion: 'Cómo se juega y qué paga', lecciones: [
      ['vp-1-1', '▶️', 'Cómo se juega', 10, 'Recibes cinco cartas, eliges cuáles guardar y la máquina cambia las demás por cartas nuevas del mismo mazo. Solo hay un cambio. Después cobras según tu mano final: desde pareja de jotas o mejor.',
        [['¿Cuántas veces puedes cambiar cartas en una mano?', ['Una sola vez', 'Dos veces', 'Las que quieras', 'Ninguna'], 0, 'Hay un único cambio: eliges qué guardar y las demás se sustituyen una vez.']], 'vpMano vpMano vpPago vpOrd'],
      ['vp-1-2', '📋', 'Tabla de pagos', 10, 'Pagos por moneda en la tabla 9/6: pareja de J o mejor 1, doble pareja 2, trío 3, escalera 4, color 6, full 9, póker 25, escalera de color 50 y escalera real 250. Con 5 monedas apostadas la escalera real paga 4000 (800 por moneda).',
        [['¿Por qué conviene apostar 5 monedas?', ['La escalera real paga 800 por moneda en vez de 250', 'Pagan el doble todas las jugadas', 'Se pueden cambiar más cartas', 'La máquina da más manos buenas'], 0, 'Solo con 5 monedas la escalera real da 4000 (800 por moneda): el resto de pagos escala igual.']], 'vpEm vpPago vpPago vpOrd vpMano'],
      ['vp-1-3', '🔍', 'Qué mano tengo', 10, 'Antes de decidir qué guardar, reconoce tu mano: pareja (solo paga de J en adelante), doble pareja, trío, escalera (cinco seguidas), color (mismo palo), full (trío + pareja) y póker. Una pareja de 10 o menos no paga.',
        [['¿Paga una pareja de 9?', ['No, hace falta pareja de J o mejor', 'Sí, 1 moneda', 'Sí, 2 monedas', 'Solo si apuestas 5 monedas'], 0, 'En Jacks or Better la pareja más baja que paga es la de jotas.']], 'vpMano vpMano vpMano vpEm vpPago'],
    ] },
    { id: 'vp-u2', titulo: 'Qué guardar', descripcion: 'Elegir bien las cartas', lecciones: [
      ['vp-2-1', '✅', 'Guarda lo que ya paga', 15, 'Si ya tienes jugada hecha (escalera, color, full…), no cambies nada. Si tienes trío, doble pareja o póker, guarda esas cartas y cambia las demás: buscas full o póker. La regla básica: una jugada que paga rara vez se rompe.',
        [['Tienes color con 5 cartas. ¿Qué haces?', ['Guardas las cinco', 'Cambias una por si sale escalera', 'Cambias tres', 'Cambias las cinco'], 0, 'Un color hecho paga 6; romperlo casi nunca compensa.']], 'vpHecha vpHecha gT gT dT vpPago'],
      ['vp-2-2', '🎯', 'Parejas', 15, 'Una pareja de J, Q, K o A ya paga 1 y se guarda casi siempre. Una pareja baja (2–10) todavía no paga, pero tiene opciones de trío, doble pareja o full: suele valer más que cartas sueltas, aunque un proyecto de color de cuatro cartas puede valer más.',
        [['¿Qué haces con una pareja de reyes y tres cartas sueltas?', ['Guardas la pareja', 'Guardas el rey y la carta más alta', 'Cambias las cinco', 'Guardas las tres cartas sueltas'], 0, 'La pareja de reyes ya paga y se mejora a trío, doble pareja o full.']], 'gP gP dP vpPago dP'],
      ['vp-2-3', '🌈', 'Color y escalera', 15, 'Con cuatro cartas del mismo palo hay 9 cartas que completan el color (de 47 en el mazo) y paga 6. Cuatro cartas seguidas completan escalera con menos cartas y paga solo 4. Compara siempre con lo que ya tienes: una pareja alta puede valer más.',
        [['¿Qué paga más, un color o una escalera?', ['El color (6) más que la escalera (4)', 'La escalera (6) más que el color (4)', 'Pagan igual', 'Ninguna paga'], 0, 'En 9/6 el color paga 6 y la escalera 4.']], 'gC gC dC dC vpQuedan vpEm'],
      ['vp-2-4', '👑', 'Escalera real', 15, 'La escalera real (10, J, Q, K y A del mismo palo) paga 250 por moneda: 4000 con 5 monedas. Por eso cuatro cartas hacia la escalera real casi siempre se guardan, aunque rompas otra jugada que ya paga poco.',
        [['¿Qué cartas forman la escalera real?', ['10, J, Q, K y A del mismo palo', 'Cinco cartas seguidas cualesquiera', 'Cinco cartas del mismo palo', 'A, 2, 3, 4 y 5'], 0, 'Es la escalera de color más alta: del 10 al As.']], 'gR gR dR dR vpPago'],
    ] },
    { id: 'vp-u3', titulo: 'Mejorar', descripcion: 'Duelos y juego responsable', lecciones: [
      ['vp-3-1', '⚔️', 'Duelos de decisión', 20, 'Cada decisión tiene un valor medio exacto: lo que pagaría esa jugada, de media, por cada moneda apostada. Elige siempre la de mayor valor medio, aunque la otra «se vea» más bonita. Aquí practicas cuál gana.',
        [['¿Qué significa que una jugada tenga valor medio 0,82?', ['Devuelve de media 0,82 monedas por cada moneda apostada', 'Gana el 82 % de las veces', 'Paga 82 monedas', 'Se pierde 0,82 € siempre'], 0, 'Es el promedio de lo que cobras tras el cambio, por moneda apostada.']], 'dA dA gA dA gA vpPago'],
      ['vp-3-2', '🧘', 'Dinero y juego responsable', 15, 'Aunque juegues perfecto, la máquina devuelve algo menos de lo que apuestas (la 9/6 ≈ 99,5 %), y muchas máquinas pagan menos. Fija un presupuesto, juega manos pequeñas, para al llegar al límite y recuerda que una máquina no está «caliente» ni «fría».',
        [['Una máquina lleva 30 manos sin pagar. ¿Está «a punto» de pagar?', ['No: cada mano es independiente', 'Sí, ya toca', 'Solo si subes la apuesta', 'Sí, si cambias de asiento'], 0, 'Las cartas se reparten al azar en cada mano: no hay rachas que compensar.']], 'vpCoste vpCoste vpRet vpRet vpOrd'],
    ] },
  ];

  const TABLA_BAC = { val: BAC.val, tot: BAC.tot, ordT: BAC.ordT, emV: BAC.emV, nat: BAC.nat, pj: BAC.pj, bP: BAC.banca('planta'), bR: BAC.banca('roba'), selB: BAC.selB, gana: BAC.gana, pag: BAC.pag, emP: BAC.emP, mej: BAC.mej, edO: BAC.edO, perd: BAC.perd, bank: BAC.bank };
  const TABLA_VP = VP;

  function curso(base, unidades, tabla) {
    const c = Object.assign({}, base);
    c.unidades = unidades.map((u) => ({
      id: u.id, titulo: u.titulo, descripcion: u.descripcion,
      lecciones: u.lecciones.map(([id, icono, titulo, xp, intro, fijos, receta]) => ({
        id, titulo, icono, xp, intro,
        ejercicios: fijos.map(([p, o, c2, ex], i) => op(`${id}-e${i + 1}`, p, o, c2, ex)).concat(construir(id, receta, tabla)),
      })),
    }));
    return c;
  }

  CURSOS.push(curso({
    id: 'baccarat', nombre: 'Baccarat', icono: '💎', color: '#e5484d',
    descripcion: 'El juego de casino más elegante: totales, tercera carta y apuestas',
    reglas: 'Punto Banco con 8 mazos: gana la mano que más se acerque a 9. As = 1; 10, J, Q y K = 0. Jugador y Banca siguen reglas fijas.',
  }, BAC_UNIDADES, TABLA_BAC));
  CURSOS.push(curso({
    id: 'videopoker', nombre: 'Vídeo póker', icono: '🎰', color: '#1fb36a',
    descripcion: 'Jacks or Better: qué cartas guardar para ganar más',
    reglas: 'Máquina de 5 cartas con un solo cambio. Paga desde pareja de J o mejor; tabla 9/6: full 9 y color 6 por moneda.',
  }, VP_UNIDADES, TABLA_VP));

  return { BAC: TABLA_BAC, VP: TABLA_VP };
})();
