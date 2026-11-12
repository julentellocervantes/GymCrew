// NIVELES DE PRÁCTICA EXTRA: una unidad nueva al final de blackjack, póker y mus.
// Se generan con data/generadores.js (situaciones nuevas, semilla fija) en su versión «fácil».
// Los niveles Oro (data/premium.js) usan los mismos generadores en su versión difícil.

(function () {
  const PRACTICA = {
    blackjack: {
      unidad: { id: 'bj-6', titulo: 'Práctica extra', descripcion: 'Más situaciones para que se te queden las ideas' },
      tabla: GEN.BJ,
      niveles: [
        ['bj-6-1', '🎯', 'Totales rápidos', 'Suma tu mano y ordena totales sin pensar: la base de todo lo demás.', 'tot tot ordT tot selD dur'],
        ['bj-6-2', '🧠', 'Estrategia en acción', 'Pedir, plantarte, doblar o dividir: decisiones nuevas contra cada carta del crupier.', 'dur bla par emp selD dur'],
        ['bj-6-3', '🔢', 'Conteo en acción', 'Cuenta cartas, convierte en cuenta verdadera y ordena cuentas para ver cuándo conviene apostar más.', 'con conN selH verN ordC con'],
        ['bj-6-4', '💶', 'Dinero y decisiones', 'Seguro, rendición, pagos y bankroll con cifras nuevas cada vez.', 'seg ren dbl bank selD ordT'],
      ],
    },
    poker: {
      unidad: { id: 'pk-7', titulo: 'Práctica extra', descripcion: 'Manos, probabilidades y decisiones nuevas' },
      tabla: GEN.PK,
      niveles: [
        ['pk-7-1', '🃏', 'Lee tus manos', 'Reconoce y ordena manos de póker con cartas nuevas hasta que salga solo.', 'mano mano ordP emP selC gana'],
        ['pk-7-2', '📐', 'Cálculo con outs', 'Outs, regla del 4 y del 2 y pot odds: ¿pagas o te retiras?', 'outs pot dec outs emO selC'],
        ['pk-7-3', '⚔️', 'Duelos en la mesa', 'Quién gana, qué mano tienes y cuándo compensa pagar.', 'gana gana mano ordP emP dec'],
      ],
    },
    mus: {
      unidad: { id: 'ms-4', titulo: 'Práctica extra', descripcion: 'Más manos de mus para entrenar los lances' },
      tabla: GEN.MS,
      niveles: [
        ['ms-4-1', '🪙', 'Puntos y juego', 'Valor de las cartas, puntos de tu mano y orden de los juegos.', 'sel10 pun jue ordJ cat sel10'],
        ['ms-4-2', '🎴', 'Grande, chica y pares', 'Compara manos en los lances principales y reconoce pares, medias y duples.', 'winG winC winP ordMG cat jue'],
        ['ms-4-3', '🏁', 'Marcador y duelo', 'Cuenta piedras y decide quién gana Juego y Chica.', 'pie fal winJ ordMC sel10 pun'],
      ],
    },
  };

  for (const curso of CURSOS) {
    const p = PRACTICA[curso.id];
    if (!p) continue;
    curso.unidades.push(Object.assign({}, p.unidad, {
      lecciones: p.niveles.map(([id, icono, titulo, resumen, receta]) => ({
        id, icono, titulo, xp: 30,
        intro: `${resumen} Cada situación es nueva: no se repiten las de otros niveles.`,
        ejercicios: GEN.construir(id, receta, p.tabla, true),
      })),
    }));
  }
})();
