// Póker: niveles adicionales (se añaden al curso que crea data/poker.js).
// Mismo formato que data/poker.js. Las fichas son solo para practicar: no hay dinero real.

{
  const curso = CURSOS.find((c) => c.id === 'poker');

  curso.unidades.push(
    // ------------------------------------------------------------
    // Unidad 4: la mesa
    // ------------------------------------------------------------
    {
      id: 'pk-u4',
      titulo: 'La mesa',
      descripcion: 'Ciegas, posiciones y rondas de apuestas',
      lecciones: [
        {
          id: 'pk-4-1',
          titulo: 'Ciegas y botón',
          icono: '🔘',
          xp: 15,
          intro:
            'Antes de repartir, dos jugadores ponen apuestas obligatorias: la ciega pequeña y la ciega grande. Así siempre hay algo que ganar. El botón (el que reparte) se mueve un asiento a la izquierda cada mano, para que todos paguen las ciegas por turnos.',
          ejercicios: [
            {
              id: 'pk-4-1-e1',
              tipo: 'opcion_unica',
              pregunta: '¿Quién pone la ciega pequeña?',
              opciones: [
                'El jugador a la izquierda del botón',
                'El botón',
                'El jugador a la derecha del botón',
                'El que tiene mejor mano',
              ],
              correcta: 0,
              explicacion: 'La ciega pequeña la pone el jugador inmediatamente a la izquierda del botón, y la grande el siguiente.',
            },
            {
              id: 'pk-4-1-e2',
              tipo: 'opcion_unica',
              pregunta: '¿Cuánto vale normalmente la ciega grande?',
              opciones: ['El doble de la pequeña', 'Lo mismo que la pequeña', 'La mitad', 'Diez veces la pequeña'],
              correcta: 0,
              explicacion: 'Lo habitual es que la ciega grande sea el doble de la pequeña (por ejemplo 1 y 2).',
            },
            {
              id: 'pk-4-1-e3',
              tipo: 'opcion_unica',
              pregunta: '¿Para qué sirven las ciegas?',
              opciones: [
                'Para que siempre haya fichas en juego y se mueva la acción',
                'Para pagar al crupier',
                'Para ver el flop gratis',
                'Para decidir quién reparte',
              ],
              correcta: 0,
              explicacion: 'Sin ciegas, todos podrían esperar a tener una mano perfecta. Las ciegas obligan a jugar.',
            },
            {
              id: 'pk-4-1-e4',
              tipo: 'opcion_unica',
              pregunta: '¿Qué hace el botón al acabar cada mano?',
              opciones: [
                'Se mueve un asiento a la izquierda',
                'Se queda siempre en el mismo sitio',
                'Pasa al ganador de la mano',
                'Se elige al azar',
              ],
              correcta: 0,
              explicacion: 'El botón rota en el sentido de las agujas del reloj, un asiento por mano.',
            },
            {
              id: 'pk-4-1-e5',
              tipo: 'opcion_unica',
              pregunta: 'En una mesa con varios jugadores, ¿quién habla primero antes del flop?',
              opciones: [
                'El jugador a la izquierda de la ciega grande',
                'La ciega pequeña',
                'El botón',
                'La ciega grande',
              ],
              correcta: 0,
              explicacion: 'Antes del flop empieza el jugador situado justo después de la ciega grande. Las ciegas hablan al final.',
            },
            {
              id: 'pk-4-1-e6',
              tipo: 'opcion_unica',
              pregunta: 'Después del flop, ¿quién habla primero?',
              opciones: [
                'El primer jugador activo a la izquierda del botón',
                'El botón',
                'Siempre la ciega grande',
                'El que apostó antes del flop',
              ],
              correcta: 0,
              explicacion: 'Desde el flop se empieza por la izquierda del botón y el botón habla el último.',
            },
          ],
        },
        {
          id: 'pk-4-2',
          titulo: 'La ventaja de hablar último',
          icono: '📍',
          xp: 15,
          intro:
            'La posición es cuándo te toca hablar. Hablar el último es una gran ventaja: ves lo que hacen los demás antes de decidir. Por eso el botón es el mejor sitio, y las ciegas son los peores después del flop, porque hablan los primeros.',
          ejercicios: [
            {
              id: 'pk-4-2-e1',
              tipo: 'opcion_unica',
              pregunta: '¿Cuál es la mejor posición después del flop?',
              opciones: [
                'El botón',
                'La ciega pequeña',
                'El jugador a la izquierda de la ciega grande',
                'La ciega grande',
              ],
              correcta: 0,
              explicacion: 'El botón habla el último en todas las rondas después del flop: tiene más información que nadie.',
            },
            {
              id: 'pk-4-2-e2',
              tipo: 'opcion_unica',
              pregunta: '¿Por qué es una ventaja hablar el último?',
              opciones: [
                'Porque ves lo que hacen los demás antes de decidir',
                'Porque recibes mejores cartas',
                'Porque pagas menos ciegas',
                'Porque puedes ver las cartas del rival',
              ],
              correcta: 0,
              explicacion: 'La información es poder: si todos pasan, sabes que sus manos son flojas.',
            },
            {
              id: 'pk-4-2-e3',
              tipo: 'opcion_unica',
              pregunta: 'Con una mano mediocre, ¿dónde la puedes jugar con más facilidad?',
              opciones: ['En el botón', 'Desde las primeras posiciones', 'Da igual dónde', 'Solo desde la ciega'],
              correcta: 0,
              explicacion: 'Desde posición tardía hay menos jugadores por hablar detrás de ti, y esa ventaja compensa una mano mediocre.',
            },
            {
              id: 'pk-4-2-e4',
              tipo: 'opcion_unica',
              pregunta: '¿Qué significa «posición temprana» (UTG)?',
              opciones: [
                'Hablar de los primeros antes del flop: conviene jugar manos más fuertes',
                'Estar sentado frente al crupier',
                'Ser el botón',
                'Ser el último en hablar',
              ],
              correcta: 0,
              explicacion: 'En posición temprana tienes a muchos jugadores por hablar detrás de ti, así que conviene ser más selectivo.',
            },
            {
              id: 'pk-4-2-e5',
              tipo: 'opcion_unica',
              pregunta: 'Si todos pasan antes que tú y estás en el botón, ¿qué suele indicar?',
              opciones: [
                'Que sus manos probablemente no son fuertes',
                'Que todos tienen escalera',
                'Que debes retirarte',
                'Que has perdido la mano',
              ],
              correcta: 0,
              explicacion: 'Ver que todos pasan te da información para apostar con más confianza.',
            },
          ],
        },
        {
          id: 'pk-4-3',
          titulo: 'Rondas de apuestas',
          icono: '🔄',
          xp: 15,
          intro:
            'Hay cuatro rondas de apuestas: antes del flop, flop, turn y river. En tu turno puedes pasar (check) si nadie ha apostado, apostar (bet), igualar (call), subir (raise) o retirarte (fold). All-in es apostar todas tus fichas.',
          ejercicios: [
            {
              id: 'pk-4-3-e1',
              tipo: 'opcion_unica',
              pregunta: '¿Cuándo puedes hacer check (pasar)?',
              opciones: [
                'Cuando nadie ha apostado en esa ronda',
                'Siempre',
                'Solo en el river',
                'Cuando tienes pareja',
              ],
              correcta: 0,
              explicacion: 'Pasar significa no apostar y seguir en la mano, y solo se puede si nadie ha apostado antes.',
            },
            {
              id: 'pk-4-3-e2',
              tipo: 'opcion_unica',
              pregunta: 'Un rival apuesta 10 y tú pones 10. ¿Cómo se llama eso?',
              opciones: ['Call (igualar)', 'Raise (subir)', 'Check', 'Fold'],
              correcta: 0,
              explicacion: 'Igualar la apuesta del rival se llama call.',
            },
            {
              id: 'pk-4-3-e3',
              tipo: 'opcion_unica',
              pregunta: 'Un rival apuesta 10 y tú pones 30. ¿Cómo se llama eso?',
              opciones: ['Raise (subir)', 'Call (igualar)', 'Check', 'Fold'],
              correcta: 0,
              explicacion: 'Poner más que la apuesta anterior es subir (raise).',
            },
            {
              id: 'pk-4-3-e4',
              tipo: 'opcion_unica',
              pregunta: '¿Cuántas rondas de apuestas puede tener como máximo una mano?',
              opciones: ['4', '2', '3', '5'],
              correcta: 0,
              explicacion: 'Antes del flop, flop, turn y river.',
            },
            {
              id: 'pk-4-3-e5',
              tipo: 'opcion_unica',
              pregunta: '¿Qué es el showdown?',
              opciones: [
                'El momento final en que se enseñan las cartas para ver quién gana',
                'El reparto inicial',
                'La primera ronda de apuestas',
                'Una apuesta con todas las fichas',
              ],
              correcta: 0,
              explicacion: 'Si quedan dos o más jugadores tras la última ronda, se enseñan las cartas y gana la mejor mano.',
            },
            {
              id: 'pk-4-3-e6',
              tipo: 'opcion_unica',
              pregunta: 'Si todos se retiran menos tú, ¿tienes que enseñar tus cartas?',
              opciones: [
                'No: ganas el bote sin enseñarlas',
                'Sí, siempre',
                'Solo si tenías pareja',
                'Solo si es en el river',
              ],
              correcta: 0,
              explicacion: 'Si nadie te iguala, ganas el bote sin showdown: tus cartas son un secreto.',
            },
          ],
        },
      ],
    },

    // ------------------------------------------------------------
    // Unidad 5: probabilidades
    // ------------------------------------------------------------
    {
      id: 'pk-u5',
      titulo: 'Probabilidades',
      descripcion: 'Las matemáticas del póker',
      lecciones: [
        {
          id: 'pk-5-1',
          titulo: 'Manos iniciales',
          icono: '🎲',
          xp: 20,
          intro:
            'Con 2 cartas hay 1.326 combinaciones posibles. Saber lo raras que son te ayuda a valorar tu mano: por ejemplo, la pareja de ases solo se forma de 6 maneras distintas entre 1.326.',
          ejercicios: [
            {
              id: 'pk-5-1-e1',
              tipo: 'opcion_unica',
              pregunta: '¿Cuántas combinaciones distintas de 2 cartas se pueden formar con una baraja de 52?',
              opciones: ['1.326', '52', '2.704', '2.652'],
              correcta: 0,
              explicacion: '52 × 51 ÷ 2 = 1.326 (se divide entre 2 porque el orden de las dos cartas no importa).',
            },
            {
              id: 'pk-5-1-e2',
              tipo: 'opcion_unica',
              pregunta: '¿De cuántas maneras distintas se puede formar la pareja de ases?',
              opciones: ['6', '4', '12', '2'],
              correcta: 0,
              explicacion: 'Hay 4 ases y se eligen 2 de ellos: 6 combinaciones (A♠A♥, A♠A♦, A♠A♣, A♥A♦, A♥A♣, A♦A♣).',
            },
            {
              id: 'pk-5-1-e3',
              tipo: 'opcion_unica',
              pregunta: '¿Con qué frecuencia te toca la pareja de ases en la mano?',
              opciones: ['1 de cada 221 manos (≈ 0,45 %)', '1 de cada 20 manos', '1 de cada 100 manos', '1 de cada 1.326 manos'],
              correcta: 0,
              explicacion: '1.326 ÷ 6 = 221. Es poco frecuente, ¡disfrútala cuando llegue!',
            },
            {
              id: 'pk-5-1-e4',
              tipo: 'opcion_unica',
              pregunta: '¿Con qué probabilidad te toca una pareja (cualquiera) en la mano?',
              opciones: ['≈ 6 % (1 de cada 17)', '≈ 1 %', '≈ 20 %', '≈ 50 %'],
              correcta: 0,
              explicacion: '13 rangos × 6 combinaciones = 78 parejas entre 1.326 manos = 5,9 %.',
            },
            {
              id: 'pk-5-1-e5',
              tipo: 'opcion_unica',
              pregunta: '¿Con qué probabilidad tus dos cartas son del mismo palo?',
              opciones: ['≈ 24 %', '≈ 5 %', '≈ 50 %', '≈ 10 %'],
              correcta: 0,
              explicacion: 'Tu segunda carta es del mismo palo que la primera en 12 de las 51 cartas restantes: 12 ÷ 51 = 23,5 %.',
            },
            {
              id: 'pk-5-1-e6',
              tipo: 'opcion_unica',
              pregunta: '¿Con qué probabilidad te toca A-K (de cualquier palo)?',
              opciones: ['≈ 1,2 %', '≈ 6 %', '≈ 0,5 %', '≈ 4 %'],
              correcta: 0,
              explicacion: '4 ases × 4 reyes = 16 combinaciones entre 1.326: 1,2 %.',
            },
            {
              id: 'pk-5-1-e7',
              tipo: 'opcion_unica',
              pregunta: 'Aunque la pareja de ases es la mejor mano inicial, ¿gana siempre?',
              opciones: [
                'No: puede perder, aunque pierde menos que cualquier otra mano',
                'Sí, siempre gana',
                'Solo pierde contra otra pareja de ases',
                'Solo gana si hay flop',
              ],
              correcta: 0,
              explicacion: 'Es la favorita contra cualquier mano, pero las cartas comunes pueden darle la vuelta.',
            },
          ],
        },
        {
          id: 'pk-5-2',
          titulo: 'Outs de verdad',
          icono: '🎯',
          xp: 20,
          intro:
            'Los outs más comunes: proyecto de color (9), escalera abierta (8), escalera de pulmón o gutshot (4), dos cartas altas sin emparejar (6) y color más escalera abierta (15). Multiplica por 4 en el flop o por 2 en el turn.',
          ejercicios: [
            {
              id: 'pk-5-2-e1',
              tipo: 'opcion_unica',
              situacion: {
                filas: [
                  { etiqueta: 'Tu mano', cartas: ['9♠', '8♠'] },
                  { etiqueta: 'Mesa', cartas: ['7♣', '6♦', 'K♥'] },
                ],
              },
              pregunta: 'Necesitas un 10 o un 5 para hacer escalera. ¿Cuántos outs tienes?',
              opciones: ['8', '4', '6', '9'],
              correcta: 0,
              explicacion: 'Quedan 4 dieces y 4 cincos: 8 outs (una escalera abierta).',
            },
            {
              id: 'pk-5-2-e2',
              tipo: 'opcion_unica',
              situacion: {
                filas: [
                  { etiqueta: 'Tu mano', cartas: ['5♣', '6♦'] },
                  { etiqueta: 'Mesa', cartas: ['8♠', '9♥', 'K♣'] },
                ],
              },
              pregunta: 'Solo un 7 te completa la escalera. ¿Cuántos outs tienes?',
              opciones: ['4', '8', '3', '2'],
              correcta: 0,
              explicacion: 'Quedan 4 sietes: es una escalera «de pulmón» (gutshot) con 4 outs.',
            },
            {
              id: 'pk-5-2-e3',
              tipo: 'opcion_unica',
              situacion: {
                filas: [
                  { etiqueta: 'Tu mano', cartas: ['A♦', 'Q♣'] },
                  { etiqueta: 'Mesa', cartas: ['7♠', '3♥', '9♣'] },
                ],
              },
              pregunta: 'No tienes nada, pero un as o una dama te daría la pareja más alta. ¿Cuántos outs tienes?',
              opciones: ['6', '8', '4', '3'],
              correcta: 0,
              explicacion: 'Quedan 3 ases y 3 damas: 6 outs.',
            },
            {
              id: 'pk-5-2-e4',
              tipo: 'opcion_unica',
              pregunta: 'En el flop tienes 9 outs. ¿Qué probabilidad aproximada hay de completar tu mano para el river?',
              opciones: ['18%', '27%', '36%', '45%'],
              correcta: 2,
              explicacion: 'En el flop se multiplica por 4: 9 × 4 = 36 %. Con dos cartas por venir, la probabilidad es casi el doble.',
            },
            {
              id: 'pk-5-2-e5',
              tipo: 'opcion_unica',
              pregunta: 'En el turn tienes 6 outs. ¿Qué probabilidad aproximada hay de completar tu mano en el river?',
              opciones: ['12%', '24%', '6%', '30%'],
              correcta: 0,
              explicacion: 'En el turn solo queda una carta y se multiplica por 2: 6 × 2 = 12 %.',
            },
            {
              id: 'pk-5-2-e6',
              tipo: 'opcion_unica',
              pregunta: 'Con 15 outs en el flop (color + escalera abierta) la regla del 4 da 60 %. ¿Cómo es la probabilidad real?',
              opciones: ['Algo menor (≈ 54 %)', 'Algo mayor (≈ 70 %)', 'Exactamente 60 %', 'Mucho menor (≈ 30 %)'],
              correcta: 0,
              explicacion: 'Con muchos outs la regla del 4 se pasa un poco. El cálculo exacto da un 54 %, que sigue siendo ¡más de la mitad!',
            },
          ],
        },
      ],
    },

    // ------------------------------------------------------------
    // Unidad 6: leer la mesa
    // ------------------------------------------------------------
    {
      id: 'pk-u6',
      titulo: 'Leer la mesa',
      descripcion: 'Quién gana, tu mejor mano y estilos de juego',
      lecciones: [
        {
          id: 'pk-6-1',
          titulo: '¿Quién gana?',
          icono: '⚖️',
          xp: 25,
          intro:
            'Al final de la mano se comparan las mejores cinco cartas de cada jugador (entre las 7 disponibles). Si la categoría es la misma, mandan las cartas más altas, y después el kicker: la carta que desempata. A veces hay empate y se reparte el bote.',
          ejercicios: [
            {
              id: 'pk-6-1-e1',
              tipo: 'opcion_unica',
              situacion: {
                filas: [
                  { etiqueta: 'Tu mano', cartas: ['A♠', 'K♦'] },
                  { etiqueta: 'Rival', cartas: ['A♣', 'Q♦'] },
                  { etiqueta: 'Mesa', cartas: ['A♥', '7♣', '4♦', '9♠', '2♣'] },
                ],
              },
              pregunta: '¿Quién gana la mano?',
              opciones: ['Tú', 'Tu rival', 'Empate'],
              correcta: 0,
              explicacion: 'Los dos tenéis pareja de ases, pero tu kicker (K) es más alto que el del rival (Q).',
            },
            {
              id: 'pk-6-1-e2',
              tipo: 'opcion_unica',
              situacion: {
                filas: [
                  { etiqueta: 'Tu mano', cartas: ['2♣', '3♦'] },
                  { etiqueta: 'Rival', cartas: ['4♠', '5♦'] },
                  { etiqueta: 'Mesa', cartas: ['A♠', 'K♠', 'Q♦', 'J♦', '10♥'] },
                ],
              },
              pregunta: '¿Quién gana la mano?',
              opciones: ['Tú', 'Tu rival', 'Empate'],
              correcta: 2,
              explicacion: 'La mesa ya tiene una escalera al as (A-K-Q-J-10) y ninguna de vuestras cartas la mejora: empate.',
            },
            {
              id: 'pk-6-1-e3',
              tipo: 'opcion_unica',
              situacion: {
                filas: [
                  { etiqueta: 'Tu mano', cartas: ['9♥', '3♥'] },
                  { etiqueta: 'Rival', cartas: ['8♠', '7♦'] },
                  { etiqueta: 'Mesa', cartas: ['6♥', '5♣', '4♥', 'K♥', '2♥'] },
                ],
              },
              pregunta: '¿Quién gana la mano?',
              opciones: ['Tu rival', 'Tú', 'Empate'],
              correcta: 1,
              explicacion: 'Tú tienes color de corazones. Tu rival tiene una escalera (4-5-6-7-8), pero el color le gana a la escalera.',
            },
            {
              id: 'pk-6-1-e4',
              tipo: 'opcion_unica',
              situacion: {
                filas: [
                  { etiqueta: 'Tu mano', cartas: ['K♠', 'K♦'] },
                  { etiqueta: 'Rival', cartas: ['9♠', '4♦'] },
                  { etiqueta: 'Mesa', cartas: ['K♥', '9♣', '9♦', '4♠', '2♥'] },
                ],
              },
              pregunta: '¿Quién gana la mano?',
              opciones: ['Tú', 'Tu rival', 'Empate'],
              correcta: 0,
              explicacion: 'Los dos tenéis full house. El tuyo es de reyes con nueves (KKK-99) y el del rival de nueves con cuatros (999-44): gana el trío más alto.',
            },
            {
              id: 'pk-6-1-e5',
              tipo: 'opcion_unica',
              situacion: {
                filas: [
                  { etiqueta: 'Tu mano', cartas: ['Q♣', 'Q♦'] },
                  { etiqueta: 'Rival', cartas: ['A♥', '3♠'] },
                  { etiqueta: 'Mesa', cartas: ['A♣', '9♦', '3♦', '7♠', 'J♣'] },
                ],
              },
              pregunta: '¿Quién gana la mano?',
              opciones: ['Tú', 'Empate', 'Tu rival'],
              correcta: 2,
              explicacion: 'Tu rival tiene doble pareja (ases y treses) y tú solo una pareja de damas.',
            },
            {
              id: 'pk-6-1-e6',
              tipo: 'opcion_unica',
              situacion: {
                filas: [
                  { etiqueta: 'Tu mano', cartas: ['A♦', '2♣'] },
                  { etiqueta: 'Rival', cartas: ['A♥', '3♣'] },
                  { etiqueta: 'Mesa', cartas: ['A♠', 'K♣', '9♦', '8♥', '7♠'] },
                ],
              },
              pregunta: '¿Quién gana la mano?',
              opciones: ['Tú', 'Tu rival', 'Empate'],
              correcta: 2,
              explicacion: 'Los dos juegan pareja de ases con K-9-8 de kickers de la mesa. Vuestros 2 y 3 no cuentan: empate.',
            },
          ],
        },
        {
          id: 'pk-6-2',
          titulo: 'Tu mejor mano',
          icono: '🔍',
          xp: 25,
          intro:
            'Con 7 cartas (2 tuyas y 5 de la mesa) tienes que encontrar tu mejor jugada de 5. De mejor a peor: escalera de color, póker, full house, color, escalera, trío, doble pareja, pareja y carta alta.',
          ejercicios: [
            {
              id: 'pk-6-2-e1',
              tipo: 'opcion_unica',
              situacion: {
                filas: [
                  { etiqueta: 'Tu mano', cartas: ['5♠', '6♠'] },
                  { etiqueta: 'Mesa', cartas: ['7♠', '8♠', '9♠', 'K♦', '2♥'] },
                ],
              },
              pregunta: '¿Qué mano tienes?',
              opciones: ['Escalera de color', 'Color', 'Escalera', 'Póker'],
              correcta: 0,
              explicacion: 'Del 5 al 9 y todas de picas: escalera de color, la mejor mano posible aparte de la escalera real.',
            },
            {
              id: 'pk-6-2-e2',
              tipo: 'opcion_unica',
              situacion: {
                filas: [
                  { etiqueta: 'Tu mano', cartas: ['A♣', 'A♦'] },
                  { etiqueta: 'Mesa', cartas: ['A♥', 'K♠', 'K♦', '3♣', '8♥'] },
                ],
              },
              pregunta: '¿Qué mano tienes?',
              opciones: ['Doble pareja', 'Trío', 'Full house', 'Póker'],
              correcta: 2,
              explicacion: 'Tres ases y dos reyes: full house (ases llenos de reyes).',
            },
            {
              id: 'pk-6-2-e3',
              tipo: 'opcion_unica',
              situacion: {
                filas: [
                  { etiqueta: 'Tu mano', cartas: ['9♦', '9♣'] },
                  { etiqueta: 'Mesa', cartas: ['9♥', '9♠', '2♦', 'K♣', '5♥'] },
                ],
              },
              pregunta: '¿Qué mano tienes?',
              opciones: ['Full house', 'Póker', 'Trío', 'Doble pareja'],
              correcta: 1,
              explicacion: 'Cuatro nueves: póker.',
            },
            {
              id: 'pk-6-2-e4',
              tipo: 'opcion_unica',
              situacion: {
                filas: [
                  { etiqueta: 'Tu mano', cartas: ['Q♥', 'J♥'] },
                  { etiqueta: 'Mesa', cartas: ['10♠', '9♦', '8♣', '2♠', '2♦'] },
                ],
              },
              pregunta: '¿Qué mano tienes?',
              opciones: ['Pareja', 'Color', 'Escalera', 'Carta alta'],
              correcta: 2,
              explicacion: 'Del 8 a la dama: escalera. Aunque la mesa tenga pareja de doses, la escalera vale más.',
            },
            {
              id: 'pk-6-2-e5',
              tipo: 'opcion_unica',
              situacion: {
                filas: [
                  { etiqueta: 'Tu mano', cartas: ['A♥', '5♥'] },
                  { etiqueta: 'Mesa', cartas: ['K♥', '9♥', '2♥', '3♣', '3♦'] },
                ],
              },
              pregunta: '¿Qué mano tienes?',
              opciones: ['Color', 'Pareja', 'Doble pareja', 'Escalera'],
              correcta: 0,
              explicacion: 'Cinco corazones: color. Aunque haya pareja de treses en la mesa, el color vale más.',
            },
            {
              id: 'pk-6-2-e6',
              tipo: 'opcion_unica',
              situacion: {
                filas: [
                  { etiqueta: 'Tu mano', cartas: ['7♣', '7♦'] },
                  { etiqueta: 'Mesa', cartas: ['4♠', '4♥', 'A♦', '9♣', '2♠'] },
                ],
              },
              pregunta: '¿Qué mano tienes?',
              opciones: ['Pareja', 'Doble pareja', 'Trío', 'Full house'],
              correcta: 1,
              explicacion: 'Pareja de sietes y pareja de cuatros: doble pareja.',
            },
            {
              id: 'pk-6-2-e7',
              tipo: 'opcion_unica',
              situacion: {
                filas: [
                  { etiqueta: 'Tu mano', cartas: ['K♦', '8♣'] },
                  { etiqueta: 'Mesa', cartas: ['3♥', '4♠', '9♦', 'J♣', '2♦'] },
                ],
              },
              pregunta: '¿Qué mano tienes?',
              opciones: ['Escalera', 'Pareja', 'Carta alta', 'Trío'],
              correcta: 2,
              explicacion: 'Ninguna carta se repite, no hay cinco seguidas ni cinco del mismo palo: solo tienes carta alta (el rey).',
            },
            {
              id: 'pk-6-2-e8',
              tipo: 'opcion_unica',
              situacion: {
                filas: [
                  { etiqueta: 'Tu mano', cartas: ['6♦', '6♠'] },
                  { etiqueta: 'Mesa', cartas: ['6♣', 'K♥', '9♠', '2♦', '4♣'] },
                ],
              },
              pregunta: '¿Qué mano tienes?',
              opciones: ['Trío', 'Pareja', 'Full house', 'Póker'],
              correcta: 0,
              explicacion: 'Tres seises y nada más que emparejar: trío.',
            },
          ],
        },
        {
          id: 'pk-6-3',
          titulo: 'Valor, farol y estilos',
          icono: '🎭',
          xp: 20,
          intro:
            'No solo importa tu mano: importa cómo juegas. Se apuesta por valor cuando se tiene una mano fuerte y se quiere que te paguen, y se hace un farol cuando se apuesta con una mano floja para que el rival se retire. Cada jugador tiene su estilo.',
          ejercicios: [
            {
              id: 'pk-6-3-e1',
              tipo: 'opcion_unica',
              pregunta: 'Apostar con una mano fuerte para que te paguen se llama…',
              opciones: ['Apuesta de valor', 'Farol', 'Fold', 'Showdown'],
              correcta: 0,
              explicacion: 'Apuestas «por valor» porque esperas que una mano peor te pague.',
            },
            {
              id: 'pk-6-3-e2',
              tipo: 'opcion_unica',
              pregunta: 'Apostar con una mano floja para que el rival se retire se llama…',
              opciones: ['Farol (bluff)', 'Apuesta de valor', 'Call', 'Check'],
              correcta: 0,
              explicacion: 'Un farol intenta ganar el bote haciendo creer al rival que tienes una buena mano.',
            },
            {
              id: 'pk-6-3-e3',
              tipo: 'opcion_unica',
              pregunta: 'Un «semi-farol» es…',
              opciones: [
                'Apostar con una mano que todavía puede mejorar (un proyecto)',
                'Apostar siempre la mitad del bote',
                'Apostar con la mejor mano',
                'Retirarse a tiempo',
              ],
              correcta: 0,
              explicacion: 'Con un proyecto ganas de dos maneras: si el rival se retira o si completas tu mano.',
            },
            {
              id: 'pk-6-3-e4',
              tipo: 'opcion_unica',
              pregunta: 'Un jugador «tight» (cerrado) es el que…',
              opciones: [
                'Juega pocas manos y muy selectas',
                'Juega casi todas las manos',
                'Solo hace faroles',
                'Solo juega con ases',
              ],
              correcta: 0,
              explicacion: 'Tight = selectivo. Lo contrario es «loose», que juega muchas manos.',
            },
            {
              id: 'pk-6-3-e5',
              tipo: 'opcion_unica',
              pregunta: 'Un jugador «agresivo» tiende a…',
              opciones: [
                'Apostar y subir más que igualar',
                'Retirarse siempre',
                'Pasar e igualar casi siempre',
                'Jugar solo desde el botón',
              ],
              correcta: 0,
              explicacion: 'La agresividad (apostar y subir) suele ser mejor que la pasividad (pasar e igualar), porque puedes ganar sin llegar al showdown.',
            },
          ],
        },
      ],
    }
  );
}
