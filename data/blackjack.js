// Curso de BLACKJACK. Misma estructura que data/poker.js y data/mus.js.
// Todo es para practicar: no hay dinero real.
//
// CÓMO AÑADIR CONTENIDO
//  - Cada "lección" es un nivel del mapa. "intro" es lo que te explica Nai antes de empezar (un solo texto).
//  - Cada ejercicio necesita: id único, tipo, pregunta, opciones, correcta (posición de la respuesta, empezando en 0) y explicacion.
//  - Para dibujar cartas añade "situacion": { jugador: ['10', '6'], crupier: '10' }
//    o, si no hay crupier, "situacion": { filas: [{ etiqueta: 'Tu mano', cartas: ['9', '7', '8'] }] }
//    o "secuencia": ['5', '3', 'K'] para ejercicios de conteo.
//  - Cuidado con las comas y las comillas.

{
  // Las posiciones importan: 0 Pedir, 1 Plantarte, 2 Doblar, 3 Dividir
  const PPD = ['Pedir', 'Plantarte', 'Doblar'];
  const PPDD = ['Pedir', 'Plantarte', 'Doblar', 'Dividir'];

  CURSOS.push({
    id: 'blackjack',
    nombre: 'Blackjack',
    icono: '2️⃣',
    color: '#a560ff',
    descripcion: 'Estrategia básica y conteo de cartas Hi-Lo',
    reglas: '4 a 8 mazos y el crupier se planta con 17 blando. Con otras reglas algunas jugadas cambian un poco.',
    unidades: [
      // ------------------------------------------------------------
      {
        id: 'bj-u1',
        titulo: 'Lo básico',
        descripcion: 'Las cartas y cómo se juega una mano',
        lecciones: [
          {
            id: 'bj-1-1',
            titulo: 'Valor de las cartas',
            icono: '🔢',
            xp: 10,
            intro:
              '¡Bienvenido al blackjack! El objetivo es acercarte a 21 sin pasarte y quedar por encima del crupier. Las cartas del 2 al 10 valen su número, las figuras (J, Q, K) valen 10 y el As vale 1 u 11, lo que más te convenga.',
            ejercicios: [
              {
                id: 'bj-1-1-e1',
                tipo: 'opcion_unica',
                pregunta: '¿Cuánto vale un Rey (K) en el blackjack?',
                opciones: ['10', '11', '13', '1'],
                correcta: 0,
                explicacion: 'Las figuras (J, Q, K) y el 10 valen siempre 10.',
              },
              {
                id: 'bj-1-1-e2',
                tipo: 'opcion_unica',
                situacion: { jugador: ['A', '6'], crupier: '5' },
                pregunta: 'Tienes As y 6. ¿Qué total tienes?',
                opciones: ['7', '17 (blando)', '16', '21'],
                correcta: 1,
                explicacion:
                  'El As cuenta 11 mientras no te pases. Por eso es un 17 «blando»: puedes pedir carta sin riesgo de pasarte.',
              },
              {
                id: 'bj-1-1-e3',
                tipo: 'opcion_unica',
                situacion: { jugador: ['A', 'K'], crupier: '7' },
                pregunta: 'Tus dos primeras cartas son As y Rey. ¿Cómo se llama esa mano?',
                opciones: ['Blackjack', 'Un 21 normal', 'Una pareja', 'Un 11 duro'],
                correcta: 0,
                explicacion:
                  'As + figura o 10 en las dos primeras cartas es un blackjack natural. Suele pagar 3:2, así que conviene evitar las mesas que pagan 6:5.',
              },
              {
                id: 'bj-1-1-e4',
                tipo: 'opcion_unica',
                situacion: { filas: [{ etiqueta: 'Tu mano', cartas: ['9', '7', '8'] }] },
                pregunta: 'Tienes 9, 7 y 8. ¿Qué ocurre?',
                opciones: ['Te has pasado: suman 24', 'Tienes 21', 'Tienes 14', 'Tienes 16'],
                correcta: 0,
                explicacion: 'Suman 24, más de 21: te pasas y pierdes la mano.',
              },
              {
                id: 'bj-1-1-e5',
                tipo: 'opcion_unica',
                situacion: { filas: [{ etiqueta: 'Tu mano', cartas: ['A', '5', '9'] }] },
                pregunta: 'Tienes As, 5 y 9. ¿Cuánto vale el As aquí?',
                opciones: ['1, para tener un 15', '11, para tener un 25', '10, para tener un 24', 'Siempre vale 11'],
                correcta: 0,
                explicacion: 'Si el As valiera 11 sumarías 25 y te pasarías. Por eso cuenta 1 y tienes un 15.',
              },
            ],
          },
          {
            id: 'bj-1-2',
            titulo: 'Cómo se juega una mano',
            icono: '🎬',
            xp: 10,
            intro:
              'Tú recibes dos cartas y el crupier enseña una. Decides qué hacer antes de que juegue el crupier. Las jugadas básicas son pedir carta, plantarte, doblar y dividir. ¡Vamos a conocerlas!',
            ejercicios: [
              {
                id: 'bj-1-2-e1',
                tipo: 'opcion_unica',
                pregunta: '¿Qué significa «plantarte»?',
                opciones: ['No pedir más cartas', 'Pedir otra carta', 'Duplicar la apuesta', 'Rendirte y abandonar la mesa'],
                correcta: 0,
                explicacion: 'Plantarte es quedarte con tu total actual y no recibir más cartas.',
              },
              {
                id: 'bj-1-2-e2',
                tipo: 'opcion_unica',
                pregunta: '¿Qué ocurre si tu total supera 21?',
                opciones: ['Pierdes la mano', 'Sigues jugando', 'Empatas', 'Ganas'],
                correcta: 0,
                explicacion: 'Pasarte de 21 hace que pierdas la mano, aunque el crupier se pase después.',
              },
              {
                id: 'bj-1-2-e3',
                tipo: 'opcion_unica',
                pregunta: 'El crupier tiene 16. ¿Qué tiene que hacer?',
                opciones: ['Pedir carta', 'Plantarse', 'Doblar', 'Lo que prefiera'],
                correcta: 0,
                explicacion:
                  'El crupier no decide: pide con 16 o menos y se planta con 17 o más. En este curso también se planta con 17 blando.',
              },
              {
                id: 'bj-1-2-e4',
                tipo: 'opcion_unica',
                pregunta: '¿Qué es doblar?',
                opciones: [
                  'Duplicar la apuesta y recibir una sola carta más',
                  'Pedir dos cartas seguidas',
                  'Dividir la mano en dos',
                  'Pedir una carta y rendirte',
                ],
                correcta: 0,
                explicacion:
                  'Al doblar duplicas tu apuesta a cambio de recibir una única carta. Solo compensa en los momentos ventajosos.',
              },
              {
                id: 'bj-1-2-e5',
                tipo: 'opcion_unica',
                pregunta: '¿Cuándo puedes dividir?',
                opciones: [
                  'Cuando tus dos primeras cartas tienen el mismo valor',
                  'Cuando tienes 21',
                  'Cuando el crupier tiene un As',
                  'Siempre que quieras',
                ],
                correcta: 0,
                explicacion:
                  'Dividir separa dos cartas iguales en dos manos, cada una con su apuesta. Según el casino, un Rey y una Sota pueden contar o no como iguales.',
              },
            ],
          },
        ],
      },

      // ------------------------------------------------------------
      {
        id: 'bj-u2',
        titulo: 'Estrategia básica',
        descripcion: 'Qué hacer según tu mano y la carta del crupier',
        lecciones: [
          {
            id: 'bj-2-1',
            titulo: 'Pedir o plantarte',
            icono: '✋',
            xp: 15,
            intro:
              'La estrategia básica es la forma matemáticamente mejor de jugar cada mano. No es suerte: es saber qué hacer en cada situación. Mira siempre la carta del crupier: si es débil (2 a 6) puede pasarse, y si es fuerte (7 a As) tienes que arriesgar más.',
            ejercicios: [
              {
                id: 'bj-2-1-e1',
                tipo: 'accion',
                situacion: { jugador: ['10', '7'], crupier: 'A' },
                pregunta: 'Tienes 17 y el crupier enseña un As. ¿Qué haces?',
                opciones: PPD,
                correcta: 1,
                explicacion: 'Con 17 o más duro te plantas siempre. Pedir con 17 te pasaría demasiadas veces.',
              },
              {
                id: 'bj-2-1-e2',
                tipo: 'accion',
                situacion: { jugador: ['10', '6'], crupier: '6' },
                pregunta: 'Tienes 16 y el crupier enseña un 6. ¿Qué haces?',
                opciones: PPD,
                correcta: 1,
                explicacion:
                  'El 6 es una de las peores cartas para el crupier: se pasa muy a menudo. Tú te plantas y dejas que se arriesgue él.',
              },
              {
                id: 'bj-2-1-e3',
                tipo: 'accion',
                situacion: { jugador: ['10', '6'], crupier: '10' },
                pregunta: 'Tienes 16 y el crupier enseña un 10. ¿Qué haces?',
                opciones: PPD,
                correcta: 0,
                explicacion:
                  'Con un 10 delante, el crupier acaba con 17 o más la mayoría de las veces. Plantarte con 16 pierde más a largo plazo que arriesgarte a pedir.',
              },
              {
                id: 'bj-2-1-e4',
                tipo: 'accion',
                situacion: { jugador: ['7', '5'], crupier: '4' },
                pregunta: 'Tienes 12 y el crupier enseña un 4. ¿Qué haces?',
                opciones: PPD,
                correcta: 1,
                explicacion: 'Con 12 te plantas solo frente a un 4, 5 o 6 del crupier, que son sus cartas más débiles.',
              },
              {
                id: 'bj-2-1-e5',
                tipo: 'accion',
                situacion: { jugador: ['7', '5'], crupier: '3' },
                pregunta: 'Tienes 12 y el crupier enseña un 3. ¿Qué haces?',
                opciones: PPD,
                correcta: 0,
                explicacion: 'Frente a un 2 o un 3 todavía hay que pedir con 12. La plantada solo se justifica con 4, 5 o 6.',
              },
              {
                id: 'bj-2-1-e6',
                tipo: 'accion',
                situacion: { jugador: ['10', '3'], crupier: '2' },
                pregunta: 'Tienes 13 y el crupier enseña un 2. ¿Qué haces?',
                opciones: PPD,
                correcta: 1,
                explicacion: 'Con 13 a 16 te plantas cuando el crupier enseña de 2 a 6, y pides cuando enseña de 7 a As.',
              },
              {
                id: 'bj-2-1-e7',
                tipo: 'accion',
                situacion: { jugador: ['10', '5'], crupier: '7' },
                pregunta: 'Tienes 15 y el crupier enseña un 7. ¿Qué haces?',
                opciones: PPD,
                correcta: 0,
                explicacion: 'Un 7 del crupier suele convertirse en 17. Con 15 estás por debajo, así que hay que pedir.',
              },
            ],
          },
          {
            id: 'bj-2-2',
            titulo: 'Doblar',
            icono: '✌️',
            xp: 15,
            intro:
              'Doblar es duplicar tu apuesta a cambio de recibir una sola carta. Solo compensa cuando tu mano puede mejorar mucho y el crupier es débil. Las manos que más se doblan son el 9, el 10 y el 11.',
            ejercicios: [
              {
                id: 'bj-2-2-e1',
                tipo: 'accion',
                situacion: { jugador: ['6', '5'], crupier: '6' },
                pregunta: 'Tienes 11 y el crupier enseña un 6. ¿Qué haces?',
                opciones: PPD,
                correcta: 2,
                explicacion:
                  'Con 11 contra una carta débil, una sola carta te deja en una posición muy fuerte (un 10 te da 21). Es el mejor momento para doblar.',
              },
              {
                id: 'bj-2-2-e2',
                tipo: 'accion',
                situacion: { jugador: ['6', '4'], crupier: '4' },
                pregunta: 'Tienes 10 y el crupier enseña un 4. ¿Qué haces?',
                opciones: PPD,
                correcta: 2,
                explicacion: 'Con 10 se dobla frente a cualquier carta del crupier del 2 al 9.',
              },
              {
                id: 'bj-2-2-e3',
                tipo: 'accion',
                situacion: { jugador: ['5', '4'], crupier: '5' },
                pregunta: 'Tienes 9 y el crupier enseña un 5. ¿Qué haces?',
                opciones: PPD,
                correcta: 2,
                explicacion: 'Con 9 se dobla solo frente a un 3, 4, 5 o 6 del crupier: sus cartas más débiles.',
              },
              {
                id: 'bj-2-2-e4',
                tipo: 'accion',
                situacion: { jugador: ['6', '4'], crupier: '10' },
                pregunta: 'Tienes 10 y el crupier enseña un 10. ¿Qué haces?',
                opciones: PPD,
                correcta: 0,
                explicacion: 'Doblar con 10 solo compensa frente a cartas del 2 al 9. Frente a un 10 del crupier, pide carta sin doblar.',
              },
              {
                id: 'bj-2-2-e5',
                tipo: 'accion',
                situacion: { jugador: ['5', '4'], crupier: '8' },
                pregunta: 'Tienes 9 y el crupier enseña un 8. ¿Qué haces?',
                opciones: PPD,
                correcta: 0,
                explicacion: 'Frente a un 7 o más el crupier es fuerte y no compensa arriesgar el doble. Con 9, pide carta.',
              },
              {
                id: 'bj-2-2-e6',
                tipo: 'accion',
                situacion: { jugador: ['6', '5'], crupier: '9' },
                pregunta: 'Tienes 11 y el crupier enseña un 9. ¿Qué haces?',
                opciones: PPD,
                correcta: 2,
                explicacion: 'El 11 se dobla frente a casi todo: del 2 al 10 del crupier. Una carta alta te deja en una gran mano.',
              },
            ],
          },
          {
            id: 'bj-2-3',
            titulo: 'Parejas',
            icono: '✂️',
            xp: 15,
            intro:
              'Cuando tienes dos cartas iguales puedes dividirlas en dos manos. A veces es buenísimo y a veces un error. Reglas fáciles de recordar: los Ases y los 8 siempre se dividen; los 10 y las figuras, nunca.',
            ejercicios: [
              {
                id: 'bj-2-3-e1',
                tipo: 'accion',
                situacion: { jugador: ['8', '8'], crupier: '10' },
                pregunta: 'Tienes pareja de 8 y el crupier enseña un 10. ¿Qué haces?',
                opciones: PPDD,
                correcta: 3,
                explicacion:
                  'Los 8 siempre se dividen: un 16 es la peor mano posible, y dos manos que empiezan en 8 tienen mucho más futuro.',
              },
              {
                id: 'bj-2-3-e2',
                tipo: 'accion',
                situacion: { jugador: ['10', 'K'], crupier: '6' },
                pregunta: 'Tienes dos cartas de valor 10 (20 en total) y el crupier enseña un 6. ¿Qué haces?',
                opciones: PPDD,
                correcta: 1,
                explicacion: 'Un 20 es casi imbatible. Nunca se dividen las cartas de valor 10, aunque el crupier parezca débil.',
              },
              {
                id: 'bj-2-3-e3',
                tipo: 'accion',
                situacion: { jugador: ['A', 'A'], crupier: '10' },
                pregunta: 'Tienes pareja de Ases y el crupier enseña un 10. ¿Qué haces?',
                opciones: PPDD,
                correcta: 3,
                explicacion:
                  'Dos Ases juntos solo valen 2 o 12, pero cada As por separado es un gran comienzo. Siempre se dividen.',
              },
              {
                id: 'bj-2-3-e4',
                tipo: 'accion',
                situacion: { jugador: ['9', '9'], crupier: '7' },
                pregunta: 'Tienes pareja de 9 y el crupier enseña un 7. ¿Qué haces?',
                opciones: PPDD,
                correcta: 1,
                explicacion:
                  'Tus 18 ya vencen al resultado más probable del crupier con un 7, que es un 17. Aquí te plantas, no divides.',
              },
              {
                id: 'bj-2-3-e5',
                tipo: 'accion',
                situacion: { jugador: ['5', '5'], crupier: '6' },
                pregunta: 'Tienes pareja de 5 y el crupier enseña un 6. ¿Qué haces?',
                opciones: PPDD,
                correcta: 2,
                explicacion: 'Dos 5 suman 10: se juegan como un 10 y se doblan. Nunca se dividen.',
              },
            ],
          },
          {
            id: 'bj-2-4',
            titulo: 'Manos blandas',
            icono: '🅰️',
            xp: 15,
            intro:
              'Una mano blanda lleva un As que cuenta 11. Como una sola carta no te puede pasar, puedes arriesgar más: si te pasaras, el As pasa a valer 1 y la mano sigue viva.',
            ejercicios: [
              {
                id: 'bj-2-4-e1',
                tipo: 'accion',
                situacion: { jugador: ['A', '7'], crupier: '9' },
                pregunta: 'Tienes As y 7 (18 blando) y el crupier enseña un 9. ¿Qué haces?',
                opciones: PPD,
                correcta: 0,
                explicacion:
                  'Un 18 blando pierde contra casi todo lo que puede hacer el crupier con un 9, 10 o As. Como el As te protege de pasarte, conviene pedir carta.',
              },
              {
                id: 'bj-2-4-e2',
                tipo: 'accion',
                situacion: { jugador: ['A', '7'], crupier: '7' },
                pregunta: 'Tienes As y 7 (18 blando) y el crupier enseña un 7. ¿Qué haces?',
                opciones: PPD,
                correcta: 1,
                explicacion: 'El 18 blando se planta frente a un 2, 7 u 8 del crupier. Contra 9, 10 y As se pide.',
              },
              {
                id: 'bj-2-4-e3',
                tipo: 'accion',
                situacion: { jugador: ['A', '6'], crupier: '5' },
                pregunta: 'Tienes As y 6 (17 blando) y el crupier enseña un 5. ¿Qué haces?',
                opciones: PPD,
                correcta: 2,
                explicacion:
                  'El 17 blando se dobla frente a un 3 a 6 del crupier. Si la mesa no te deja doblar, pide carta.',
              },
              {
                id: 'bj-2-4-e4',
                tipo: 'accion',
                situacion: { jugador: ['A', '6'], crupier: '10' },
                pregunta: 'Tienes As y 6 (17 blando) y el crupier enseña un 10. ¿Qué haces?',
                opciones: PPD,
                correcta: 0,
                explicacion: 'Un 17 blando no es una mano para plantarse: no te puedes pasar con una carta, así que pide.',
              },
              {
                id: 'bj-2-4-e5',
                tipo: 'accion',
                situacion: { jugador: ['A', '2'], crupier: '5' },
                pregunta: 'Tienes As y 2 (13 blando) y el crupier enseña un 5. ¿Qué haces?',
                opciones: PPD,
                correcta: 2,
                explicacion:
                  'Los 13 y 14 blandos se doblan solo frente a un 5 o un 6 del crupier. Si no puedes doblar, pide carta.',
              },
            ],
          },
        ],
      },

      // ------------------------------------------------------------
      {
        id: 'bj-u3',
        titulo: 'Conteo de cartas (Hi-Lo)',
        descripcion: 'Lleva la cuenta de lo que va saliendo',
        lecciones: [
          {
            id: 'bj-3-1',
            titulo: 'Valores del Hi-Lo',
            icono: '➕',
            xp: 20,
            intro:
              'Contar cartas es una habilidad mental: seguir qué cartas han salido para saber si lo que queda favorece al jugador. En el Hi-Lo las bajas (2 a 6) valen +1, las medias (7 a 9) valen 0 y las altas (10 y As) valen -1. Ojo: los casinos pueden echarte si te descubren.',
            ejercicios: [
              {
                id: 'bj-3-1-e1',
                tipo: 'opcion_unica',
                pregunta: 'En el sistema Hi-Lo, ¿qué valor tiene un 5?',
                opciones: ['+1', '0', '-1', '+2'],
                correcta: 0,
                explicacion: 'Las cartas del 2 al 6 valen +1, las del 7 al 9 valen 0 y las del 10 al As valen -1.',
              },
              {
                id: 'bj-3-1-e2',
                tipo: 'opcion_unica',
                pregunta: 'En el sistema Hi-Lo, ¿qué valor tiene un As?',
                opciones: ['+1', '0', '-1', '+2'],
                correcta: 2,
                explicacion:
                  'Las cartas altas (10, figuras y As) valen -1, porque cuando salen dejan un mazo con menos cartas favorables para ti.',
              },
              {
                id: 'bj-3-1-e3',
                tipo: 'opcion_unica',
                pregunta: 'En el sistema Hi-Lo, ¿qué valor tiene un 8?',
                opciones: ['+1', '0', '-1', '+2'],
                correcta: 1,
                explicacion: 'Las cartas del 7 al 9 son neutras: no cambian la cuenta.',
              },
              {
                id: 'bj-3-1-e4',
                tipo: 'opcion_unica',
                pregunta: 'En el sistema Hi-Lo, ¿qué valor tiene un 2?',
                opciones: ['+1', '0', '-1', '+2'],
                correcta: 0,
                explicacion: 'Todas las cartas bajas, del 2 al 6, valen +1.',
              },
              {
                id: 'bj-3-1-e5',
                tipo: 'opcion_unica',
                pregunta: 'En el sistema Hi-Lo, ¿qué valor tiene un Rey?',
                opciones: ['+1', '0', '-1', '+2'],
                correcta: 2,
                explicacion: 'Las figuras cuentan como los 10: son cartas altas y valen -1.',
              },
            ],
          },
          {
            id: 'bj-3-2',
            titulo: 'La cuenta corriente',
            icono: '🧮',
            xp: 20,
            intro:
              'La cuenta corriente es la suma de los valores Hi-Lo de todas las cartas que han salido. Empieza en 0. Un truco: empareja mentalmente cartas altas con bajas, porque se cancelan (+1 y -1 suman 0).',
            ejercicios: [
              {
                id: 'bj-3-2-e1',
                tipo: 'cuenta_corriente',
                secuencia: ['5', '3', 'K', '9', '6'],
                pregunta: 'Salen estas cartas en este orden. ¿Cuál es la cuenta corriente al final?',
                opciones: ['+1', '+2', '+3', '0'],
                correcta: 1,
                explicacion: '5 (+1), 3 (+1), K (-1), 9 (0), 6 (+1). Suma total: +2.',
              },
              {
                id: 'bj-3-2-e2',
                tipo: 'cuenta_corriente',
                secuencia: ['2', 'K', '7', 'A', '4'],
                pregunta: 'Salen estas cartas en este orden. ¿Cuál es la cuenta corriente al final?',
                opciones: ['0', '+1', '-1', '+2'],
                correcta: 0,
                explicacion: '2 (+1), K (-1), 7 (0), A (-1), 4 (+1). Suma total: 0.',
              },
              {
                id: 'bj-3-2-e3',
                tipo: 'cuenta_corriente',
                secuencia: ['10', 'A', 'K', '8', '9'],
                pregunta: 'Salen estas cartas en este orden. ¿Cuál es la cuenta corriente al final?',
                opciones: ['-3', '-2', '-1', '+3'],
                correcta: 0,
                explicacion: 'Tres cartas altas (-1 cada una) y dos neutras (0): -3.',
              },
              {
                id: 'bj-3-2-e4',
                tipo: 'cuenta_corriente',
                secuencia: ['4', '2', '9', 'K', '3', 'A', '7'],
                pregunta: 'Salen estas cartas en este orden. ¿Cuál es la cuenta corriente al final?',
                opciones: ['+1', '0', '+2', '-1'],
                correcta: 0,
                explicacion: '4 (+1), 2 (+1), 9 (0), K (-1), 3 (+1), A (-1), 7 (0). Suma total: +1.',
              },
              {
                id: 'bj-3-2-e5',
                tipo: 'cuenta_corriente',
                secuencia: ['Q', 'Q', 'J', '5'],
                pregunta: 'Salen estas cartas en este orden. ¿Cuál es la cuenta corriente al final?',
                opciones: ['-2', '-3', '-1', '+2'],
                correcta: 0,
                explicacion: 'Tres figuras (-3) y un 5 (+1): -2.',
              },
              {
                id: 'bj-3-2-e6',
                tipo: 'cuenta_corriente',
                secuencia: ['6', '6', '3', 'Q', 'J', '5', '2'],
                pregunta: 'Salen estas cartas en este orden. ¿Cuál es la cuenta corriente al final?',
                opciones: ['+3', '+2', '+4', '+1'],
                correcta: 0,
                explicacion: '6, 6 y 3 suman +3; Q y J restan 2; el 5 y el 2 suman +2. Total: +3.',
              },
            ],
          },
          {
            id: 'bj-3-3',
            titulo: 'La cuenta verdadera',
            icono: '⚖️',
            xp: 25,
            intro:
              'La cuenta corriente engaña: un +6 pesa mucho si quedan pocas cartas y poco si quedan muchos mazos. Por eso se calcula la cuenta verdadera: la cuenta corriente dividida entre los mazos que quedan por salir.',
            ejercicios: [
              {
                id: 'bj-3-3-e1',
                tipo: 'opcion_unica',
                pregunta: 'La cuenta corriente es +6 y quedan 3 mazos. ¿Cuál es la cuenta verdadera?',
                opciones: ['+2', '+3', '+6', '+18'],
                correcta: 0,
                explicacion: '6 ÷ 3 mazos = +2.',
              },
              {
                id: 'bj-3-3-e2',
                tipo: 'opcion_unica',
                pregunta: 'La cuenta corriente es +9 y quedan 3 mazos. ¿Cuál es la cuenta verdadera?',
                opciones: ['+3', '+6', '+12', '+27'],
                correcta: 0,
                explicacion: '9 ÷ 3 mazos = +3.',
              },
              {
                id: 'bj-3-3-e3',
                tipo: 'opcion_unica',
                pregunta: 'La cuenta corriente es -4 y quedan 2 mazos. ¿Cuál es la cuenta verdadera?',
                opciones: ['-2', '+2', '-8', '-4'],
                correcta: 0,
                explicacion: '-4 ÷ 2 mazos = -2.',
              },
              {
                id: 'bj-3-3-e4',
                tipo: 'opcion_unica',
                pregunta: '¿Por qué se divide la cuenta corriente entre los mazos que quedan?',
                opciones: [
                  'Porque el mismo número pesa menos cuando quedan muchas cartas por salir',
                  'Para que el crupier no se dé cuenta',
                  'Para evitar los números negativos',
                  'Porque lo exige el casino',
                ],
                correcta: 0,
                explicacion: 'Un +6 con un solo mazo por salir es mucho más importante que un +6 con seis mazos por salir.',
              },
              {
                id: 'bj-3-3-e5',
                tipo: 'opcion_unica',
                pregunta: 'Una cuenta verdadera alta y positiva significa que en las cartas que quedan hay…',
                opciones: [
                  'Más cartas altas, lo que favorece al jugador',
                  'Más cartas bajas, lo que favorece al jugador',
                  'Más cartas medias',
                  'Menos cartas en total',
                ],
                correcta: 0,
                explicacion:
                  'Han salido muchas cartas bajas, así que quedan más 10 y Ases, que favorecen al jugador (más blackjacks y mejores dobles).',
              },
            ],
          },
        ],
      },
    ],
  });
}
