// MÁS NIVELES: lleva cada juego hasta 100 niveles normales.
// Los niveles nuevos retoman los temas de siempre en versiones cada vez más exigentes (avanzado, experto, maestro…),
// con situaciones nuevas generadas por código (semilla fija por nivel), así que son siempre las mismas y están validadas.
// Cada nivel nuevo se apunta en AMPLIACION para que data/premium.js le cree su nivel Oro.
// Necesita data/ampliacion.js y data/ruleta.js; se carga antes de data/variedad-generada.js.

(function () {
  const OBJETIVO = 100;
  const TABLAS = { blackjack: GEN.BJ, poker: GEN.PK, mus: GEN.MS, baccarat: CASINO.BAC, videopoker: CASINO.VP, ruleta: RULETA.T };
  const PREFIJO = { blackjack: 'bj', poker: 'pk', mus: 'ms', baccarat: 'ba', videopoker: 'vp', ruleta: 'ru' };
  const TIERS = ['avanzado', 'experto', 'maestro', 'leyenda', 'mítico'];
  const ROMANO = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];

  // Temas propios para los juegos con pocos temas con receta
  const EXTRA = {
    blackjack: [
      ['Blandas a fondo', '🍃', 'Manos con un As: cuándo pedir, plantarte o doblar.', 'bla bla selB bla tot ordT'],
      ['Parejas a fondo', '👯', 'Dividir o no dividir, con todas las parejas.', 'par par selP par emp ordT'],
      ['Contar a ritmo', '⏱️', 'Cuenta Hi-Lo sin perder el hilo y ordena cuentas.', 'con con conN ordC selH tot'],
      ['Banca y pagos', '💶', 'Naturales, dobles, seguro y rendición con dinero de verdad.', 'bank nat dbl seg ren ordT selD'],
      ['Totales y orden', '🧮', 'Suma, compara y decide más rápido que el crupier.', 'tot ordT ordC emp selD dur'],
    ],
    poker: [
      ['Manos y rankings', '🃏', 'Reconoce manos, ordénalas y di quién gana.', 'mano ordP emP gana selC outs'],
      ['Outs y pot odds mezclados', '📐', 'Cuenta outs, pasa a probabilidad y decide si pagas.', 'pot outs dec emO ordP gana'],
    ],
  };

  const unidadMax = (curso) => curso.unidades.reduce((m, u) => { const k = /^[a-z]{2}-u?(\d+)$/.exec(u.id); return k ? Math.max(m, Number(k[1])) : m; }, 0);

  for (const curso of CURSOS) {
    const pre = PREFIJO[curso.id], tabla = TABLAS[curso.id];
    if (!pre || !tabla) continue;
    const faltan = OBJETIVO - curso.unidades.reduce((n, u) => n + u.lecciones.length, 0);
    if (faltan <= 0) continue;
    // Temas: los niveles con receta que ya existen (+ los extra del juego)
    const temas = (curso.id === 'ruleta' ? RULETA.TEMAS : (AMPLIACION[curso.id] || []).map(([, icono, titulo, resumen, receta]) => [titulo, icono, resumen, receta])).concat(EXTRA[curso.id] || []);
    const nuevos = [];
    for (let t = 0; nuevos.length < faltan; t++) {
      for (const [titulo, icono, resumen, receta] of temas) {
        if (nuevos.length >= faltan) break;
        nuevos.push({ t, titulo, icono, resumen, receta });
      }
    }
    AMPLIACION[curso.id] = AMPLIACION[curso.id] || [];
    const contadorTier = {};
    let u = unidadMax(curso);
    for (let i = 0; i < nuevos.length; i += 10) {
      const grupo = nuevos.slice(i, i + 10);
      u++;
      const tier = grupo[0].t;
      contadorTier[tier] = (contadorTier[tier] || 0) + 1;
      curso.unidades.push({
        id: `${pre}-${u}`,
        titulo: `Nivel ${TIERS[Math.min(tier, TIERS.length - 1)]} ${ROMANO[contadorTier[tier] - 1] || contadorTier[tier]}`,
        descripcion: tier === 0 ? 'Los temas que ya conoces, con situaciones nuevas' : 'Más exigente: situaciones nuevas y menos pistas',
        lecciones: grupo.map((n, k) => {
          const id = `${pre}-${u}-${k + 1}`, nombre = TIERS[Math.min(n.t, TIERS.length - 1)];
          const titulo = `${n.titulo} · ${nombre}`;
          // En los niveles más altos se barajan los tipos de pregunta del tema (con las mismas repeticiones que el original)
          const base = n.receta.split(' ');
          const receta = n.t === 0 ? n.receta : GEN.barajar(GEN.semilla('receta' + id), base).join(' ');
          const sinRepetir = [...new Set(base)].join(' ');
          AMPLIACION[curso.id].push([id, n.icono, titulo, n.resumen, receta]);
          const dificil = n.t >= 2 || /^(Examen|Torneo)/.test(n.titulo);
          return GEN.perezoso({
            id, icono: n.icono, titulo, xp: 30 + 5 * Math.min(n.t, 4),
            intro: `${n.resumen} Nivel ${nombre}: situaciones nuevas${n.t ? ' y menos pistas' : ''}. No se repiten las de otros niveles.`,
          }, () => { try { return GEN.construir(id, receta, tabla, !dificil); } catch (e) { return GEN.construir(id, sinRepetir, tabla, !dificil); } });
        }),
      });
    }
  }
})();
