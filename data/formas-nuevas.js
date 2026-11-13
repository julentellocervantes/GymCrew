// Tres formas más de responder, que se añaden a niveles ya existentes (ver js/app.js):
//   clasificar:  cada carta que sale va a su cajón (arrastrando o tocando)  { categorias, elementos: [[texto, cajón], ...] }
//   deslizador:  mueve el control hasta tu estimación                       { min, max, paso, respuesta, tolerancia, unidad }
//   rellenar:    completa la frase con las palabras del banco               { texto con {}, huecos: [palabras], banco: [palabras] }
// El campo `chequeo` solo lo usa tests/validar.js para recalcular la respuesta con reglas independientes.
(function () {
  const CL = (id, pregunta, categorias, elementos, explicacion, chequeo) => ({ tipo: 'clasificar', id, pregunta, categorias, elementos, explicacion, chequeo });
  const DE = (id, pregunta, min, max, respuesta, tolerancia, unidad, explicacion, chequeo) => ({ tipo: 'deslizador', id, pregunta, min, max, paso: 1, respuesta, tolerancia, unidad, explicacion, chequeo });
  const RE = (id, pregunta, texto, huecos, banco, explicacion) => ({ tipo: 'rellenar', id, pregunta, texto, huecos, banco, explicacion, chequeo: { def: true } });

  const HILO = ['+1', '0', '−1'];
  const MUS3 = ['Vale 10', 'Vale 1', 'Vale su número'];
  const BJ = (crupier, manos, cats) => ({ crupier, manos, cats });
  const textoMano = (m) => m.join(' + ');
  const clBJ = (id, crupier, manos, cajones, cats, explicacion) =>
    CL(id, `El crupier enseña un ${crupier}. Lleva cada mano a la jugada que marca la estrategia básica.`, cats, manos.map((m, i) => [textoMano(m), cajones[i]]), explicacion, { bj: BJ(crupier, manos, cats) });

  const nuevos = {
    // ---------- Blackjack ----------
    'bj-1-1': [
      CL('bj-1-1-c1', 'Lleva cada carta a su cajón según lo que vale en el blackjack.', ['Vale 10', 'Vale 2 a 9'], [['K♠', 0], ['5♦', 1], ['Q♥', 0], ['9♣', 1], ['J♦', 0], ['7♠', 1]],
        'Las figuras (J, Q, K) y el 10 valen 10. Las demás cartas valen su número. El As es especial: vale 1 u 11.', { valor10: true }),
    ],
    'bj-1-2': [
      RE('bj-1-2-r1', 'Completa la frase sobre el blackjack.', 'Con 21 en tus dos primeras cartas tienes un {} y se paga {}.', ['blackjack', '3 a 2'], ['blackjack', '3 a 2', '1 a 1', 'pleno'],
        'Un As y una carta de valor 10 en las dos primeras cartas es un blackjack natural, que paga 3 a 2 (en algunas mesas, solo 6 a 5).'),
    ],
    'bj-2-1': [
      clBJ('bj-2-1-c1', '10', [['10', '4'], ['9', '8'], ['10', '2'], ['10', '9'], ['8', '5'], ['10', '7']], [0, 1, 0, 1, 0, 1], ['Pedir', 'Plantarte'],
        'Contra un 10 del crupier hay que pedir hasta llegar a 17: con 12, 13 o 14 pides, y con 17 o más te plantas.'),
    ],
    'bj-2-2': [
      RE('bj-2-2-r1', 'Completa la frase sobre doblar.', 'Al doblar, doblas tu apuesta y recibes {} carta más.', ['una'], ['una', 'dos', 'tres', 'ninguna'],
        'Doblar significa doblar la apuesta a cambio de recibir una única carta más, y después te plantas.'),
    ],
    'bj-3-1': [
      CL('bj-3-1-c1', 'Lleva cada carta al cajón de lo que suma en el Hi-Lo.', HILO, [['5♠', 0], ['K♥', 2], ['8♦', 1], ['2♣', 0], ['A♠', 2], ['9♥', 1]],
        'Del 2 al 6 suman +1, del 7 al 9 valen 0, y del 10 al As restan 1.', { hilo: true }),
    ],
    'bj-3-2': [
      CL('bj-3-2-c1', 'Otra tanda: lleva cada carta al cajón de lo que suma en el Hi-Lo.', HILO, [['3♦', 0], ['10♣', 2], ['7♠', 1], ['Q♥', 2], ['6♣', 0], ['4♠', 0]],
        'Las cartas bajas (2 a 6) suman +1, las neutras (7 a 9) no cambian la cuenta y las altas (10 a As) restan 1.', { hilo: true }),
    ],
    'bj-3-3': [
      DE('bj-3-3-d1', 'La cuenta corriente es +9 y quedan 3 mazos. Mueve el control hasta la cuenta verdadera.', -8, 8, 3, 0, '',
        'Cuenta verdadera = cuenta corriente ÷ mazos que quedan: 9 ÷ 3 = 3.', { cuentaVerdadera: [9, 3] }),
      RE('bj-3-3-r1', 'Completa la frase sobre la cuenta verdadera.', 'Cuenta verdadera = cuenta {} ÷ mazos que {}.', ['corriente', 'quedan'], ['corriente', 'quedan', 'jugados', 'verdadera'],
        'Divides la cuenta corriente entre los mazos que todavía quedan por jugar.'),
    ],
    'bj-4-1': [
      RE('bj-4-1-r1', 'Completa la frase sobre el seguro.', 'El seguro cuesta hasta la {} de tu apuesta y paga {}.', ['mitad', '2 a 1'], ['mitad', '2 a 1', 'tercera parte', '3 a 2'],
        'Puedes asegurar hasta la mitad de tu apuesta cuando el crupier enseña un As, y el seguro paga 2 a 1.'),
    ],
    'bj-4-2': [
      DE('bj-4-2-d1', 'Apuestas 20 fichas y haces blackjack natural (paga 3 a 2). ¿Cuántas fichas ganas?', 0, 60, 30, 0, ' fichas',
        'Un pago de 3 a 2 son 3 fichas por cada 2 apostadas: 20 ÷ 2 × 3 = 30 fichas.', { pago: [20, 3, 2] }),
    ],
    'bj-7-1': [
      clBJ('bj-7-1-c1', '6', [['10', '2'], ['6', '5'], ['3', '2'], ['10', '4'], ['5', '4'], ['10', '6']], [1, 2, 0, 1, 2, 1], ['Pedir', 'Plantarte', 'Doblar'],
        'Contra un 6, el punto débil del crupier, te plantas con 12 o más, doblas con 9, 10 y 11, y pides con totales bajos.'),
    ],
    'bj-8-1': [
      CL('bj-8-1-c1', 'Cuenta rápida: lleva cada carta al cajón de lo que suma en el Hi-Lo.', HILO, [['A♦', 2], ['6♥', 0], ['J♠', 2], ['8♣', 1], ['3♠', 0], ['10♥', 2]],
        'Bajas (2 a 6) = +1, neutras (7 a 9) = 0 y altas (10 a As) = −1.', { hilo: true }),
    ],
    'bj-8-2': [
      DE('bj-8-2-d1', 'La cuenta corriente es +16 y quedan 4 mazos. ¿Cuánto vale la cuenta verdadera?', -8, 8, 4, 0, '',
        'Cuenta verdadera = 16 ÷ 4 = 4.', { cuentaVerdadera: [16, 4] }),
    ],

    // ---------- Póker ----------
    'pk-1-1': [
      RE('pk-1-1-r1', 'Completa la frase sobre el Texas Hold\'em.', 'Cada jugador recibe {} cartas privadas y en la mesa se reparten {} cartas comunes.', ['2', '5'], ['2', '3', '5', '7'],
        'Cada jugador tiene dos cartas privadas y en la mesa hay cinco comunes: tres del flop, una del turn y una del river.'),
    ],
    'pk-1-2': [
      CL('pk-1-2-c1', 'Lleva cada mano de cinco cartas a su cajón.', ['Pareja', 'Trío', 'Escalera'], [
        ['K♠ K♥ 7♦ 4♣ 2♠', 0], ['9♠ 9♥ 9♦ 5♣ 2♠', 1], ['5♠ 6♥ 7♦ 8♣ 9♠', 2], ['Q♣ Q♦ J♥ 8♠ 3♥', 0], ['4♠ 4♥ 4♦ A♣ 7♠', 1], ['3♣ 4♦ 5♥ 6♠ 7♦', 2]],
        'La pareja son dos cartas iguales, el trío son tres y la escalera son cinco valores seguidos.', { pk: true }),
    ],
    'pk-2-2': [
      DE('pk-2-2-d1', 'Tienes un proyecto de color con 9 outs en el flop. ¿Qué probabilidad aproximada tienes de completarlo?', 0, 100, 36, 3, ' %',
        'Regla del 4 en el flop: 9 outs × 4 = 36 %. El valor exacto es del 35 %, muy cerca.', { outs: { n: 9, fase: 'flop' } }),
    ],
    'pk-3-2': [
      DE('pk-3-2-d1', 'El bote tiene 60 fichas y te piden 20 para ver la carta. ¿Qué porcentaje del bote final pones tú?', 0, 100, 25, 3, ' %',
        'Pagas 20 para un bote final de 60 + 20 = 80: 20 ÷ 80 = 25 %.', { potOdds: [60, 20] }),
    ],
    'pk-4-1': [
      RE('pk-4-1-r1', 'Completa la frase sobre el botón.', 'El botón marca quién {}; las ciegas las ponen los dos jugadores a su {}.', ['reparte', 'izquierda'], ['reparte', 'izquierda', 'derecha', 'gana'],
        'El botón indica quién reparte, y las ciegas pequeña y grande las ponen los dos jugadores situados a su izquierda.'),
    ],
    'pk-5-2': [
      RE('pk-5-2-r1', 'Completa la regla del 4 y el 2.', 'Con el flop multiplicas los outs por {} y con el turn por {}.', ['4', '2'], ['4', '2', '3', '5'],
        'Faltan dos cartas en el flop (outs × 4) y una carta en el turn (outs × 2).'),
    ],
    'pk-7-2': [
      DE('pk-7-2-d1', 'Tienes 8 outs en el turn (escalera abierta). ¿Qué probabilidad aproximada tienes de completarla en el river?', 0, 100, 16, 2, ' %',
        'Regla del 2 en el turn: 8 outs × 2 = 16 %. El valor exacto es del 17,4 %.', { outs: { n: 8, fase: 'turn' } }),
    ],
    'pk-8-1': [
      CL('pk-8-1-c1', 'Reconoce las manos: llévalas a su cajón.', ['Pareja', 'Trío', 'Color'], [
        ['A♥ 8♥ 6♥ 4♥ 2♥', 2], ['J♠ J♦ 9♣ 5♥ 2♦', 0], ['7♣ 7♦ 7♠ K♥ 3♦', 1], ['K♠ 9♠ 6♠ 3♠ 2♠', 2], ['8♥ 8♣ A♦ 6♠ 4♥', 0], ['2♥ 2♦ 2♣ 9♠ 5♦', 1]],
        'Dos cartas iguales son pareja, tres iguales son trío y cinco del mismo palo son color.', { pk: true }),
    ],
    'pk-9-1': [
      CL('pk-9-1-c1', 'Manos en la mesa: llévalas a su cajón.', ['Pareja', 'Escalera', 'Color'], [
        ['9♦ 10♣ J♥ Q♠ K♦', 1], ['5♣ 5♥ A♦ 8♠ 2♥', 0], ['K♦ 10♦ 7♦ 4♦ 3♦', 2], ['2♠ 3♥ 4♦ 5♣ A♥', 1], ['Q♥ Q♣ 9♦ 6♠ 3♣', 0], ['A♠ J♠ 8♠ 5♠ 3♠', 2]],
        'Mira primero el palo (color), luego si los valores son consecutivos (escalera; A-2-3-4-5 también lo es) y por último las cartas repetidas.', { pk: true }),
    ],

    // ---------- Mus ----------
    'ms-1-1': [
      CL('ms-1-1-c1', 'Lleva cada carta al cajón de lo que vale en el mus.', MUS3, [['Rey', 0], ['As', 1], ['5', 2], ['Sota', 0], ['2', 1], ['3', 0]],
        'Rey, Caballo, Sota y 3 valen 10; el As y el 2 valen 1; las demás valen su número.', { valMus: true }),
    ],
    'ms-1-2': [
      RE('ms-1-2-r1', 'Completa el orden de los lances.', 'Los lances del mus, en orden: Grande, Chica, {} y {}.', ['Pares', 'Juego'], ['Pares', 'Juego', 'Piedras', 'Amarraco'],
        'Primero se juegan Grande y Chica, después Pares y por último Juego (o Punto si nadie tiene juego).'),
    ],
    'ms-2-1': [
      RE('ms-2-1-r1', 'Completa las piedras de cada pares.', 'Una pareja vale {} piedra, las medias {} y los duples {}.', ['1', '2', '3'], ['1', '2', '3', '4', '5'],
        'Pareja, 1 piedra; medias, 2 piedras; duples, 3 piedras.'),
    ],
    'ms-3-3': [
      RE('ms-3-3-r1', 'Completa la frase sobre las piedras.', 'El amarraco vale {} piedras y la partida llega a {}.', ['5', '40'], ['5', '3', '30', '40'],
        'Cada amarraco son cinco piedras y la partida se juega a 40.'),
    ],
    'ms-5-1': [
      CL('ms-5-1-c1', 'Otra tanda: lleva cada carta al cajón de lo que vale en el mus.', MUS3, [['Caballo', 0], ['4', 2], ['As', 1], ['6', 2], ['3', 0], ['2', 1]],
        'Caballo y 3 valen 10; el As y el 2 valen 1; el 4 y el 6 valen su número.', { valMus: true }),
    ],
    'ms-5-2': [
      DE('ms-5-2-d1', 'Tu mano es Rey, 7, Caballo y 4. ¿Cuántos puntos tienes?', 0, 40, 31, 0, '',
        'Rey (10) + 7 + Caballo (10) + 4 = 31: el mejor juego del mus.', { mus: ['Rey', '7', 'Caballo', '4'] }),
    ],

    // ---------- Bacarrá ----------
    'ba-1-1': [
      CL('ba-1-1-c1', 'Lleva cada carta al cajón de lo que vale en el bacarrá.', ['Vale 0', 'Vale 1 a 9'], [['K♠', 0], ['4♥', 1], ['10♦', 0], ['A♣', 1], ['Q♥', 0], ['9♠', 1]],
        'El 10 y las figuras valen 0, el As vale 1 y las demás cartas valen su número.', { bacVal: true }),
    ],
    'ba-1-2': [
      RE('ba-1-2-r1', 'Completa la frase sobre los naturales.', 'El natural más alto es el {}; el siguiente es el {}.', ['9', '8'], ['7', '8', '9', '10'],
        'Un total de 8 o 9 con las dos primeras cartas es un natural y nadie pide más cartas. El 9 gana al 8.'),
    ],
    'ba-2-1': [
      CL('ba-2-1-c1', 'Regla del Jugador: lleva cada total al cajón de lo que hace.', ['Pide carta', 'Se planta', 'Natural'], [['Total 3', 0], ['Total 6', 1], ['Total 9', 2], ['Total 5', 0], ['Total 7', 1], ['Total 8', 2]],
        'Con 0 a 5 el Jugador pide, con 6 o 7 se planta y con 8 o 9 es un natural (nadie pide).', { bacJugador: [3, 6, 9, 5, 7, 8] }),
    ],
    'ba-4-1': [
      DE('ba-4-1-d1', 'Tienes un 7 y un 8. ¿Cuánto vale el total en el bacarrá?', 0, 9, 5, 0, '',
        '7 + 8 = 15, y en el bacarrá solo cuenta la cifra de las unidades: el total es 5.', { bacTotal: ['7', '8'] }),
    ],
    'ba-4-5': [
      DE('ba-4-5-d1', 'Apuestas 20 fichas al Jugador y gana. ¿Cuántas fichas ganas?', 0, 40, 20, 0, ' fichas',
        'La apuesta al Jugador paga 1 a 1: ganas lo mismo que apostaste.'),
    ],
    'ba-4-6': [
      RE('ba-4-6-r1', 'Completa la frase sobre la comisión.', 'La apuesta a la Banca cobra una comisión del {} % sobre lo que ganas.', ['5'], ['5', '10', '1', '25'],
        'La Banca gana un poco más a menudo que el Jugador, así que el casino cobra un 5 % de comisión sobre los premios.'),
    ],

    // ---------- Vídeo póker ----------
    'vp-1-1': [
      RE('vp-1-1-r1', 'Completa la frase sobre cómo se juega.', 'Recibes {} cartas, eliges cuáles {} y cambias el resto.', ['5', 'guardar'], ['5', '7', 'guardar', 'tirar'],
        'Recibes cinco cartas, marcas las que guardas y la máquina reparte nuevas cartas en lugar de las demás.'),
    ],
    'vp-1-2': [
      CL('vp-1-2-c1', 'Lleva cada mano a su cajón: ¿paga en Jacks or Better o no?', ['Paga', 'No paga'], [
        ['J♠ J♥ 7♦ 4♣ 2♠', 0], ['8♠ 8♥ 5♦ 3♣ A♠', 1], ['K♦ K♣ K♥ 2♠ 9♥', 0], ['10♠ 10♥ 6♦ 3♣ 2♠', 1], ['A♥ 9♥ 6♥ 4♥ 2♥', 0], ['Q♠ 9♥ 7♦ 4♣ 2♠', 1]],
        'Paga la pareja de J o mejor y cualquier jugada superior (trío, color…). Una pareja de 8 o de 10 y una carta alta no pagan.', { vpPaga: true }),
    ],
    'vp-2-2': [
      RE('vp-2-2-r1', 'Completa la frase sobre las parejas.', 'La pareja más baja que paga en Jacks or Better es la de {}.', ['J'], ['J', '10', 'Q', 'A'],
        'Jacks or Better significa «sotas o mejor»: la pareja de J es la más baja que paga.'),
    ],
  };

  for (const curso of CURSOS)
    for (const u of curso.unidades)
      for (const l of u.lecciones)
        (nuevos[l.id] || []).forEach((e) => l.ejercicios.push(e));
})();
