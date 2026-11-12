// AMPLIACIÓN: más niveles para que cada juego tenga 30 niveles normales.
// Se generan con data/generadores.js y data/casino.js (semilla fija por nivel, respuestas calculadas y validadas).
// Los niveles «Examen» y «Torneo» usan las situaciones difíciles; el resto, la versión fácil (blackjack, póker y mus).
// AMPLIACION[curso] = [[id, icono, título, resumen, receta], ...]  (data/premium.js crea el nivel Oro de cada uno)

const AMPLIACION = {};

(function () {
  const UNIDADES = {
    blackjack: {
      tabla: GEN.BJ,
      unidades: [
        { id: 'bj-7', titulo: 'Reto de estrategia', descripcion: 'Decisiones nuevas, mano a mano', niveles: [
          ['bj-7-1', '🎯', 'Duras de 12 a 16', 'Las manos más incómodas: decide si pedir o plantarte según la carta del crupier.', 'dur dur tot dur selD ordT'],
          ['bj-7-2', '🍃', 'Blandas en práctica', 'Manos con un As que cuenta como 11: más margen para arriesgar.', 'bla bla selB tot bla emp'],
          ['bj-7-3', '👯', 'Parejas en práctica', 'Cuándo dividir, cuándo plantarte y cuándo pedir con una pareja.', 'par par selP emp par tot'],
          ['bj-7-4', '✌️', 'Dobles y rendición', 'Cuándo doblar la apuesta y cuándo conviene rendirse.', 'dbl seg dur selD ren ordT'],
          ['bj-7-5', '🔀', 'Mezcla de estrategia', 'Duras, blandas y parejas mezcladas, como en una mesa de verdad.', 'dur bla par emp selD tot'],
        ] },
        { id: 'bj-8', titulo: 'Maestría', descripcion: 'Conteo, dinero y examen final', niveles: [
          ['bj-8-1', '🔢', 'Conteo de cartas', 'Suma +1, 0 o −1 con cada carta y ordena cuentas.', 'con con selH ordC conN tot'],
          ['bj-8-2', '📈', 'Cuenta verdadera', 'Convierte la cuenta corriente en cuenta verdadera según los mazos que quedan.', 'ver verN verN ordC selH con'],
          ['bj-8-3', '⚖️', 'Conteo y decisiones', 'Lleva la cuenta y decide qué jugada hacer con la mano.', 'con ver ordC dur selH verN'],
          ['bj-8-4', '💶', 'Pagos y dinero', 'Naturales, dobles, rendición, seguro y bankroll con cifras nuevas.', 'nat dbl ren seg bank ordT selD dur'],
          ['bj-8-5', '🏆', 'Examen de blackjack', 'Todo lo aprendido en un solo nivel, con las situaciones difíciles.', 'dur bla par emp con verN ordC tot'],
        ] },
      ],
    },
    poker: {
      tabla: GEN.PK,
      unidades: [
        { id: 'pk-8', titulo: 'Más práctica', descripcion: 'Manos, outs y pot odds', niveles: [
          ['pk-8-1', '🃏', 'Reconoce manos', 'Ve cinco cartas y di qué mano es, sin dudar.', 'mano mano ordP emP selC mano'],
          ['pk-8-2', '📊', 'Ranking en orden', 'Ordena manos de la peor a la mejor y une cada una con su nombre.', 'ordP ordP emP mano gana selC'],
          ['pk-8-3', '⚔️', 'Quién gana', 'Compara tu mano con la del rival sobre la misma mesa.', 'gana gana gana mano emP ordP'],
          ['pk-8-4', '🎯', 'Outs básicos', 'Cuenta las cartas que te completan la jugada.', 'outs outs emO selC dec outs'],
          ['pk-8-5', '✖️', 'Regla del 4 y del 2', 'Pasa de outs a probabilidad con la regla rápida.', 'outs dec outs dec emO pot'],
          ['pk-8-6', '💰', 'Pot odds', 'Compara lo que cuesta ver una carta con lo que puedes ganar.', 'pot pot dec dec outs ordP'],
        ] },
        { id: 'pk-9', titulo: 'Reto final', descripcion: 'Decisiones con números y examen', niveles: [
          ['pk-9-1', '🪑', 'Manos en la mesa', 'Reconoce tu mano y compárala con la del rival.', 'gana mano mano ordP emP selC'],
          ['pk-9-2', '🧮', 'Decisiones con números', 'Pot odds, outs y decisión en la misma situación.', 'pot outs dec gana emO ordP'],
          ['pk-9-3', '🧩', 'Cartas que completan', 'Toca las cartas que mejoran tu mano.', 'selC emO outs selC dec mano'],
          ['pk-9-4', '🥊', 'Duelos difíciles', 'Manos parecidas donde hay que fijarse en el detalle.', 'gana gana mano ordP emP dec'],
          ['pk-9-5', '⏱️', 'Cálculo rápido', 'Pot odds y outs, uno tras otro.', 'pot pot outs outs dec emO'],
          ['pk-9-6', '🏁', 'Torneo de póker', 'Un poco de todo con situaciones difíciles.', 'mano gana pot outs dec ordP emP selC'],
          ['pk-9-7', '🏆', 'Examen final de póker', 'El examen completo: manos, ganadores, outs y pot odds.', 'gana mano outs pot dec ordP emP selC emO'],
        ] },
      ],
    },
    mus: {
      tabla: GEN.MS,
      unidades: [
        { id: 'ms-5', titulo: 'Puntos y pares', descripcion: 'Valores, juego y pares', niveles: [
          ['ms-5-1', '🎴', 'Valores de las cartas', 'Qué cartas valen 10 y cuáles valen 1 en el mus a 8 reyes.', 'sel10 sel10 pun jue sel10 pun'],
          ['ms-5-2', '➕', 'Contar puntos', 'Suma los puntos de tu mano y decide si tienes juego.', 'pun pun jue ordJ sel10 pun'],
          ['ms-5-3', '🎲', 'Juego o punto', 'Con 31 o más hay juego; si no, se juega al punto.', 'jue jue ordJ pun winJ sel10'],
          ['ms-5-4', '🥇', 'Orden del juego', 'El 31 es el mejor; después 32, 40, 37 y siguientes.', 'ordJ jue winJ ordJ pun sel10'],
          ['ms-5-5', '👫', 'Pares y medias', 'Reconoce pares, medias y duples en tus cuatro cartas.', 'cat cat winP ordMG sel10 cat'],
          ['ms-5-6', '✌️', 'Duples', 'Dos parejas o cuatro cartas iguales: las mejores jugadas de pares.', 'cat winP cat jue ordMC pun'],
        ] },
        { id: 'ms-6', titulo: 'Los lances', descripcion: 'Grande, chica, pares y juego', niveles: [
          ['ms-6-1', '👑', 'Grande a fondo', 'Gana quien tiene las cartas más altas: compara manos.', 'winG winG ordMG cat sel10 pun'],
          ['ms-6-2', '🐜', 'Chica a fondo', 'Gana quien tiene las cartas más bajas: compara manos.', 'winC winC ordMC cat pun jue'],
          ['ms-6-3', '↕️', 'Grande o chica', 'Dos lances opuestos, mismas manos.', 'winG winC ordMG ordMC cat pun'],
          ['ms-6-4', '👫', 'Pares: quién gana', 'Compara pares, medias y duples entre dos manos.', 'winP winP cat ordMG jue sel10'],
          ['ms-6-5', '🎲', 'Juego: quién gana', 'Compara juegos entre dos manos con el orden del mus.', 'winJ winJ ordJ jue pun cat'],
          ['ms-6-6', '🔁', 'Todos los lances', 'Grande, chica, pares y juego en el mismo nivel.', 'winG winC winP winJ cat ordJ'],
          ['ms-6-7', '🪑', 'Mesa de mus', 'Más situaciones de mesa con los cuatro lances.', 'winG winC winP winJ ordMG ordMC pun'],
        ] },
        { id: 'ms-7', titulo: 'Partida completa', descripcion: 'Piedras, marcador y examen', niveles: [
          ['ms-7-1', '🪨', 'Piedras y marcador', 'Cuenta piedras y amarracos hasta llegar a 40.', 'pie pie fal sel10 jue pun'],
          ['ms-7-2', '🔟', 'Cuenta de piedras', 'Cuántas piedras llevas y cuántas te faltan.', 'pie fal pie ordJ cat winJ'],
          ['ms-7-3', '🏁', 'Partida completa', 'Lances y marcador juntos, como en una partida.', 'pie winG winC winP winJ fal ordJ sel10'],
          ['ms-7-4', '🗑️', 'Descartes', 'Qué cartas conservar y cuáles descartar.', 'sel10 pun cat winG ordMG jue'],
          ['ms-7-5', '🏆', 'Torneo de mus', 'Un poco de todo con situaciones difíciles.', 'winG winC winP winJ cat ordJ pun sel10'],
          ['ms-7-6', '🎓', 'Examen de mus', 'El examen completo de lances, puntos y piedras.', 'sel10 pun jue winG winC winP winJ cat ordMG pie'],
        ] },
      ],
    },
    baccarat: {
      tabla: CASINO.BAC,
      unidades: [
        { id: 'ba-4', titulo: 'Práctica de lo básico', descripcion: 'Totales, naturales y pagos', niveles: [
          ['ba-4-1', '➕', 'Sumas rápidas', 'Suma manos de bacarrá y quédate con la última cifra.', 'tot tot val ordT emV tot'],
          ['ba-4-2', '0️⃣', 'Cartas que valen 0', 'El 10, la J, la Q y la K valen 0: no te líes.', 'val val tot emV ordT tot'],
          ['ba-4-3', '⭐', 'Naturales a la vista', 'Reconoce un 8 o un 9 con las dos primeras cartas.', 'nat nat tot nat ordT emV'],
          ['ba-4-4', '📶', 'Totales en orden', 'Ordena manos por su total y reconoce naturales.', 'ordT ordT tot val emV nat'],
          ['ba-4-5', '💶', 'Pagos', 'Cuánto cobras en Jugador, Banca y Empate.', 'pag pag emP pag mej perd'],
          ['ba-4-6', '🏦', 'Comisión de la Banca', 'La Banca paga 1 a 1 menos un 5 % de comisión.', 'pag pag mej emP perd pag'],
          ['ba-4-7', '📝', 'Examen de lo básico', 'Valores, totales, naturales y pagos en un solo nivel.', 'val tot ordT nat pag emP mej'],
        ] },
        { id: 'ba-5', titulo: 'Reglas al detalle', descripcion: 'La tercera carta y manos completas', niveles: [
          ['ba-5-1', '🃏', 'Jugador: pedir o plantarse', 'Con 0–5 pide, con 6–7 se planta, con 8–9 es natural.', 'pj pj pj tot ordT nat'],
          ['ba-5-2', '🏦', 'Banca sin tercera', 'Si el Jugador se plantó, la Banca pide con 0–5.', 'bP bP bP pj tot ordT'],
          ['ba-5-3', '🔀', 'Banca con tercera', 'La decisión de la Banca depende de la tercera carta del Jugador.', 'bR bR bR selB tot nat'],
          ['ba-5-4', '📋', 'La tabla de la Banca', 'Memoriza con qué terceras cartas pide la Banca.', 'selB selB bR bR tot ordT'],
          ['ba-5-5', '🙋', 'Quién roba', 'Jugador y Banca: ¿pide carta cada uno?', 'pj bP bR selB tot bR'],
          ['ba-5-6', '🎯', 'Manos completas I', 'Aplica todas las reglas y di quién gana.', 'gana gana tot ordT gana nat'],
          ['ba-5-7', '🎯', 'Manos completas II', 'Más manos completas con tercera carta.', 'gana gana gana selB tot ordT'],
        ] },
        { id: 'ba-6', titulo: 'Maestría', descripcion: 'Ventaja de la casa y examen', niveles: [
          ['ba-6-1', '📉', 'Ventaja de la casa', 'Cuánto pierdes de media en cada apuesta.', 'mej edO perd perd pag emP'],
          ['ba-6-2', '🤔', 'Qué apuesta elegir', 'Banca, Jugador o Empate: compara.', 'mej mej edO perd pag emP'],
          ['ba-6-3', '💼', 'Presupuesto', 'Cuánto apostar por mano para no quedarte sin dinero.', 'bank bank perd edO mej pag'],
          ['ba-6-4', '🧊', 'Gestión del dinero', 'Presupuesto, pagos y ventaja de la casa juntos.', 'bank pag perd mej edO emP'],
          ['ba-6-5', '🏆', 'Torneo de bacarrá', 'Manos completas y reglas con situaciones difíciles.', 'gana gana pj bR selB tot ordT'],
          ['ba-6-6', '🎖️', 'Casi expertos', 'Terceras cartas, naturales y pagos mezclados.', 'gana bR bP selB nat tot ordT pag'],
          ['ba-6-7', '🎓', 'Examen final de bacarrá', 'El examen completo de reglas, pagos y ventaja.', 'val tot nat pj bP bR selB gana pag mej edO'],
        ] },
      ],
    },
    videopoker: {
      tabla: CASINO.VP,
      unidades: [
        { id: 'vp-4', titulo: 'Práctica de lo básico', descripcion: 'Manos y pagos', niveles: [
          ['vp-4-1', '🔍', 'Reconoce la mano I', 'Qué jugada tienes entre las cinco cartas recibidas.', 'vpMano vpMano vpMano vpEm vpOrd vpPago'],
          ['vp-4-2', '🔎', 'Reconoce la mano II', 'Más manos para reconocer: pareja baja, escalera, color…', 'vpMano vpMano vpMano vpMano vpOrd vpEm'],
          ['vp-4-3', '📋', 'Pagos por moneda', 'Cuánto paga cada jugada de la tabla 9/6.', 'vpPago vpPago vpEm vpOrd vpMano vpPago'],
          ['vp-4-4', '🪙', 'Apuesta máxima', 'Cuánto cobras con 1 a 5 monedas y cuánto cuesta jugar.', 'vpPago vpPago vpPago vpCoste vpOrd vpEm'],
          ['vp-4-5', '✅', 'Manos hechas', 'Si ya tienes jugada, ¿cambias algo?', 'vpHecha vpHecha vpMano vpPago vpOrd vpEm'],
          ['vp-4-6', '3️⃣', 'Trío, dobles y póker', 'Qué cartas guardar cuando ya tienes una base fuerte.', 'gT gT dT vpPago vpMano vpOrd'],
          ['vp-4-7', '📝', 'Examen de lo básico', 'Manos, pagos y primeras decisiones.', 'vpMano vpPago vpOrd vpEm vpHecha gT'],
        ] },
        { id: 'vp-5', titulo: 'Proyectos', descripcion: 'Parejas, color, escalera y real', niveles: [
          ['vp-5-1', '👑', 'Parejas altas', 'Pareja de J o mejor: guardar y cambiar el resto.', 'gP gP dP vpMano vpPago dP'],
          ['vp-5-2', '🔟', 'Parejas bajas', 'Una pareja baja todavía no paga: ¿qué hacer?', 'gP dP gP dP vpPago vpMano'],
          ['vp-5-3', '🌈', 'Cuatro al color', 'Guarda las cuatro del mismo palo y cambia la quinta.', 'gC gC dC vpQuedan vpPago vpEm'],
          ['vp-5-4', '📶', 'Cuatro a la escalera', 'Cuatro seguidas contra otras jugadas.', 'gC dC gC dC vpMano vpOrd'],
          ['vp-5-5', '💎', 'Escalera real', 'Cuatro cartas hacia el premio gordo.', 'gR gR dR vpPago vpOrd vpEm'],
          ['vp-5-6', '3️⃣', 'Tres a la real', 'Tres cartas altas del mismo palo.', 'gR dR gR dR vpPago vpMano'],
          ['vp-5-7', '🔀', 'Mezcla de proyectos', 'Color, escalera, real y parejas en el mismo nivel.', 'gC gR gP dA dA vpPago'],
        ] },
        { id: 'vp-6', titulo: 'Maestría', descripcion: 'Duelos, dinero y examen', niveles: [
          ['vp-6-1', '⚔️', 'Duelos fáciles', 'Elige entre dos o tres formas de guardar cartas.', 'dT dP dC dR gA vpPago'],
          ['vp-6-2', '⚔️', 'Duelos medios', 'Más duelos, con manos variadas.', 'dA dA gA dA gA vpOrd'],
          ['vp-6-3', '🔥', 'Duelos difíciles', 'Decisiones ajustadas: fíjate en el valor medio.', 'dA dA dA gA dA vpPago'],
          ['vp-6-4', '🎯', 'Guardar bien', 'Toca las cartas correctas en cada mano.', 'gA gA gA dA vpMano vpPago'],
          ['vp-6-5', '🧘', 'Dinero y juego responsable', 'Cuánto cuesta jugar y cuánto devuelve la máquina.', 'vpCoste vpCoste vpRet vpRet vpOrd vpEm'],
          ['vp-6-6', '🏆', 'Torneo de vídeo póker', 'Decisiones y pagos con situaciones difíciles.', 'dA gA dA gA vpHecha vpPago vpOrd'],
          ['vp-6-7', '🎓', 'Examen final de vídeo póker', 'El examen completo: manos, pagos, decisiones y dinero.', 'vpMano vpPago vpEm vpOrd vpHecha gT dA gA dA vpCoste'],
        ] },
      ],
    },
  };

  for (const curso of CURSOS) {
    const cfg = UNIDADES[curso.id];
    if (!cfg) continue;
    AMPLIACION[curso.id] = [];
    for (const u of cfg.unidades) {
      curso.unidades.push({
        id: u.id, titulo: u.titulo, descripcion: u.descripcion,
        lecciones: u.niveles.map(([id, icono, titulo, resumen, receta]) => {
          AMPLIACION[curso.id].push([id, icono, titulo, resumen, receta]);
          const dificil = /^(Examen|Torneo)/.test(titulo);
          return {
            id, icono, titulo, xp: dificil ? 40 : 30,
            intro: `${resumen} Cada situación es nueva: no se repiten las de otros niveles.`,
            ejercicios: GEN.construir(id, receta, cfg.tabla, !dificil),
          };
        }),
      });
    }
  }
})();
