// Curso de PÓKER (Texas Hold'em). Misma estructura que data/blackjack.js.
// Las fichas son solo para practicar: no hay dinero real.

CURSOS.push({
  id: 'poker',
  nombre: 'Póker',
  icono: '♠️',
  color: '#1cb0f6',
  descripcion: "Texas Hold'em: manos, probabilidades y decisiones",
  reglas: "Texas Hold'em, solo para practicar con fichas de mentira.",
  unidades: [
    {
      id: 'pk-u1',
      titulo: 'Lo básico',
      descripcion: 'Cómo se juega y qué mano gana',
      lecciones: [
        {
          id: 'pk-1-1',
          titulo: 'Cómo se juega',
          icono: '🎴',
          xp: 10,
          intro:
            "Jugamos Texas Hold'em, el póker más popular. Cada jugador recibe 2 cartas privadas y se reparten 5 cartas comunes en tres fases: el flop (3 cartas), el turn (1) y el river (1). Tu mano final son las 5 mejores cartas entre las 7 disponibles.",
          ejercicios: [
            {
              id: 'pk-1-1-e1',
              tipo: 'opcion_unica',
              pregunta: "¿Cuántas cartas privadas recibe cada jugador en Texas Hold'em?",
              opciones: ['1', '2', '4', '5'],
              correcta: 1,
              explicacion: 'Cada jugador recibe 2 cartas boca abajo que solo él puede ver.',
            },
            {
              id: 'pk-1-1-e2',
              tipo: 'opcion_unica',
              pregunta: '¿Cuántas cartas comunitarias hay en total al final de la mano?',
              opciones: ['3', '4', '5', '7'],
              correcta: 2,
              explicacion: 'Son 5: 3 del flop, 1 del turn y 1 del river.',
            },
            {
              id: 'pk-1-1-e3',
              tipo: 'opcion_unica',
              pregunta: '¿Cómo se llaman las tres primeras cartas comunitarias?',
              opciones: ['Turn', 'River', 'Flop', 'Ciega'],
              correcta: 2,
              explicacion: 'Las tres primeras cartas que se descubren en la mesa son el flop.',
            },
            {
              id: 'pk-1-1-e4',
              tipo: 'opcion_unica',
              pregunta: 'La cuarta carta comunitaria se llama…',
              opciones: ['Flop', 'Turn', 'River', 'Showdown'],
              correcta: 1,
              explicacion: 'La cuarta carta es el turn.',
            },
            {
              id: 'pk-1-1-e5',
              tipo: 'opcion_unica',
              pregunta: 'La quinta y última carta comunitaria se llama…',
              opciones: ['River', 'Turn', 'Flop', 'Kicker'],
              correcta: 0,
              explicacion: 'La quinta carta es el river.',
            },
            {
              id: 'pk-1-1-e6',
              tipo: 'opcion_unica',
              pregunta: '¿Cómo se forma tu mano final?',
              opciones: [
                'Solo con tus 2 cartas privadas',
                'Con 4 cartas de la mesa y 1 tuya',
                'Con las 5 mejores cartas entre tus 2 y las 5 de la mesa',
                'Siempre con 2 tuyas y 3 de la mesa',
              ],
              correcta: 2,
              explicacion:
                'En Texas Hold\'em puedes usar cualquier combinación de tus 2 cartas y las 5 comunes: lo que forme la mejor mano de 5.',
            },
          ],
        },
        {
          id: 'pk-1-2',
          titulo: 'Ranking de manos',
          icono: '🏆',
          xp: 10,
          intro:
            'De la más fuerte a la más débil: escalera de color, póker (cuatro iguales), full (trío y pareja), color (cinco del mismo palo), escalera (cinco seguidas), trío, doble pareja, pareja y carta alta.',
          ejercicios: [
            {
              id: 'pk-1-2-e1',
              tipo: 'opcion_unica',
              pregunta: '¿Qué mano gana?',
              opciones: ['Color (cinco cartas del mismo palo)', 'Escalera (cinco cartas seguidas)'],
              correcta: 0,
              explicacion: 'El color es más difícil de conseguir que la escalera, así que la supera.',
            },
            {
              id: 'pk-1-2-e2',
              tipo: 'opcion_unica',
              pregunta: '¿Qué mano gana?',
              opciones: ['Full house', 'Color'],
              correcta: 0,
              explicacion: 'El full house está por encima del color en el ranking.',
            },
            {
              id: 'pk-1-2-e3',
              tipo: 'opcion_unica',
              situacion: {
                filas: [
                  { etiqueta: 'Tu mano', cartas: ['9♠', '9♦'] },
                  { etiqueta: 'Mesa', cartas: ['9♣', 'K♥', 'K♦', '3♠', '7♣'] },
                ],
              },
              pregunta: '¿Qué mano tienes?',
              opciones: ['Doble pareja', 'Trío', 'Full house', 'Póker'],
              correcta: 2,
              explicacion: 'Tres nueves y dos reyes: un trío más una pareja es un full house.',
            },
            {
              id: 'pk-1-2-e4',
              tipo: 'opcion_unica',
              pregunta: '¿Qué mano gana?',
              opciones: ['Doble pareja', 'Trío'],
              correcta: 1,
              explicacion: 'Un trío (tres cartas iguales) vence a una doble pareja.',
            },
            {
              id: 'pk-1-2-e5',
              tipo: 'opcion_unica',
              pregunta: '¿Cuál es la mejor mano posible en el póker?',
              opciones: ['Póker de ases', 'Escalera real', 'Full de ases', 'Color al as'],
              correcta: 1,
              explicacion: 'La escalera real (10, J, Q, K y As del mismo palo) es la mano más alta que existe.',
            },
            {
              id: 'pk-1-2-e6',
              tipo: 'opcion_unica',
              situacion: {
                filas: [
                  { etiqueta: 'Tu mano', cartas: ['5♣', '6♦'] },
                  { etiqueta: 'Mesa', cartas: ['7♠', '8♥', '9♣', 'K♦', '2♠'] },
                ],
              },
              pregunta: '¿Qué mano tienes?',
              opciones: ['Carta alta', 'Escalera', 'Color', 'Pareja'],
              correcta: 1,
              explicacion: '5, 6, 7, 8 y 9 son cinco cartas seguidas de palos distintos: una escalera.',
            },
            {
              id: 'pk-1-2-e7',
              tipo: 'opcion_unica',
              pregunta: '¿Qué mano gana?',
              opciones: ['Póker (cuatro cartas iguales)', 'Full house'],
              correcta: 0,
              explicacion: 'El póker está por encima del full house en el ranking.',
            },
          ],
        },
      ],
    },

    {
      id: 'pk-u2',
      titulo: 'Probabilidades',
      descripcion: 'Cuenta tus outs y calcula tus opciones',
      lecciones: [
        {
          id: 'pk-2-1',
          titulo: 'Contar outs',
          icono: '🎯',
          xp: 15,
          intro:
            "Un 'out' es una carta que te mejora la mano. Contarlos te dice cuántas cartas te sirven. Por ejemplo, con 4 cartas de un palo ves 4 de las 13 de ese palo, así que quedan 9 en el mazo.",
          ejercicios: [
            {
              id: 'pk-2-1-e1',
              tipo: 'opcion_unica',
              pregunta: "¿Qué es un 'out'?",
              opciones: [
                'Una carta que te mejora la mano',
                'Una carta que ya salió',
                'La carta más alta de la mesa',
                'Una apuesta alta',
              ],
              correcta: 0,
              explicacion: 'Un out es cualquier carta que, al salir, completa o mejora tu jugada.',
            },
            {
              id: 'pk-2-1-e2',
              tipo: 'opcion_unica',
              situacion: {
                filas: [
                  { etiqueta: 'Tu mano', cartas: ['A♥', '7♥'] },
                  { etiqueta: 'Mesa', cartas: ['K♥', '4♥', '9♣'] },
                ],
              },
              pregunta: 'Te falta una carta para el color de corazones. ¿Cuántos outs tienes?',
              opciones: ['4', '9', '13', '11'],
              correcta: 1,
              explicacion: 'Hay 13 corazones en total y ya ves 4 (dos tuyos y dos en la mesa): 13 - 4 = 9 outs.',
            },
            {
              id: 'pk-2-1-e3',
              tipo: 'opcion_unica',
              situacion: {
                filas: [
                  { etiqueta: 'Tu mano', cartas: ['6♣', '7♦'] },
                  { etiqueta: 'Mesa', cartas: ['8♠', '9♥', 'K♣'] },
                ],
              },
              pregunta: 'Tienes 6-7-8-9: te sirve un 5 o un 10 para la escalera. ¿Cuántos outs tienes?',
              opciones: ['4', '6', '8', '10'],
              correcta: 2,
              explicacion: 'Quedan cuatro 5 y cuatro 10 en el mazo: 4 + 4 = 8 outs. Se llama escalera abierta.',
            },
            {
              id: 'pk-2-1-e4',
              tipo: 'opcion_unica',
              situacion: {
                filas: [
                  { etiqueta: 'Tu mano', cartas: ['6♣', '7♦'] },
                  { etiqueta: 'Mesa', cartas: ['9♠', '10♥', '2♣'] },
                ],
              },
              pregunta: 'Tienes 6-7-_-9-10: solo te sirve un 8 para la escalera. ¿Cuántos outs tienes?',
              opciones: ['2', '4', '8', '12'],
              correcta: 1,
              explicacion: 'Solo hay cuatro 8 en la baraja. A esa escalera con un hueco se le llama gutshot y tiene 4 outs.',
            },
            {
              id: 'pk-2-1-e5',
              tipo: 'opcion_unica',
              situacion: {
                filas: [
                  { etiqueta: 'Tu mano', cartas: ['7♣', '7♦'] },
                  { etiqueta: 'Mesa', cartas: ['K♠', '4♥', '2♣'] },
                ],
              },
              pregunta: 'Tienes pareja de 7 y quieres un trío. ¿Cuántos outs tienes?',
              opciones: ['1', '2', '3', '4'],
              correcta: 1,
              explicacion: 'Hay cuatro 7 en la baraja y tú ya tienes dos: quedan 2 que te dan el trío.',
            },
          ],
        },
        {
          id: 'pk-2-2',
          titulo: 'La regla del 4 y el 2',
          icono: '🧮',
          xp: 15,
          intro:
            'Un atajo para estimar tus probabilidades. En el flop (aún faltan dos cartas) multiplica tus outs por 4; en el turn (falta una carta) multiplícalos por 2. El resultado es el porcentaje aproximado de completar tu jugada.',
          ejercicios: [
            {
              id: 'pk-2-2-e1',
              tipo: 'opcion_unica',
              pregunta: 'En el flop tienes 9 outs. ¿Qué probabilidad aproximada tienes de completar tu jugada?',
              opciones: ['18%', '27%', '36%', '45%'],
              correcta: 2,
              explicacion: 'En el flop se multiplica por 4: 9 × 4 = 36%.',
            },
            {
              id: 'pk-2-2-e2',
              tipo: 'opcion_unica',
              pregunta: 'En el turn tienes 8 outs. ¿Qué probabilidad aproximada tienes de completar tu jugada?',
              opciones: ['8%', '16%', '32%', '40%'],
              correcta: 1,
              explicacion: 'En el turn solo falta una carta y se multiplica por 2: 8 × 2 = 16%.',
            },
            {
              id: 'pk-2-2-e3',
              tipo: 'opcion_unica',
              pregunta: 'En el flop tienes 4 outs. ¿Qué probabilidad aproximada tienes?',
              opciones: ['8%', '16%', '20%', '4%'],
              correcta: 1,
              explicacion: '4 outs × 4 = 16%.',
            },
            {
              id: 'pk-2-2-e4',
              tipo: 'opcion_unica',
              pregunta: 'En el turn tienes 9 outs. ¿Qué probabilidad aproximada tienes?',
              opciones: ['9%', '18%', '36%', '45%'],
              correcta: 1,
              explicacion: '9 outs × 2 = 18%.',
            },
            {
              id: 'pk-2-2-e5',
              tipo: 'opcion_unica',
              pregunta: '¿Por cuánto multiplicas tus outs en el flop?',
              opciones: ['1', '2', '4', '5'],
              correcta: 2,
              explicacion: 'En el flop faltan dos cartas por salir, así que se multiplica por 4.',
            },
            {
              id: 'pk-2-2-e6',
              tipo: 'opcion_unica',
              pregunta: 'En el flop tienes 12 outs. ¿Qué probabilidad aproximada tienes?',
              opciones: ['24%', '36%', '48%', '60%'],
              correcta: 2,
              explicacion: '12 outs × 4 = 48%.',
            },
            {
              id: 'pk-2-2-e7',
              tipo: 'opcion_unica',
              pregunta: '¿Por cuánto multiplicas tus outs en el turn?',
              opciones: ['2', '3', '4', '8'],
              correcta: 0,
              explicacion: 'En el turn solo falta una carta, así que se multiplica por 2.',
            },
          ],
        },
      ],
    },

    {
      id: 'pk-u3',
      titulo: 'Decisiones',
      descripcion: 'Manos iniciales, posición y rentabilidad',
      lecciones: [
        {
          id: 'pk-3-1',
          titulo: 'Manos iniciales y posición',
          icono: '♟️',
          xp: 15,
          intro:
            'Las manos iniciales fuertes (pareja de ases, de reyes, A-K) ganan más a largo plazo. La posición también cuenta: actuar al final de la ronda te deja ver lo que hacen los demás antes de decidir.',
          ejercicios: [
            {
              id: 'pk-3-1-e1',
              tipo: 'opcion_unica',
              pregunta: '¿Cuál es la mejor mano inicial en Hold\'em?',
              opciones: ['Pareja de ases', 'A-K del mismo palo', 'Pareja de reyes', 'J-10 del mismo palo'],
              correcta: 0,
              explicacion: 'La pareja de ases es la mano inicial más fuerte de todas.',
            },
            {
              id: 'pk-3-1-e2',
              tipo: 'opcion_unica',
              pregunta: '¿Cuál de estas es una de las peores manos iniciales?',
              opciones: [
                'A-K del mismo palo',
                '7-2 de distinto palo',
                'Pareja de doses',
                'J-10 del mismo palo',
              ],
              correcta: 1,
              explicacion: 'El 7-2 de distinto palo no forma pareja, escalera ni color con facilidad: es de las peores.',
            },
            {
              id: 'pk-3-1-e3',
              tipo: 'opcion_unica',
              pregunta: '¿Qué ventaja tiene actuar el último en una ronda?',
              opciones: [
                'Ves lo que hacen los demás antes de decidir',
                'Recibes cartas mejores',
                'No tienes que pagar',
                'Puedes ver las cartas de los demás',
              ],
              correcta: 0,
              explicacion: 'Con más información decides mejor. Por eso la posición vale tanto en el póker.',
            },
            {
              id: 'pk-3-1-e4',
              tipo: 'opcion_unica',
              pregunta: '¿Cómo se llama la ficha que marca quién reparte y actúa último tras el flop?',
              opciones: ['Botón', 'Ciega', 'Ante', 'Kicker'],
              correcta: 0,
              explicacion: 'Es el botón del dealer. Quien lo tiene actúa el último en las rondas posteriores al flop.',
            },
          ],
        },
        {
          id: 'pk-3-2',
          titulo: 'Pot odds',
          icono: '💰',
          xp: 20,
          intro:
            'Las pot odds comparan lo que tienes que pagar con lo que puedes ganar. Fórmula: lo que pagas ÷ (bote + lo que pagas). Si tu probabilidad de ganar es mayor que ese porcentaje, pagar compensa a largo plazo.',
          ejercicios: [
            {
              id: 'pk-3-2-e1',
              tipo: 'opcion_unica',
              pregunta:
                'El bote tiene 100 fichas (con la apuesta de tu rival incluida) y debes pagar 25. ¿Qué porcentaje de victoria necesitas?',
              opciones: ['10%', '20%', '25%', '50%'],
              correcta: 1,
              explicacion: '25 ÷ (100 + 25) = 25 ÷ 125 = 20%.',
            },
            {
              id: 'pk-3-2-e2',
              tipo: 'opcion_unica',
              pregunta:
                'El bote tiene 60 fichas (con la apuesta de tu rival incluida) y debes pagar 20. ¿Qué porcentaje de victoria necesitas?',
              opciones: ['20%', '25%', '33%', '50%'],
              correcta: 1,
              explicacion: '20 ÷ (60 + 20) = 20 ÷ 80 = 25%.',
            },
            {
              id: 'pk-3-2-e3',
              tipo: 'opcion_unica',
              pregunta:
                'El bote tiene 90 fichas (con la apuesta de tu rival incluida) y debes pagar 10. ¿Qué porcentaje de victoria necesitas?',
              opciones: ['10%', '11%', '20%', '25%'],
              correcta: 0,
              explicacion: '10 ÷ (90 + 10) = 10 ÷ 100 = 10%. Ojo: se divide entre el bote más lo que pagas.',
            },
            {
              id: 'pk-3-2-e4',
              tipo: 'opcion_unica',
              pregunta:
                'El bote tiene 40 fichas (con la apuesta de tu rival incluida) y debes pagar 40. ¿Qué porcentaje de victoria necesitas?',
              opciones: ['25%', '33%', '50%', '100%'],
              correcta: 2,
              explicacion: '40 ÷ (40 + 40) = 40 ÷ 80 = 50%.',
            },
            {
              id: 'pk-3-2-e5',
              tipo: 'opcion_unica',
              pregunta:
                'Necesitas un 25% para que pagar compense y tienes 9 outs en el flop (≈ 36%). ¿Pagar es rentable?',
              opciones: [
                'Sí, tu probabilidad es mayor que la necesaria',
                'No, necesitas el doble',
                'Solo si ya tienes pareja',
                'Depende del palo de tus cartas',
              ],
              correcta: 0,
              explicacion: 'Tu 36% supera el 25% que necesitas, así que pagar es rentable a largo plazo.',
            },
            {
              id: 'pk-3-2-e6',
              tipo: 'opcion_unica',
              pregunta:
                'Necesitas un 33% para que pagar compense y tienes 4 outs en el flop (≈ 16%). ¿Pagar es rentable?',
              opciones: [
                'Sí, siempre',
                'No, tu probabilidad es menor que la necesaria',
                'Solo en el river',
                'Sí, porque 4 es un buen número',
              ],
              correcta: 1,
              explicacion: 'Tu 16% no llega al 33% que necesitas, así que a largo plazo perderías fichas.',
            },
          ],
        },
      ],
    },
  ],
});
