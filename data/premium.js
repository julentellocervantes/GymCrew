// RUTA DORADA (VIP): un nivel «Oro» más difícil junto a cada nivel normal del mapa.
//
// Los ejercicios se generan con código (semilla fija por nivel: siempre salen los mismos) y la respuesta
// se calcula en el momento. tests/validar.js los recalcula con código independiente.
// El campo "chequeo" solo lo usa el validador; la app lo ignora.
//
//  - PREMIUM: ajustes de la membresía (precio, enlace de pago, modo de pruebas).
//  - ORO:     { idDelNivelNormal: nivelOro }  (cada nivelOro tiene oro:true y el mismo formato que un nivel).
//  - CURSOS_ORO: lo mismo con forma de cursos, para el validador.

const PREMIUM = {
  nombre: 'VIP',
  precio: '4,99 €',
  periodo: 'al mes',
  // Cuando tengas tu enlace de pago (por ejemplo un Payment Link de Stripe) ponlo aquí entre comillas.
  // Mientras esté vacío NO se cobra nada y la app funciona en «modo de pruebas».
  enlacePago: '',
  // true: el botón activa 30 días de VIP en este dispositivo sin cobrar (para probar).
  // Ponlo en false cuando conectes el cobro real.
  modoPrueba: true,
  diasPrueba: 30,
};

const ORO = {};
const CURSOS_ORO = [];

(function () {
  // ---------- utilidades ----------
  const hash = (s) => { let h = 1779033703 ^ s.length; for (let i = 0; i < s.length; i++) { h = Math.imul(h ^ s.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); } return h >>> 0; };
  const semilla = (s) => { let a = hash(s); return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };

  const signo = (n) => (n > 0 ? '+' + n : n === 0 ? '0' : String(n));
  const lista = (xs) => (xs.length <= 1 ? xs.join('') : xs.slice(0, -1).join(', ') + ' y ' + xs[xs.length - 1]);

  // ---------- blackjack ----------
  const RANGOS_BJ = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
  const PALOS = ['♠', '♥', '♦', '♣'];
  const valBJ = (c) => (c === 'A' ? 11 : 'JQK'.includes(c) ? 10 : Number(c));
  const totalBJ = (cs) => {
    let t = cs.reduce((s, c) => s + valBJ(c), 0), ases = cs.filter((c) => c === 'A').length;
    while (t > 21 && ases > 0) { t -= 10; ases--; }
    return { t, blando: ases > 0 };
  };
  const hiLo = (c) => (['2', '3', '4', '5', '6'].includes(c) ? 1 : ['10', 'J', 'Q', 'K', 'A'].includes(c) ? -1 : 0);
  const NOMBRE_ACCION = { P: 'Pedir', S: 'Plantarte', D: 'Doblar', X: 'Dividir' };
  const VERBO = { Pedir: 'pedir', Plantarte: 'plantarte', Doblar: 'doblar', Dividir: 'dividir' };
  const textoMano = (m) => lista(m);
  const descMano = (m) => { const { t, blando } = totalBJ(m); return m.length === 2 && m[0] === m[1] ? `pareja de ${m[0]}` : `${textoMano(m)} (${t}${blando ? ' blando' : ''})`; };
  const artCrupier = (c) => (c === 'A' ? 'un As' : `un ${c}`);

  // Filas de la tabla de estrategia que no son triviales (con más de una jugada distinta)
  const filasUtiles = (grupo) => AYUDA.estrategia[grupo].filter((f) => new Set(f.celdas).size > 1);
  const celdasDe = (fila, mano) => fila.celdas.split('').map((c) => NOMBRE_ACCION[c]);

  function explicaAccion(accion, crupier) {
    const debil = ['2', '3', '4', '5', '6'].includes(crupier);
    const quien = debil ? 'una carta débil (se pasa a menudo)' : 'una carta fuerte';
    if (accion === 'Doblar') return `La estrategia básica dice doblar: tu mano puede mejorar mucho y el crupier enseña ${quien}.`;
    if (accion === 'Dividir') return `La estrategia básica dice dividir: dos manos jugadas por separado rinden más que esta pareja junta contra ${quien}.`;
    if (accion === 'Plantarte') return `La estrategia básica dice plantarte: con este total, pedir arriesga más de lo que gana frente a ${quien}.`;
    return `La estrategia básica dice pedir: quedarte aquí no basta frente a ${quien}.`;
  }

  const G = {
    // ¿Qué total tengo?
    tot(r, n) {
      for (;;) {
        const k = 3 + Math.floor(r() * 2);
        const cs = Array.from({ length: k }, () => RANGOS_BJ[Math.floor(r() * 13)]);
        const { t } = totalBJ(cs);
        const base = cs.reduce((s, c) => s + (c === 'A' ? 1 : valBJ(c)), 0);
        if (t > 21 || !cs.includes('A') && n % 2) continue;
        return {
          tipo: 'numero',
          pregunta: `Tienes ${lista(cs)}. ¿Qué total tienes?`,
          situacion: { jugador: cs, crupier: RANGOS_BJ[Math.floor(r() * 13)] },
          respuesta: t,
          explicacion: cs.includes('A') && base !== t ? `Con los ases como 1 sumas ${base}; como un As puede valer 11 sin pasarte, el total sube a ${t}.` : `Suma directa: ${t}. (Los ases valen 1 si el 11 te haría pasarte.)`,
        };
      }
    },
    // Acción según la tabla de estrategia
    acc(grupo) {
      return (r) => {
        const fila = pick(r, filasUtiles(grupo));
        const mano = pick(r, fila.manos);
        const ci = Math.floor(r() * 10);
        const crupier = AYUDA.crupier[ci];
        const accion = celdasDe(fila)[ci];
        const opciones = grupo === 'parejas' ? ['Pedir', 'Plantarte', 'Doblar', 'Dividir'] : ['Pedir', 'Plantarte', 'Doblar'];
        return {
          tipo: 'accion',
          situacion: { jugador: mano, crupier },
          pregunta: `Tienes ${descMano(mano)} y el crupier enseña ${artCrupier(crupier)}. ¿Qué haces?`,
          opciones, correcta: opciones.indexOf(accion),
          explicacion: explicaAccion(accion, crupier),
        };
      };
    },
    // Toca las cartas del crupier ante las que haces X
    sel(grupo) {
      return (r) => {
        for (;;) {
          const fila = pick(r, filasUtiles(grupo));
          const mano = pick(r, fila.manos);
          const cel = celdasDe(fila);
          const accion = pick(r, [...new Set(cel)]);
          const idx = barajar(r, [...Array(10).keys()]).slice(0, 6);
          const ok = idx.map((i, k) => (cel[i] === accion ? k : -1)).filter((k) => k >= 0);
          if (ok.length < 1 || ok.length > 4) continue;
          const cartas = idx.map((i) => AYUDA.crupier[i]);
          return {
            tipo: 'seleccionar',
            pregunta: `Tienes ${descMano(mano)}. Toca las cartas del crupier ante las que debes ${VERBO[accion]}.`,
            cartas, correctas: ok,
            explicacion: `Según la estrategia básica, con esta mano ${VERBO[accion]} es lo correcto contra: ${lista(ok.map((k) => cartas[k]))}.`,
            chequeo: { jugador: mano, accion },
          };
        }
      };
    },
    // Une cada situación con su jugada
    emp(r) {
      const grupos = [['duras', 'Pedir'], ['duras', 'Plantarte'], ['duras', 'Doblar'], ['parejas', 'Dividir']];
      const pares = [], chequeo = [];
      for (const [grupo, accion] of grupos) {
        const cand = [];
        for (const f of AYUDA.estrategia[grupo]) for (const m of f.manos) celdasDe(f).forEach((a, i) => { if (a === accion && !(grupo === 'duras' && accion === 'Plantarte' && totalBJ(m).t >= 17 && r() < 0.6)) cand.push([m, AYUDA.crupier[i]]); });
        const [m, c] = pick(r, cand);
        pares.push([`${m.join('-')} contra ${c}`, accion]);
        chequeo.push({ jugador: m, crupier: c });
      }
      return { tipo: 'emparejar', pregunta: 'Une cada situación con la jugada de la estrategia básica.', pares, explicacion: 'Cada jugada sale de la tabla de estrategia básica (pestaña Útil): hay que mirar tu mano y la carta del crupier a la vez.', chequeo };
    },
    // Cuenta corriente con opciones
    con(r) {
      const n = 6 + Math.floor(r() * 4);
      const cartas = Array.from({ length: n }, () => RANGOS_BJ[Math.floor(r() * 13)]);
      const suma = cartas.reduce((a, c) => a + hiLo(c), 0);
      const dist = barajar(r, [suma - 2, suma - 1, suma + 1, suma + 2, suma + 3]).slice(0, 3);
      const opciones = barajar(r, [suma, ...dist]).map(signo);
      return {
        tipo: 'cuenta_corriente', secuencia: cartas,
        pregunta: 'Salen estas cartas en este orden. ¿Cuál es la cuenta corriente al final?',
        opciones, correcta: opciones.indexOf(signo(suma)),
        explicacion: cartas.map((c) => `${c} (${signo(hiLo(c))})`).join(', ') + `. Suma total: ${signo(suma)}.`,
      };
    },
    // Cuenta corriente escribiendo la cifra
    conN(r) {
      for (;;) {
        const n = 7 + Math.floor(r() * 4);
        const cartas = Array.from({ length: n }, () => RANGOS_BJ[Math.floor(r() * 13)]);
        const suma = cartas.reduce((a, c) => a + hiLo(c), 0);
        if (suma < 0 || suma > 6) continue;
        return {
          tipo: 'numero', secuencia: cartas,
          pregunta: 'Salen estas cartas en este orden. ¿Cuál es la cuenta corriente? (escribe solo el número)',
          respuesta: suma,
          explicacion: cartas.map((c) => `${c} (${signo(hiLo(c))})`).join(', ') + `. Suma total: ${signo(suma)}.`,
        };
      }
    },
    // Cuenta verdadera escribiendo la cifra
    verN(r) {
      const mazos = 2 + Math.floor(r() * 5), k = 1 + Math.floor(r() * 5);
      return { tipo: 'numero', pregunta: `La cuenta corriente es +${k * mazos} y quedan ${mazos} mazos. ¿Cuál es la cuenta verdadera?`, respuesta: k, explicacion: `Cuenta verdadera = cuenta corriente ÷ mazos que quedan: ${k * mazos} ÷ ${mazos} = ${k}.` };
    },
    // Cuenta verdadera con opciones (puede ser negativa)
    ver(r) {
      const mazos = 2 + Math.floor(r() * 5), k = Math.floor(r() * 7) - 2 || 2, run = k * mazos;
      const dist = barajar(r, [run, k + 1, k - 1, -k, k + 2].filter((x) => x !== k));
      const opciones = barajar(r, [k, ...[...new Set(dist)].slice(0, 3)]).map(signo);
      return { tipo: 'opcion_unica', pregunta: `La cuenta corriente es ${signo(run)} y quedan ${mazos} mazos. ¿Cuál es la cuenta verdadera?`, opciones, correcta: opciones.indexOf(signo(k)), explicacion: `${signo(run)} ÷ ${mazos} mazos = ${signo(k)}.` };
    },
    // Ordenar cuentas de mayor a menor
    ordC(r) {
      const nums = barajar(r, [-3, -2, -1, 0, 1, 2, 3, 4, 5, 6]).slice(0, 4).sort((a, b) => b - a);
      return { tipo: 'ordenar', pregunta: 'Ordena estas cuentas verdaderas, de la más alta (mejor para ti) a la más baja.', elementos: nums.map(signo), explicacion: 'Cuanto más alta es la cuenta verdadera, más cartas altas quedan en el mazo y mejor es para el jugador.', chequeo: { numeros: nums } };
    },
    // Ordenar totales
    ordT(r) {
      const nums = barajar(r, [12, 13, 14, 15, 16, 17, 18, 19, 20, 21]).slice(0, 4).sort((a, b) => b - a);
      return { tipo: 'ordenar', pregunta: 'Ordena estos totales sin pasarte, del que más se acerca a 21 al que menos.', elementos: nums.map(String), explicacion: 'Gana el total más alto que no se pasa de 21.', chequeo: { numeros: nums } };
    },
    // Hi-Lo: tocar cartas
    selH(r) {
      const tipos = [['SUMAN +1', 1, 'Suman +1 las cartas del 2 al 6'], ['RESTAN 1', -1, 'Restan 1 las cartas del 10 al As'], ['neutras (valen 0)', 0, 'Las cartas del 7 al 9 no cambian la cuenta']];
      for (;;) {
        const [txt, v, regla] = pick(r, tipos);
        const cartas = [];
        const usados = new Set();
        while (cartas.length < 7) {
          const c = RANGOS_BJ[Math.floor(r() * 13)] + pick(r, PALOS);
          if (!usados.has(c)) { usados.add(c); cartas.push(c); }
        }
        const ok = cartas.map((c, i) => (hiLo(c.slice(0, -1)) === v ? i : -1)).filter((i) => i >= 0);
        if (ok.length < 1 || ok.length > 4) continue;
        const pregunta = v === 0 ? 'Toca las cartas neutras (valen 0) en el Hi-Lo.' : `Toca las cartas que ${txt} en el Hi-Lo.`;
        return { tipo: 'seleccionar', pregunta, cartas, correctas: ok, explicacion: `${regla}: aquí ${lista(ok.map((i) => cartas[i]))}.` };
      }
    },
    // Dinero (fichas)
    dbl(r) { const n = pick(r, [10, 20, 25, 40, 50, 100]); return { tipo: 'numero', pregunta: `Apuestas ${n} fichas y doblas. ¿Cuántas fichas tienes en juego en total?`, respuesta: 2 * n, explicacion: `Doblar es añadir otra apuesta igual: ${n} + ${n} = ${2 * n} fichas.` }; },
    seg(r) { const n = pick(r, [20, 30, 40, 60, 100]); return { tipo: 'numero', pregunta: `Tu apuesta es de ${n} fichas. ¿Cuánto es el máximo que puedes apostar al seguro?`, respuesta: n / 2, explicacion: `El seguro cuesta como máximo la mitad de tu apuesta: ${n} ÷ 2 = ${n / 2}.` }; },
    ren(r) { const n = pick(r, [20, 30, 40, 60, 100]); return { tipo: 'numero', pregunta: `Apuestas ${n} fichas y te rindes. ¿Cuántas fichas recuperas?`, respuesta: n / 2, explicacion: `Rendirte te devuelve media apuesta: ${n} ÷ 2 = ${n / 2}.` }; },
    nat(r) { const n = pick(r, [20, 40, 60, 100]); const [a, b] = pick(r, [[3, 2], [6, 5]]); if (a === 6 && n % 5) return G.nat(r); return { tipo: 'numero', pregunta: `Haces blackjack natural con una apuesta de ${n} fichas en una mesa que paga ${a} a ${b}. ¿Cuántas fichas ganas?`, respuesta: (n * a) / b, explicacion: `Pagar ${a} a ${b} es ganar ${a} por cada ${b} apostados: ${n} × ${a} ÷ ${b} = ${(n * a) / b}.` }; },
    bank(r) { const b = pick(r, [200, 500, 1000, 2000]), p = pick(r, [1, 2, 5, 10]); return { tipo: 'numero', pregunta: `Tu bankroll es de ${b} € y decides arriesgar como máximo el ${p} % en una sesión. ¿Cuántos euros son?`, unidad: '€', respuesta: (b * p) / 100, explicacion: `${b} × ${p} ÷ 100 = ${(b * p) / 100} €. Poner un tope antes de jugar te protege.` }; },
  };

  // ---------- póker ----------
  const RK = { 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7, 8: 8, 9: 9, 10: 10, J: 11, Q: 12, K: 13, A: 14 };
  const NOMBRES_PK = ['Carta alta', 'Pareja', 'Doble pareja', 'Trío', 'Escalera', 'Color', 'Full house', 'Póker', 'Escalera de color'];
  const carta = (c) => ({ r: RK[c.slice(0, -1)], p: c.slice(-1), t: c });
  function valor5(m) {
    const rs = m.map((c) => c.r).sort((a, b) => b - a);
    const color = m.every((c) => c.p === m[0].p);
    const unicos = new Set(rs);
    let alta = 0;
    if (unicos.size === 5) { if (rs[0] - rs[4] === 4) alta = rs[0]; else if (rs.join() === '14,5,4,3,2') alta = 5; }
    const cont = {};
    rs.forEach((x) => (cont[x] = (cont[x] || 0) + 1));
    const g = Object.entries(cont).map(([x, n]) => [n, Number(x)]).sort((a, b) => b[0] - a[0] || b[1] - a[1]);
    const forma = g.map((x) => x[0]).join('');
    const des = g.map((x) => x[1]);
    if (alta && color) return [8, alta];
    if (forma === '41') return [7, ...des];
    if (forma === '32') return [6, ...des];
    if (color) return [5, ...rs];
    if (alta) return [4, alta];
    if (forma === '311') return [3, ...des];
    if (forma === '221') return [2, ...des];
    if (forma === '2111') return [1, ...des];
    return [0, ...rs];
  }
  const comparar = (a, b) => { for (let i = 0; i < Math.max(a.length, b.length); i++) { const d = (a[i] || 0) - (b[i] || 0); if (d) return Math.sign(d); } return 0; };
  function combos(arr, k) { if (k === 0) return [[]]; if (arr.length < k) return []; return [...combos(arr.slice(1), k - 1).map((x) => [arr[0], ...x]), ...combos(arr.slice(1), k)]; }
  function mejorMano(cartas) {
    let mejor = null, usadas = null;
    for (const c of combos(cartas.map(carta), 5)) { const v = valor5(c); if (!mejor || comparar(v, mejor) > 0) { mejor = v; usadas = c.map((x) => x.t); } }
    return { v: mejor, nombre: NOMBRES_PK[mejor[0]], cartas: usadas };
  }
  const mazoPk = () => RANGOS_BJ.flatMap((r) => PALOS.map((p) => r + p));
  const repartir = (r, n) => barajar(r, mazoPk()).slice(0, n);
  const vecinos = (i) => [i - 2, i - 1, i + 1, i + 2].filter((j) => j >= 0 && j < NOMBRES_PK.length);

  const P = {
    mano(r) {
      for (let k = 0; k < 20000; k++) {
        const objetivo = pick(r, [0, 1, 1, 2, 2, 3, 3, 4, 5, 6, 7, 8]);
        const c = repartir(r, 7);
        const m = mejorMano(c);
        if (m.v[0] !== objetivo) continue;
        const dist = barajar(r, vecinos(objetivo)).slice(0, 3);
        const opciones = barajar(r, [objetivo, ...dist]).map((i) => NOMBRES_PK[i]);
        return {
          tipo: 'opcion_unica',
          situacion: { filas: [{ etiqueta: 'Tu mano', cartas: c.slice(0, 2) }, { etiqueta: 'Mesa', cartas: c.slice(2) }] },
          pregunta: '¿Qué mano tienes?', opciones, correcta: opciones.indexOf(m.nombre),
          explicacion: `Tu mejor combinación de cinco cartas es ${m.cartas.join(' ')}: ${m.nombre.toLowerCase()}.`,
        };
      }
    },
    gana(r) {
      for (let k = 0; k < 5000; k++) {
        const c = repartir(r, 9);
        const mesa = c.slice(4);
        const a = mejorMano([...c.slice(0, 2), ...mesa]), b = mejorMano([...c.slice(2, 4), ...mesa]);
        const d = comparar(a.v, b.v);
        if (d === 0 || (k < 3000 && a.v[0] !== b.v[0])) continue;
        const opciones = ['Tú', 'Tu rival', 'Empate'];
        const mismo = a.v[0] === b.v[0];
        return {
          tipo: 'opcion_unica',
          situacion: { filas: [{ etiqueta: 'Tu mano', cartas: c.slice(0, 2) }, { etiqueta: 'Rival', cartas: c.slice(2, 4) }, { etiqueta: 'Mesa', cartas: mesa }] },
          pregunta: '¿Quién gana la mano?', opciones, correcta: d > 0 ? 0 : 1,
          explicacion: `Tú: ${a.nombre.toLowerCase()} (${a.cartas.join(' ')}). Rival: ${b.nombre.toLowerCase()} (${b.cartas.join(' ')}). ` + (mismo ? 'Tenéis el mismo tipo de mano: decide la combinación más alta o el kicker.' : `${d > 0 ? a.nombre : b.nombre} vale más que ${d > 0 ? b.nombre : a.nombre}.`),
        };
      }
    },
    pot(r) {
      const [b, y] = pick(r, [[100, 25], [60, 20], [90, 10], [30, 10], [150, 50], [200, 50], [40, 40], [75, 25], [120, 30], [45, 5]]);
      const p = Math.round((100 * y) / (b + y));
      return { tipo: 'numero', pregunta: `El bote tiene ${b} fichas y debes pagar ${y} para ver la siguiente carta. ¿Qué porcentaje del bote final pondrías tú? (redondea)`, unidad: '%', respuesta: p, explicacion: `Pot odds = lo que pagas ÷ (bote + lo que pagas) = ${y} ÷ ${b + y} = ${p} %.` };
    },
    outs(r) {
      const fase = pick(r, ['flop', 'turn']);
      const n = pick(r, fase === 'flop' ? [4, 6, 8, 9, 12, 15] : [4, 6, 8, 9, 12]);
      const m = fase === 'flop' ? 4 : 2;
      return { tipo: 'numero', pregunta: `En el ${fase} tienes ${n} outs. ¿Qué probabilidad aproximada tienes de completar tu jugada con la regla del 4 y el 2?`, unidad: '%', respuesta: n * m, explicacion: `En el ${fase} se multiplican los outs por ${m}: ${n} × ${m} = ${n * m} %.` };
    },
    dec(r) {
      for (;;) {
        const fase = pick(r, ['flop', 'turn']);
        const n = pick(r, fase === 'flop' ? [4, 6, 8, 9, 12, 15] : [4, 6, 8, 9, 12]);
        const [b, y] = pick(r, [[100, 25], [60, 20], [90, 30], [30, 10], [150, 50], [200, 50], [40, 40], [75, 25], [120, 30], [45, 15]]);
        const eq = n * (fase === 'flop' ? 4 : 2), nec = (100 * y) / (b + y);
        if (Math.abs(eq - nec) < 4) continue;
        const paga = eq > nec;
        const opciones = ['Sí, pagas', 'No, te retiras'];
        return {
          tipo: 'opcion_unica',
          pregunta: `Tienes ${n} outs en el ${fase} (≈ ${eq} % con la regla del 4 y el 2). En el bote hay ${b} fichas y para seguir cuesta ${y}. ¿Pagas?`,
          opciones, correcta: paga ? 0 : 1,
          explicacion: `Necesitas ${Math.round(nec)} % (${y} ÷ ${b + y}) y tienes ≈ ${eq} %. ` + (paga ? 'Tienes más de lo que necesitas: pagar es rentable.' : 'No llegas: retirarte es lo correcto.'),
          chequeo: { decide: { outs: n, fase, bote: b, pagar: y } },
        };
      }
    },
    ordP(r) {
      const cats = barajar(r, [0, 1, 2, 3, 4, 5, 6, 7]).slice(0, 4).sort((a, b) => a - b);
      const manos = cats.map((cat) => { for (;;) { const c = repartir(r, 5); if (valor5(c.map(carta))[0] === cat) return c.join(' '); } });
      return { tipo: 'ordenar', pregunta: 'Ordena estas manos de póker, de la peor a la mejor.', elementos: manos, explicacion: cats.map((c, i) => `${manos[i]} = ${NOMBRES_PK[c].toLowerCase()}`).join('; ') + '.', chequeo: { pkOrden: true } };
    },
    emP(r) {
      const cats = barajar(r, [0, 1, 2, 3, 4, 5, 6, 7]).slice(0, 4);
      const pares = cats.map((cat) => { for (;;) { const c = repartir(r, 5); if (valor5(c.map(carta))[0] === cat) return [c.join(' '), NOMBRES_PK[cat]]; } });
      return { tipo: 'emparejar', pregunta: 'Une cada mano con su nombre.', pares, explicacion: 'Mira primero si hay cartas repetidas (pareja, trío, póker), luego si son consecutivas (escalera) y si comparten palo (color).' };
    },
    selC(r) {
      for (;;) {
        const usados = new Set(), cartas = [];
        while (cartas.length < 7) { const c = pick(r, ['A', 'K', 'Q', 'J', '10', '9', '8', '7', '6', '5', '4', '3', '2']) + pick(r, PALOS); if (!usados.has(c)) { usados.add(c); cartas.push(c); } }
        const ok = cartas.map((c, i) => (c.slice(-1) === '♥' ? i : -1)).filter((i) => i >= 0);
        if (ok.length < 2 || ok.length > 4) continue;
        return { tipo: 'seleccionar', pregunta: 'Llevas cuatro corazones. Toca las cartas que te dan color de corazones.', cartas, correctas: ok, explicacion: `Los corazones del mazo completan tu color: ${lista(ok.map((i) => cartas[i]))}.` };
      }
    },
    emO(r) {
      const todos = barajar(r, AYUDA.outs.slice()).slice(0, 4);
      return { tipo: 'emparejar', pregunta: 'Une cada proyecto con sus outs.', pares: todos.map(([n, v]) => [n, `${v} outs`]), explicacion: 'Son los casos que más se repiten; luego multiplicas por 4 (flop) o por 2 (turn).', chequeo: todos.map(([, v]) => v) };
    },
  };

  // ---------- mus ----------
  const NOMBRES_MUS = ['Rey', 'Caballo', 'Sota', '7', '6', '5', '4', '3', '2', 'As'];
  const valMus = (c) => (['Rey', 'Caballo', 'Sota', '3'].includes(c) ? 10 : ['As', '2'].includes(c) ? 1 : Number(c));
  const rangoMus = (c) => ({ Rey: 10, 3: 10, Caballo: 9, Sota: 8, 7: 7, 6: 6, 5: 5, 4: 4, As: 1, 2: 1 }[c]);
  const ORDEN_JUEGO = [31, 32, 40, 37, 36, 35, 34, 33];
  const puntos = (m) => m.reduce((s, c) => s + valMus(c), 0);
  const mazoMus = () => NOMBRES_MUS.flatMap((n) => [n, n, n, n]);
  const manoMus = (r, k = 4) => barajar(r, mazoMus()).slice(0, k);
  const textoJuego = (n) => (n >= 31 ? `Juego de ${n}` : `Sin juego: punto de ${n}`);
  function catPares(m) {
    const cont = {};
    m.map(rangoMus).forEach((x) => (cont[x] = (cont[x] || 0) + 1));
    const g = Object.entries(cont).map(([x, n]) => [n, Number(x)]).sort((a, b) => b[0] - a[0] || b[1] - a[1]);
    if (g[0][0] === 4) return [3, g[0][1], g[0][1]];
    if (g[0][0] === 2 && g[1] && g[1][0] === 2) return [3, g[0][1], g[1][1]];
    if (g[0][0] === 3) return [2, g[0][1]];
    if (g[0][0] === 2) return [1, g[0][1]];
    return [0];
  }
  // 1 si gana A, -1 si gana B, 0 si empatan
  function ganaLance(lance, a, b) {
    const desc = (m) => m.map(rangoMus).sort((x, y) => y - x);
    const da = desc(a), db = desc(b);
    if (lance === 'Grande') return comparar(da, db);
    if (lance === 'Chica') return -comparar(da.slice().reverse(), db.slice().reverse());
    if (lance === 'Pares') return comparar(catPares(a), catPares(b));
    return Math.sign(ORDEN_JUEGO.indexOf(puntos(b)) - ORDEN_JUEGO.indexOf(puntos(a)));
  }
  const grupoMus = { Rey: ['Rey', '3'], As: ['As', '2'] };
  const rep = (r, n) => (grupoMus[n] ? pick(r, grupoMus[n]) : n);

  const M = {
    sel10(r) {
      for (;;) {
        const cartas = barajar(r, NOMBRES_MUS.slice()).slice(0, 7);
        const ok = cartas.map((c, i) => (valMus(c) === 10 ? i : -1)).filter((i) => i >= 0);
        if (ok.length < 2 || ok.length > 5) continue;
        return { tipo: 'seleccionar', pregunta: 'Toca las cartas que valen 10 puntos en el mus.', cartas, correctas: ok, explicacion: 'Valen 10 el Rey, el Caballo, la Sota y el 3. El As y el 2 valen 1 y las demás valen lo que marcan.' };
      }
    },
    pun(r) {
      const m = manoMus(r);
      return { tipo: 'numero', situacion: { filas: [{ etiqueta: 'Tu mano', cartas: m }] }, pregunta: '¿Cuántos puntos suman tus cuatro cartas?', respuesta: puntos(m), explicacion: m.map((c) => `${c} = ${valMus(c)}`).join(', ') + `. Total: ${puntos(m)}.` };
    },
    jue(r) {
      for (;;) {
        const m = manoMus(r), n = puntos(m);
        const alt = barajar(r, [n - 2, n - 1, n + 1, n + 2, n + 3]).filter((x) => x >= 4 && x <= 40 && x !== n).slice(0, 3);
        if (alt.length < 3) continue;
        const opciones = barajar(r, [n, ...alt]).map(textoJuego);
        return { tipo: 'opcion_unica', situacion: { filas: [{ etiqueta: 'Tu mano', cartas: m }] }, pregunta: '¿Qué tienes para el lance de Juego?', opciones, correcta: opciones.indexOf(textoJuego(n)), explicacion: `Suman ${n} puntos. ` + (n >= 31 ? 'Con 31 o más tienes juego.' : 'Con menos de 31 no hay juego: solo cuenta para el punto.') };
      }
    },
    win(lance) {
      return (r) => {
        for (let k = 0; k < 4000; k++) {
          const c = manoMus(r, 8), a = c.slice(0, 4), b = c.slice(4);
          if (lance === 'Juego' && (puntos(a) < 31 || puntos(b) < 31)) continue;
          if (lance === 'Pares' && catPares(a)[0] === 0 && catPares(b)[0] === 0) continue;
          const d = ganaLance(lance, a, b);
          if (d === 0) continue;
          const opciones = ['Mano A', 'Mano B', 'Empatan'];
          const como = lance === 'Grande' ? 'Se ordena cada mano de mayor a menor (el 3 cuenta como Rey y el 2 como As) y gana la que tiene la primera carta más alta distinta.'
            : lance === 'Chica' ? 'Se ordena cada mano de menor a mayor (el As y el 2 son las más bajas) y gana la que tiene la primera carta más baja distinta.'
            : lance === 'Pares' ? 'Duples gana a medias, medias gana a pares y pares a nada; si hay empate de tipo, gana la pareja o el trío más alto.'
            : `Cada mano suma ${puntos(a)} y ${puntos(b)}. El orden de los juegos es 31, 32, 40, 37, 36, 35, 34, 33.`;
          const nombre = lance === 'Grande' || lance === 'Chica' ? `la ${lance}` : `el lance de ${lance}`;
          return {
            tipo: 'opcion_unica',
            situacion: { filas: [{ etiqueta: 'Mano A', cartas: a }, { etiqueta: 'Mano B', cartas: b }] },
            pregunta: `¿Quién gana ${nombre}?`, opciones, correcta: d > 0 ? 0 : 1,
            explicacion: `${como} Gana la mano ${d > 0 ? 'A' : 'B'}.`,
          };
        }
      };
    },
    ordM(lance) {
      return (r) => {
        for (;;) {
          const manos = Array.from({ length: 4 }, () => manoMus(r));
          manos.sort((x, y) => -ganaLance(lance, x, y));
          const ok = manos.every((m, i) => !i || ganaLance(lance, manos[i - 1], m) === 1);
          if (!ok || new Set(manos.map((m) => m.join(' · '))).size < 4) continue;
          return { tipo: 'ordenar', pregunta: `Ordena estas manos en ${lance === 'Chica' ? 'la Chica' : 'la Grande'}, de la que gana a la que pierde.`, elementos: manos.map((m) => m.join(' · ')), explicacion: lance === 'Grande' ? 'En la Grande vale la carta más alta (el 3 cuenta como Rey); si empatan, se mira la siguiente.' : 'En la Chica vale la carta más baja (el As y el 2 son las más bajas); si empatan, se mira la siguiente.', chequeo: { lance, manos } };
        }
      };
    },
    ordJ(r) {
      const js = barajar(r, ORDEN_JUEGO.slice()).slice(0, 4).sort((a, b) => ORDEN_JUEGO.indexOf(a) - ORDEN_JUEGO.indexOf(b));
      return { tipo: 'ordenar', pregunta: 'Ordena estos juegos del mus, del que más vale al que menos.', elementos: js.map(String), explicacion: 'El orden es 31, 32, 40, 37, 36, 35, 34 y 33: el 31 es el mejor juego y el 33 el peor.', chequeo: { ordenJuego: true } };
    },
    cat(r) {
      const f = {
        'Duples': () => { const a = rep(r, pick(r, NOMBRES_MUS)), b = pick(r, NOMBRES_MUS.filter((x) => rangoMus(x) !== rangoMus(a))); return barajar(r, [a, a, b, b]); },
        'Medias': () => { const a = pick(r, ['Rey', 'Caballo', 'Sota', '7', '6', '5', '4', 'As']); const b = pick(r, NOMBRES_MUS.filter((x) => rangoMus(x) !== rangoMus(a))); const t = a === 'Rey' ? ['Rey', 'Rey', '3'] : a === 'As' ? ['As', '2', '2'] : [a, a, a]; return barajar(r, [...t, b]); },
        'Pares': () => { const [a, b, c] = barajar(r, ['Rey', 'Caballo', 'Sota', '7', '6', '5', '4', 'As']).slice(0, 3); return barajar(r, [a, a, b, c]); },
        'Sin pares': () => barajar(r, ['Rey', 'Caballo', 'Sota', '7', '6', '5', '4', 'As']).slice(0, 4),
      };
      const nombres = Object.keys(f);
      const manos = nombres.map((n) => f[n]());
      return { tipo: 'emparejar', pregunta: 'Une cada mano con lo que tiene en el lance de Pares.', pares: nombres.map((n, i) => [manos[i].join(' · '), n]), explicacion: 'Recuerda que el 3 cuenta como Rey y el 2 como As: dos cartas equivalentes ya forman pareja.', chequeo: { musCats: manos } };
    },
    pie(r) { const n = 3 + Math.floor(r() * 37); if (n % 5 === 0) return M.pie(r); return { tipo: 'numero', pregunta: `Tu pareja lleva ${n} piedras. ¿Cuántos amarracos completos son?`, respuesta: Math.floor(n / 5), explicacion: `Un amarraco son 5 piedras: ${n} ÷ 5 = ${Math.floor(n / 5)} completos (sobran ${n % 5}).` }; },
    fal(r) { const n = 4 + Math.floor(r() * 34); return { tipo: 'numero', pregunta: `Si llevas ${n} piedras, ¿cuántas te faltan para llegar a 40?`, respuesta: 40 - n, explicacion: `40 − ${n} = ${40 - n} piedras.` }; },
  };

  // ---------- auxiliares con azar ----------
  function pick(r, xs) { return xs[Math.floor(r() * xs.length)]; }
  function barajar(r, xs) { const a = xs.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

  // ---------- recetas: qué ejercicios lleva cada nivel Oro ----------
  const BJ = { tot: G.tot, dur: G.acc('duras'), bla: G.acc('blandas'), par: G.acc('parejas'), sel: null, emp: G.emp, con: G.con, conN: G.conN, ver: G.ver, verN: G.verN, ordC: G.ordC, ordT: G.ordT, selH: G.selH, dbl: G.dbl, seg: G.seg, ren: G.ren, nat: G.nat, bank: G.bank };
  const PK = { mano: P.mano, gana: P.gana, pot: P.pot, outs: P.outs, dec: P.dec, ordP: P.ordP, emP: P.emP, selC: P.selC, emO: P.emO };
  const MS = { sel10: M.sel10, pun: M.pun, jue: M.jue, winG: M.win('Grande'), winC: M.win('Chica'), winP: M.win('Pares'), winJ: M.win('Juego'), ordMG: M.ordM('Grande'), ordMC: M.ordM('Chica'), ordJ: M.ordJ, cat: M.cat, pie: M.pie, fal: M.fal };

  // [id del nivel normal, título Oro, receta]
  const RECETAS = {
    blackjack: [
      ['bj-1-1', 'Totales al límite', 'tot tot dur selD ordT tot'],
      ['bj-1-2', 'Manos sin red', 'dur tot emp dur ordT bla'],
      ['bj-2-1', 'Pedir o plantarte: modo experto', 'dur dur selD emp tot dur'],
      ['bj-2-2', 'Dobles de oro', 'dur bla selD dbl emp dur'],
      ['bj-2-3', 'Parejas peliagudas', 'par par selP emp par dur'],
      ['bj-2-4', 'Blandas de élite', 'bla bla selB emp tot bla'],
      ['bj-3-1', 'Hi-Lo a ritmo de casino', 'con selH conN ordC con selH'],
      ['bj-3-2', 'Cuenta corriente sin fallos', 'con con conN selH ordC con'],
      ['bj-3-3', 'Cuenta verdadera al detalle', 'verN verN ver ordC verN ver'],
      ['bj-3-4', 'Cuándo sube la cuenta', 'ver verN ordC con verN selH'],
      ['bj-3-5', 'Conteo y estrategia a la vez', 'ver con verN dur selH ordC'],
      ['bj-4-1', 'El seguro, al céntimo', 'seg seg dur seg selD dbl'],
      ['bj-4-2', 'Rendirse y pagos', 'ren nat dbl ren dur selD'],
      ['bj-4-3', 'Dinero bajo control', 'bank bank dur bank ordT seg'],
      ['bj-5-1', 'Gran reto de estrategia', 'dur bla par selD emp dur bla par'],
      ['bj-5-2', 'Gran reto de conteo', 'con verN ver conN ordC selH con ver'],
    ],
    poker: [
      ['pk-1-1', 'Manos sin pistas', 'mano mano ordP selC emP mano'],
      ['pk-1-2', 'El ranking de memoria', 'mano ordP emP mano selC mano'],
      ['pk-2-1', 'Outs bajo presión', 'outs outs selC emO outs dec'],
      ['pk-2-2', 'Probabilidades rápidas', 'outs outs dec emO selC outs'],
      ['pk-3-1', 'Leer la mesa', 'mano gana ordP emP gana mano'],
      ['pk-3-2', 'Pot odds de verdad', 'pot pot dec dec outs ordP'],
      ['pk-4-1', 'Ciegas y decisiones', 'gana mano ordP emP gana selC'],
      ['pk-4-2', 'Hablar último, ganar más', 'gana gana mano ordP emP selC'],
      ['pk-4-3', 'Cada ronda cuenta', 'mano gana pot ordP emP gana'],
      ['pk-5-1', 'Manos iniciales: examen', 'gana mano ordP emP pot outs'],
      ['pk-5-2', 'Outs de campeonato', 'outs dec outs dec selC emO'],
      ['pk-6-1', 'Duelos de manos', 'gana gana gana mano ordP emP'],
      ['pk-6-2', 'Tu mejor mano, sin dudas', 'mano mano gana selC ordP emP'],
      ['pk-6-3', 'Valor, farol y matemáticas', 'gana dec pot mano ordP emP'],
    ],
    mus: [
      ['ms-1-1', 'Puntos y figuras', 'sel10 pun pun jue sel10 jue'],
      ['ms-1-2', 'Los lances a fondo', 'ordJ pun winG winC jue ordMG'],
      ['ms-2-1', 'Pares, medias y duples', 'cat winP winP ordMG sel10 cat'],
      ['ms-2-2', 'Juego y punto', 'jue jue pun ordJ winJ winJ'],
      ['ms-3-1', 'Mesa de campeonato', 'winG winC ordMC sel10 pun winP'],
      ['ms-3-2', 'Descartes con cabeza', 'sel10 pun winG jue ordMC cat'],
      ['ms-3-3', 'Contar piedras', 'pie fal sel10 fal jue ordJ'],
      ['ms-3-4', '¿Quién gana? Nivel experto', 'winG winC cat winJ ordMG ordJ'],
    ],
  };
  const COLOR_CURSO = {};

  // «selD/selP/selB»: tocar cartas del crupier para duras, parejas o blandas
  const SEL_BJ = { selD: G.sel('duras'), selP: G.sel('parejas'), selB: G.sel('blandas') };

  for (const curso of CURSOS) {
    const recetas = RECETAS[curso.id];
    if (!recetas) continue;
    const tabla = curso.id === 'blackjack' ? BJ : curso.id === 'poker' ? PK : MS;
    const base = {};
    curso.unidades.forEach((u) => u.lecciones.forEach((l) => (base[l.id] = l)));
    const lecciones = [];
    for (const [idBase, titulo, receta] of recetas) {
      const normal = base[idBase];
      if (!normal) continue;
      const id = 'oro-' + idBase;
      const r = semilla(id);
      const vistos = new Set();
      const ejercicios = receta.split(' ').map((clave, i) => {
        const gen = SEL_BJ[clave] || tabla[clave];
        for (let intento = 0; intento < 40; intento++) {
          const e = gen(r, i);
          const huella = e.pregunta + JSON.stringify(e.situacion || e.secuencia || e.cartas || e.elementos || e.pares || e.opciones || '');
          if (vistos.has(huella)) continue;
          vistos.add(huella);
          return Object.assign({ id: `${id}-g${i + 1}` }, e);
        }
        throw new Error('No se pudo generar un ejercicio distinto para ' + id);
      });
      const nivel = {
        id, oro: true, base: idBase, titulo, icono: '👑', xp: normal.xp * 2,
        intro: `Nivel Oro de «${normal.titulo}»: las mismas ideas, pero con situaciones más difíciles y sin pistas fáciles. Si fallas no pasa nada: la explicación te dice por qué.`,
        ejercicios,
      };
      ORO[idBase] = nivel;
      lecciones.push(nivel);
    }
    CURSOS_ORO.push({
      id: curso.id, nombre: curso.nombre, icono: curso.icono, color: curso.color, descripcion: curso.descripcion, reglas: curso.reglas,
      unidades: [{ id: 'oro-' + curso.id, titulo: 'Ruta dorada', descripcion: 'Niveles avanzados VIP', lecciones }],
    });
  }
})();
