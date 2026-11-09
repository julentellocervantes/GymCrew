// Mus: niveles adicionales (se añaden al curso que crea data/mus.js).
// Mismo formato que data/mus.js. Modalidad de 8 reyes: los treses valen como reyes y los doses como ases.
// Algunas reglas del mus cambian de una zona a otra: aquí se enseñan las más habituales.

{
  const curso = CURSOS.find((c) => c.id === 'mus');

  curso.unidades.push({
    id: 'ms-u3',
    titulo: 'A la mesa',
    descripcion: 'Hablar, descartar, puntuar y comparar manos',
    lecciones: [
      {
        id: 'ms-3-1',
        titulo: 'Hablar en la mesa',
        icono: '🗣️',
        xp: 15,
        intro:
          'En cada lance hablas por turnos. Puedes decir «paso» (no apuestas), «envido» (apuestas 2 piedras), «más» (subes la apuesta), «quiero» (aceptas) o «no quiero» (te retiras del lance). El «órdago» es apostar todo lo que falta para ganar la partida.',
        ejercicios: [
          {
            id: 'ms-3-1-e1',
            tipo: 'opcion_unica',
            pregunta: '¿Qué significa «paso»?',
            opciones: [
              'No apuesto en este lance',
              'Me retiro de la partida',
              'Acepto la apuesta del rival',
              'Apuesto todo lo que tengo',
            ],
            correcta: 0,
            explicacion: '«Paso» es no apostar. Si todos pasan, el lance se juega sin envites y gana la mejor mano.',
          },
          {
            id: 'ms-3-1-e2',
            tipo: 'opcion_unica',
            pregunta: 'Un rival envida 2 piedras y tú dices «quiero». ¿Qué ocurre?',
            opciones: [
              'Se comparan las manos y quien gane el lance se lleva lo apostado',
              'Gana el que envidó',
              'Se anula el lance',
              'Pierdes la partida',
            ],
            correcta: 0,
            explicacion: '«Quiero» significa aceptar el envite: se enseñan las cartas y gana la mejor mano.',
          },
          {
            id: 'ms-3-1-e3',
            tipo: 'opcion_unica',
            pregunta: 'Un rival envida y tú dices «no quiero». ¿Qué ocurre?',
            opciones: [
              'El rival se lleva el lance sin enseñar las cartas',
              'Se enseñan las cartas igualmente',
              'Te llevas tú el lance',
              'Se repite la mano',
            ],
            correcta: 0,
            explicacion: 'Si no aceptas, te retiras de ese lance y el equipo que envidó se lo lleva sin enseñar nada.',
          },
          {
            id: 'ms-3-1-e4',
            tipo: 'opcion_unica',
            pregunta: '¿Qué es un «órdago»?',
            opciones: [
              'Apostar todo lo que falta para ganar la partida en un solo lance',
              'Una apuesta de 2 piedras',
              'Descartar las cuatro cartas',
              'Un lance sin apuesta',
            ],
            correcta: 0,
            explicacion: 'Es la mayor apuesta posible: si el rival lo acepta, quien gane ese lance gana toda la partida.',
          },
          {
            id: 'ms-3-1-e5',
            tipo: 'opcion_unica',
            pregunta: 'Aceptas un órdago («quiero») y pierdes el lance. ¿Qué pasa?',
            opciones: [
              'Tu equipo pierde la partida',
              'Pierdes solo 2 piedras',
              'Pierdes 1 piedra',
              'Se repite el lance',
            ],
            correcta: 0,
            explicacion: 'Un órdago aceptado decide la partida entera, por eso solo se acepta con una mano muy fuerte.',
          },
        ],
      },
      {
        id: 'ms-3-2',
        titulo: 'Mus y descartes',
        icono: '♻️',
        xp: 15,
        intro:
          'Al empezar, el jugador «mano» dice «mus» si quiere cambiar cartas o «no hay mus» si quiere jugar con las que tiene. Si todos dicen mus, cada uno descarta las cartas que quiera y recibe nuevas. Si alguien corta con «no hay mus», se pasa a los lances.',
        ejercicios: [
          {
            id: 'ms-3-2-e1',
            tipo: 'opcion_unica',
            pregunta: '¿Qué significa decir «mus»?',
            opciones: [
              'Quiero descartar cartas y recibir otras nuevas',
              'Quiero apostar',
              'Me retiro',
              'Quiero ver tus cartas',
            ],
            correcta: 0,
            explicacion: '«Mus» abre la ronda de descarte: te deshaces de las cartas que no te gustan.',
          },
          {
            id: 'ms-3-2-e2',
            tipo: 'opcion_unica',
            pregunta: '¿Qué pasa si un jugador dice «no hay mus»?',
            opciones: [
              'Se corta el descarte y se juega con las cartas que ya hay',
              'Se vuelve a repartir',
              'Ese jugador pierde',
              'Empieza otra partida',
            ],
            correcta: 0,
            explicacion: 'Basta con que uno corte para que no haya descarte y empiecen los lances.',
          },
          {
            id: 'ms-3-2-e3',
            tipo: 'opcion_unica',
            situacion: { filas: [{ etiqueta: 'Tu mano', cartas: ['Rey', 'Rey', '5', '4'] }] },
            pregunta: 'Tienes dos reyes, un 5 y un 4. Si descartas, ¿qué conservas normalmente?',
            opciones: ['Los dos reyes', 'El 5 y el 4', 'Un rey y el 4', 'Ninguna carta'],
            correcta: 0,
            explicacion: 'Los dos reyes te dan una buena pareja y buena Grande. Lo normal es descartar el 5 y el 4.',
          },
          {
            id: 'ms-3-2-e4',
            tipo: 'opcion_unica',
            situacion: { filas: [{ etiqueta: 'Tu mano', cartas: ['Caballo', 'Caballo', 'Caballo', '4'] }] },
            pregunta: 'Tienes tres caballos y un 4. ¿Qué descartas normalmente?',
            opciones: ['El 4', 'Un caballo', 'Todas las cartas', 'Ninguna: no se puede descartar'],
            correcta: 0,
            explicacion: 'Con tres caballos ya tienes medias. Cambias el 4 buscando otro caballo para completar duples.',
          },
          {
            id: 'ms-3-2-e5',
            tipo: 'opcion_unica',
            pregunta: 'En 8 reyes, ¿cuántas cartas de la baraja cuentan como «rey»?',
            opciones: ['8 (los 4 reyes y los 4 treses)', '4', '12', '10'],
            correcta: 0,
            explicacion: 'Los treses valen como reyes, así que hay 8 reyes en total.',
          },
          {
            id: 'ms-3-2-e6',
            tipo: 'opcion_unica',
            pregunta: 'En el descarte, ¿cuántas cartas puede cambiar cada jugador?',
            opciones: ['Entre 1 y 4, las que quiera', 'Siempre exactamente 2', 'Solo 1', 'Ninguna'],
            correcta: 0,
            explicacion: 'Cada jugador decide cuántas cartas se queda y cuántas cambia.',
          },
        ],
      },
      {
        id: 'ms-3-3',
        titulo: 'Las piedras',
        icono: '🏆',
        xp: 20,
        intro:
          'Los puntos del mus se llaman piedras. Lo más habitual es jugar a 40 piedras (8 amarracos de 5). Sin envites, cada lance se paga así: Grande 1, Chica 1, Pares: pareja 1, medias 2 y duples 3. Juego: 31 vale 3 y los demás 2. Punto 1.',
        ejercicios: [
          {
            id: 'ms-3-3-e1',
            tipo: 'opcion_unica',
            pregunta: '¿A cuántas piedras se juega la partida normalmente?',
            opciones: ['40', '10', '100', '21'],
            correcta: 0,
            explicacion: 'Lo habitual es a 40 piedras, es decir, 8 amarracos. Algunas zonas juegan a menos.',
          },
          {
            id: 'ms-3-3-e2',
            tipo: 'opcion_unica',
            pregunta: '¿Cuántas piedras forman un amarraco?',
            opciones: ['5', '1', '10', '2'],
            correcta: 0,
            explicacion: 'Un amarraco son 5 piedras, y 8 amarracos son las 40 de la partida.',
          },
          {
            id: 'ms-3-3-e3',
            tipo: 'opcion_unica',
            pregunta: 'Si nadie envida, ¿cuánto vale ganar la Grande?',
            opciones: ['1 piedra', '2 piedras', '3 piedras', 'Nada'],
            correcta: 0,
            explicacion: 'Un lance sin envites vale 1 piedra, también la Chica.',
          },
          {
            id: 'ms-3-3-e4',
            tipo: 'opcion_unica',
            pregunta: 'En el lance de Pares, ¿cuántas piedras vale tener duples (sin envites)?',
            opciones: ['3', '1', '2', '4'],
            correcta: 0,
            explicacion: 'Pareja vale 1, medias 2 y duples 3.',
          },
          {
            id: 'ms-3-3-e5',
            tipo: 'opcion_unica',
            pregunta: '¿Cuántas piedras vale tener medias (tres cartas iguales) sin envites?',
            opciones: ['2', '1', '3', '4'],
            correcta: 0,
            explicacion: 'Medias vale 2 piedras.',
          },
          {
            id: 'ms-3-3-e6',
            tipo: 'opcion_unica',
            pregunta: 'Sin envites, ¿cuánto vale ganar el Juego con 31?',
            opciones: ['3 piedras', '2 piedras', '1 piedra', '4 piedras'],
            correcta: 0,
            explicacion: 'El 31 es la mejor jugada y vale 3 piedras. Los otros juegos valen 2.',
          },
          {
            id: 'ms-3-3-e7',
            tipo: 'opcion_unica',
            pregunta: 'Tu pareja lleva 17 piedras. ¿Cuántos amarracos completos son?',
            opciones: ['3 (y 2 piedras sueltas)', '2', '4', '5'],
            correcta: 0,
            explicacion: '17 ÷ 5 = 3 amarracos (15 piedras) y sobran 2.',
          },
        ],
      },
      {
        id: 'ms-3-4',
        titulo: '¿Quién gana el lance?',
        icono: '⚖️',
        xp: 25,
        intro:
          'Grande: gana quien tiene las cartas más altas (rey, caballo, sota, 7…). Chica: las más bajas (as, 4, 5…). Pares: duples, medias y pareja, por este orden. Juego: 31, 32, 40, 37, 36, 35, 34, 33. Si hay empate, gana el jugador «mano». Recuerda que en 8 reyes el 3 es rey y el 2 es as.',
        ejercicios: [
          {
            id: 'ms-3-4-e1',
            tipo: 'opcion_unica',
            situacion: {
              filas: [
                { etiqueta: 'Tu mano', cartas: ['Rey', '3', '5', '4'] },
                { etiqueta: 'Rival', cartas: ['Rey', 'Caballo', 'Sota', '7'] },
              ],
            },
            pregunta: '¿Quién gana la Grande?',
            opciones: ['Tú', 'Tu rival', 'Empate: gana el «mano»'],
            correcta: 0,
            explicacion: 'Los dos tenéis un rey. Pero tú tienes un segundo rey (el 3 vale como rey) y tu rival solo un caballo.',
          },
          {
            id: 'ms-3-4-e2',
            tipo: 'opcion_unica',
            situacion: {
              filas: [
                { etiqueta: 'Tu mano', cartas: ['Caballo', 'Sota', '7', '6'] },
                { etiqueta: 'Rival', cartas: ['Caballo', 'Sota', '7', '5'] },
              ],
            },
            pregunta: '¿Quién gana la Grande?',
            opciones: ['Tu rival', 'Tú', 'Empate: gana el «mano»'],
            correcta: 1,
            explicacion: 'Las tres primeras cartas son iguales, pero tu cuarta carta (6) es más alta que la de tu rival (5).',
          },
          {
            id: 'ms-3-4-e3',
            tipo: 'opcion_unica',
            situacion: {
              filas: [
                { etiqueta: 'Tu mano', cartas: ['As', '4', '5', 'Rey'] },
                { etiqueta: 'Rival', cartas: ['2', '4', '7', 'Rey'] },
              ],
            },
            pregunta: '¿Quién gana la Chica?',
            opciones: ['Tú', 'Tu rival', 'Empate: gana el «mano»'],
            correcta: 0,
            explicacion: 'En Chica gana la mano más baja. Los dos tenéis as (el 2 vale como as) y un 4, pero tu tercera carta (5) es más baja que la del rival (7).',
          },
          {
            id: 'ms-3-4-e4',
            tipo: 'opcion_unica',
            situacion: {
              filas: [
                { etiqueta: 'Tu mano', cartas: ['As', '5', '6', '7'] },
                { etiqueta: 'Rival', cartas: ['2', '4', 'Sota', 'Rey'] },
              ],
            },
            pregunta: '¿Quién gana la Chica?',
            opciones: ['Tú', 'Empate: gana el «mano»', 'Tu rival'],
            correcta: 2,
            explicacion: 'Los dos empezáis con un as. La segunda carta decide: el 4 de tu rival es más bajo que tu 5.',
          },
          {
            id: 'ms-3-4-e5',
            tipo: 'opcion_unica',
            situacion: {
              filas: [
                { etiqueta: 'Tu mano', cartas: ['Rey', 'Caballo', '7', '4'] },
                { etiqueta: 'Rival', cartas: ['3', 'Caballo', '7', '4'] },
              ],
            },
            pregunta: '¿Quién gana la Grande?',
            opciones: ['Tú', 'Tu rival', 'Empate: gana el «mano»'],
            correcta: 2,
            explicacion: 'El 3 vale como rey, así que las dos manos son iguales. En caso de empate gana el jugador «mano».',
          },
          {
            id: 'ms-3-4-e6',
            tipo: 'opcion_unica',
            situacion: {
              filas: [
                { etiqueta: 'Tu mano', cartas: ['7', '7', '4', 'As'] },
                { etiqueta: 'Rival', cartas: ['Caballo', 'Caballo', '6', 'As'] },
              ],
            },
            pregunta: '¿Quién gana el lance de Pares?',
            opciones: ['Tú', 'Tu rival', 'Empate: gana el «mano»'],
            correcta: 1,
            explicacion: 'Las dos manos tienen una pareja, pero la de caballos es más alta que la de sietes.',
          },
          {
            id: 'ms-3-4-e7',
            tipo: 'opcion_unica',
            situacion: {
              filas: [
                { etiqueta: 'Tu mano', cartas: ['5', '5', '5', '2'] },
                { etiqueta: 'Rival', cartas: ['Rey', 'Rey', '4', '7'] },
              ],
            },
            pregunta: '¿Quién gana el lance de Pares?',
            opciones: ['Tú', 'Tu rival', 'Empate: gana el «mano»'],
            correcta: 0,
            explicacion: 'Tienes medias (tres cincos) y tu rival solo una pareja. Las medias ganan a una pareja, aunque sea de reyes.',
          },
          {
            id: 'ms-3-4-e8',
            tipo: 'opcion_unica',
            situacion: {
              filas: [
                { etiqueta: 'Tu mano', cartas: ['6', '6', '4', '4'] },
                { etiqueta: 'Rival', cartas: ['Rey', 'Rey', 'Rey', '7'] },
              ],
            },
            pregunta: '¿Quién gana el lance de Pares?',
            opciones: ['Tu rival', 'Tú', 'Empate: gana el «mano»'],
            correcta: 1,
            explicacion: 'Duples (dos parejas) ganan a medias (tres cartas iguales), aunque sean de reyes.',
          },
          {
            id: 'ms-3-4-e9',
            tipo: 'opcion_unica',
            situacion: {
              filas: [
                { etiqueta: 'Tu mano', cartas: ['Rey', '7', '7', '7'] },
                { etiqueta: 'Rival', cartas: ['Rey', 'Caballo', 'Sota', '3'] },
              ],
            },
            pregunta: '¿Quién gana el Juego?',
            opciones: ['Tu rival', 'Tú', 'Empate: gana el «mano»'],
            correcta: 1,
            explicacion: 'Tú sumas 31 (10 + 7 + 7 + 7) y tu rival 40. El 31 es el mejor juego de todos.',
          },
          {
            id: 'ms-3-4-e10',
            tipo: 'opcion_unica',
            situacion: {
              filas: [
                { etiqueta: 'Tu mano', cartas: ['Rey', 'Sota', 'Caballo', '7'] },
                { etiqueta: 'Rival', cartas: ['Rey', 'Sota', 'Caballo', '6'] },
              ],
            },
            pregunta: '¿Quién gana el Juego?',
            opciones: ['Tú', 'Tu rival', 'Empate: gana el «mano»'],
            correcta: 0,
            explicacion: 'Tú sumas 37 y tu rival 36. Entre los juegos de 33 a 37 manda el más alto.',
          },
        ],
      },
    ],
  });
}
