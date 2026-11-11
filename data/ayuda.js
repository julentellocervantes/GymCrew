// Datos de la pestaña «Útil» (chuletas). tests/validar.js comprueba la tabla de estrategia y los
// ejemplos de póker con código independiente, así que si cambias algo aquí, ejecútalo.
const AYUDA = {
  // Cartas que enseña el crupier, en el orden de las columnas de las tablas
  crupier: ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'A'],
  // Estrategia básica (4-8 mazos, el crupier se planta con 17 blando).
  // Códigos: P = pedir, S = plantarte, D = doblar, X = dividir. "manos" son ejemplos para el validador.
  estrategia: {
    duras: [
      { etiqueta: '5–8', celdas: 'PPPPPPPPPP', manos: [['2', '3'], ['2', '4'], ['3', '4'], ['3', '5']] },
      { etiqueta: '9', celdas: 'PDDDDPPPPP', manos: [['4', '5']] },
      { etiqueta: '10', celdas: 'DDDDDDDDPP', manos: [['4', '6']] },
      { etiqueta: '11', celdas: 'DDDDDDDDDP', manos: [['5', '6']] },
      { etiqueta: '12', celdas: 'PPSSSPPPPP', manos: [['10', '2']] },
      { etiqueta: '13–16', celdas: 'SSSSSPPPPP', manos: [['10', '3'], ['10', '4'], ['10', '5'], ['10', '6']] },
      { etiqueta: '17–21', celdas: 'SSSSSSSSSS', manos: [['10', '7'], ['10', '8'], ['10', '9'], ['10', '5', '6']] },
    ],
    blandas: [
      { etiqueta: 'A,2 · A,3', celdas: 'PPPDDPPPPP', manos: [['A', '2'], ['A', '3']] },
      { etiqueta: 'A,4 · A,5', celdas: 'PPDDDPPPPP', manos: [['A', '4'], ['A', '5']] },
      { etiqueta: 'A,6', celdas: 'PDDDDPPPPP', manos: [['A', '6']] },
      { etiqueta: 'A,7', celdas: 'SDDDDSSPPP', manos: [['A', '7']] },
      { etiqueta: 'A,8 · A,9', celdas: 'SSSSSSSSSS', manos: [['A', '8'], ['A', '9']] },
    ],
    parejas: [
      { etiqueta: 'A,A', celdas: 'XXXXXXXXXX', manos: [['A', 'A']] },
      { etiqueta: '10,10', celdas: 'SSSSSSSSSS', manos: [['10', '10'], ['K', 'K']] },
      { etiqueta: '9,9', celdas: 'XXXXXSXXSS', manos: [['9', '9']] },
      { etiqueta: '8,8', celdas: 'XXXXXXXXXX', manos: [['8', '8']] },
      { etiqueta: '7,7', celdas: 'XXXXXXPPPP', manos: [['7', '7']] },
      { etiqueta: '6,6', celdas: 'XXXXXPPPPP', manos: [['6', '6']] },
      { etiqueta: '5,5', celdas: 'DDDDDDDDPP', manos: [['5', '5']] },
      { etiqueta: '4,4', celdas: 'PPPXXPPPPP', manos: [['4', '4']] },
      { etiqueta: '3,3 · 2,2', celdas: 'XXXXXXPPPP', manos: [['3', '3'], ['2', '2']] },
    ],
  },
  // Ranking de manos de póker, de la más fuerte a la más débil
  poker: [
    { nombre: 'Escalera de color', ejemplo: '9♥ 8♥ 7♥ 6♥ 5♥', desc: 'Cinco cartas seguidas del mismo palo' },
    { nombre: 'Póker', ejemplo: 'K♠ K♥ K♦ K♣ 4♠', desc: 'Cuatro cartas iguales' },
    { nombre: 'Full', ejemplo: 'Q♠ Q♦ Q♣ 7♥ 7♠', desc: 'Un trío y una pareja' },
    { nombre: 'Color', ejemplo: 'A♦ J♦ 8♦ 5♦ 2♦', desc: 'Cinco cartas del mismo palo' },
    { nombre: 'Escalera', ejemplo: '5♠ 6♦ 7♣ 8♥ 9♠', desc: 'Cinco cartas seguidas' },
    { nombre: 'Trío', ejemplo: 'K♠ K♥ K♦ 2♣ 5♠', desc: 'Tres cartas iguales' },
    { nombre: 'Doble pareja', ejemplo: 'A♣ A♦ 4♠ 4♥ 9♣', desc: 'Dos parejas distintas' },
    { nombre: 'Pareja', ejemplo: '10♠ 10♦ A♣ 7♥ 3♠', desc: 'Dos cartas iguales' },
    { nombre: 'Carta alta', ejemplo: 'A♠ J♦ 8♣ 5♥ 2♠', desc: 'Ninguna combinación: gana la carta más alta' },
  ],
  // Outs más habituales (cartas que te mejoran la mano)
  outs: [
    ['Proyecto de color', 9],
    ['Escalera abierta', 8],
    ['Dos cartas altas sin pareja', 6],
    ['Escalera de pulmón (gutshot)', 4],
    ['Pareja que busca trío', 2],
  ],
  glosario: [
    ['Outs', 'Cartas que quedan en el mazo y te completan la mano.'],
    ['Pot odds', 'Lo que tienes que pagar dividido entre el bote final. Si tu probabilidad de ganar es mayor, pagar compensa.'],
    ['Flop · Turn · River', 'Las tres primeras cartas comunes, la cuarta y la quinta.'],
    ['Preflop', 'La ronda de apuestas antes de que salga ninguna carta común.'],
    ['Botón', 'La ficha que marca quién reparte y habla el último.'],
    ['Ciegas', 'Apuestas obligatorias de los dos jugadores a la izquierda del botón.'],
    ['Farol', 'Apostar con una mano floja para que el rival se retire.'],
    ['Semi-farol', 'Apostar con un proyecto que todavía puede mejorar.'],
    ['Tight · Loose', 'Jugador que juega pocas manos (tight) o muchas (loose).'],
    ['Cuenta corriente', 'La suma de los valores Hi-Lo de todas las cartas que han salido.'],
    ['Cuenta verdadera', 'Cuenta corriente dividida entre los mazos que quedan.'],
    ['Bankroll', 'Dinero reservado solo para jugar.'],
    ['Seguro', 'Apuesta extra de hasta la mitad de tu apuesta que paga 2 a 1 si el crupier tiene blackjack.'],
    ['Rendirse', 'Retirarte perdiendo solo la mitad de la apuesta (donde se permite).'],
    ['Amarraco', 'Cinco piedras en el mus.'],
    ['Órdago', 'Apostar todo lo que falta para ganar la partida.'],
  ],
};
