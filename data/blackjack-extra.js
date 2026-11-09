// Blackjack: niveles adicionales (se añaden al curso que crea data/blackjack.js).
// Mismo formato que data/blackjack.js. Todo es para practicar: no hay dinero real.

{
  const PPD = ['Pedir', 'Plantarte', 'Doblar'];
  const PPDD = ['Pedir', 'Plantarte', 'Doblar', 'Dividir'];
  const curso = CURSOS.find((c) => c.id === 'blackjack');

  // ------------------------------------------------------------
  // Dos niveles más dentro de "Conteo de cartas (Hi-Lo)"
  // ------------------------------------------------------------
  const conteo = curso.unidades.find((u) => u.id === 'bj-u3');
  conteo.lecciones.push(
    {
      id: 'bj-3-4',
      titulo: 'Subir y bajar la apuesta',
      icono: '📈',
      xp: 25,
      intro:
        'Contar cartas sirve para algo muy concreto: apostar más cuando la cuenta verdadera es alta (te favorece) y lo mínimo cuando es baja. Es la «rampa de apuestas». Regla sencilla: con cuenta verdadera +1 o menos, apuesta 1 unidad; con +2 o más, sube.',
      ejercicios: [
        {
          id: 'bj-3-4-e1',
          tipo: 'opcion_unica',
          pregunta: 'La cuenta verdadera es +4. ¿Qué haces con tu apuesta?',
          opciones: ['Subirla', 'Bajarla al mínimo', 'Mantener siempre la misma', 'Retirarte de la mesa'],
          correcta: 0,
          explicacion: 'Una cuenta verdadera alta quiere decir que quedan muchas cartas altas: es el momento de apostar más.',
        },
        {
          id: 'bj-3-4-e2',
          tipo: 'opcion_unica',
          pregunta: 'La cuenta verdadera es -2. ¿Qué haces con tu apuesta?',
          opciones: ['Apostar el mínimo', 'Apostar lo máximo', 'Doblar la apuesta anterior', 'Apostar al azar'],
          correcta: 0,
          explicacion: 'Con cuenta negativa la ventaja es de la casa: apuesta lo mínimo mientras esperas mejores momentos.',
        },
        {
          id: 'bj-3-4-e3',
          tipo: 'opcion_unica',
          pregunta: 'La cuenta corriente es +9 y quedan 3 mazos. ¿Cuál es la cuenta verdadera?',
          opciones: ['+3', '+9', '+27', '+12'],
          correcta: 0,
          explicacion: '+9 ÷ 3 mazos = +3. Es una cuenta alta: toca subir la apuesta.',
        },
        {
          id: 'bj-3-4-e4',
          tipo: 'opcion_unica',
          pregunta: 'La cuenta corriente es -6 y quedan 3 mazos. ¿Cuál es la cuenta verdadera?',
          opciones: ['-2', '-6', '-3', '+2'],
          correcta: 0,
          explicacion: '-6 ÷ 3 mazos = -2. Cuenta negativa: apuesta lo mínimo.',
        },
        {
          id: 'bj-3-4-e5',
          tipo: 'opcion_unica',
          pregunta: '¿Por qué es mala idea pasar de golpe de 1 a 20 unidades de apuesta?',
          opciones: [
            'Porque llama muchísimo la atención del casino',
            'Porque la cuenta se reinicia',
            'Porque baja la cuenta verdadera',
            'Porque el crupier cambia de mazo',
          ],
          correcta: 0,
          explicacion: 'Los casinos vigilan los saltos bruscos de apuesta. Los contadores suben y bajan de forma gradual.',
        },
        {
          id: 'bj-3-4-e6',
          tipo: 'opcion_unica',
          pregunta: 'Contar cartas solo con la cabeza, ¿es un delito?',
          opciones: [
            'En general no, pero el casino puede pedirte que te marches',
            'Sí, y acabas en los tribunales',
            'Solo es legal si juegas con un mazo',
            'Solo es legal si pierdes',
          ],
          correcta: 0,
          explicacion:
            'Usar tu memoria no suele ser un delito, aunque cada casino y cada país tienen sus normas y pueden vetarte. Las leyes cambian: infórmate antes.',
        },
      ],
    },
    {
      id: 'bj-3-5',
      titulo: 'Desviaciones del Hi-Lo',
      icono: '🎯',
      xp: 25,
      intro:
        'Los contadores avanzados cambian algunas jugadas según la cuenta verdadera (TC), los «índices». Los más famosos: seguro con +3 o más; 16 contra 10, te plantas con 0 o más; 15 contra 10, te plantas con +4 o más; 10 contra 10, doblas con +4 o más; 12 contra 3, te plantas con +2 o más.',
      ejercicios: [
        {
          id: 'bj-3-5-e1',
          tipo: 'opcion_unica',
          situacion: { jugador: ['10', '6'], crupier: '10' },
          pregunta: 'Tienes 16 contra un 10 (sin rendición) y la cuenta verdadera es +1. ¿Qué haces?',
          opciones: PPD,
          correcta: 1,
          explicacion: 'Con cuenta verdadera 0 o más, el 16 contra 10 se planta: quedan muchas cartas altas que te harían pasarte.',
        },
        {
          id: 'bj-3-5-e2',
          tipo: 'opcion_unica',
          situacion: { jugador: ['10', '6'], crupier: '10' },
          pregunta: 'Tienes 16 contra un 10 (sin rendición) y la cuenta verdadera es -2. ¿Qué haces?',
          opciones: PPD,
          correcta: 0,
          explicacion: 'Con cuenta negativa vuelves a la estrategia básica: pedir. Hay menos cartas altas que te hagan pasarte.',
        },
        {
          id: 'bj-3-5-e3',
          tipo: 'opcion_unica',
          situacion: { jugador: ['6', '4'], crupier: '10' },
          pregunta: 'Tienes 10 contra un 10 y la cuenta verdadera es +4. ¿Qué haces?',
          opciones: PPD,
          correcta: 2,
          explicacion: 'Con +4 o más, el 10 contra 10 se dobla: es probable que te llegue una carta de valor 10 para hacer 20.',
        },
        {
          id: 'bj-3-5-e4',
          tipo: 'opcion_unica',
          situacion: { jugador: ['10', '5'], crupier: '10' },
          pregunta: 'Tienes 15 contra un 10 (sin rendición) y la cuenta verdadera es +2. ¿Qué haces?',
          opciones: PPD,
          correcta: 0,
          explicacion: 'El índice del 15 contra 10 es +4. Con +2 todavía no llegas: sigues con la estrategia básica y pides.',
        },
        {
          id: 'bj-3-5-e5',
          tipo: 'opcion_unica',
          situacion: { jugador: ['10', '2'], crupier: '3' },
          pregunta: 'Tienes 12 contra un 3 y la cuenta verdadera es +2. ¿Qué haces?',
          opciones: PPD,
          correcta: 1,
          explicacion: 'El índice del 12 contra 3 es +2: con esa cuenta te plantas, aunque la estrategia básica diga pedir.',
        },
        {
          id: 'bj-3-5-e6',
          tipo: 'opcion_unica',
          pregunta: 'El crupier enseña un As y la cuenta verdadera es +3. ¿Tomas el seguro?',
          opciones: ['Sí', 'No'],
          correcta: 0,
          explicacion: 'Con +3 o más hay suficientes cartas de valor 10 para que el seguro sea rentable a largo plazo.',
        },
      ],
    }
  );

  // ------------------------------------------------------------
  // Unidad 4: reglas y dinero
  // ------------------------------------------------------------
  curso.unidades.push(
    {
      id: 'bj-u4',
      titulo: 'Reglas y dinero',
      descripcion: 'Seguro, rendición y cómo cuidar tu dinero',
      lecciones: [
        {
          id: 'bj-4-1',
          titulo: 'El seguro',
          icono: '🛡️',
          xp: 15,
          intro:
            'Cuando el crupier enseña un As te ofrecen un seguro: una apuesta extra de hasta la mitad de la tuya que gana si el crupier tiene blackjack (paga 2 a 1). Suena prudente, pero sin contar cartas es una mala apuesta.',
          ejercicios: [
            {
              id: 'bj-4-1-e1',
              tipo: 'opcion_unica',
              pregunta: '¿Cuándo te ofrecen el seguro?',
              opciones: [
                'Cuando el crupier enseña un As',
                'Cuando tú tienes blackjack',
                'Cuando el crupier enseña un 10',
                'Cuando te pasas de 21',
              ],
              correcta: 0,
              explicacion: 'Solo cuando la carta visible del crupier es un As: el seguro apuesta a que su carta tapada vale 10.',
            },
            {
              id: 'bj-4-1-e2',
              tipo: 'opcion_unica',
              pregunta: '¿Cuánto puedes apostar como máximo al seguro?',
              opciones: ['La mitad de tu apuesta inicial', 'El doble de tu apuesta', 'Lo mismo que tu apuesta', 'Una ficha fija'],
              correcta: 0,
              explicacion: 'El seguro cuesta, como máximo, la mitad de tu apuesta original.',
            },
            {
              id: 'bj-4-1-e3',
              tipo: 'opcion_unica',
              pregunta: 'El seguro paga 2 a 1. Si apuestas 5 fichas al seguro y el crupier tiene blackjack, ¿cuánto ganas con el seguro?',
              opciones: ['10 fichas', '5 fichas', '7,5 fichas', '15 fichas'],
              correcta: 0,
              explicacion: '2 a 1 significa ganar el doble de lo apostado: 5 × 2 = 10 fichas.',
            },
            {
              id: 'bj-4-1-e4',
              tipo: 'opcion_unica',
              pregunta: 'Sin contar cartas, ¿qué dice la estrategia básica sobre el seguro?',
              opciones: ['Nunca lo tomes', 'Tómalo siempre con 20', 'Tómalo siempre que puedas', 'Tómalo solo con 12'],
              correcta: 0,
              explicacion:
                'A la larga pierde dinero: solo 4 de cada 13 cartas valen 10 (≈31 %), y para salir a mano con un pago de 2 a 1 necesitarías 1 de cada 3 (≈33 %).',
            },
            {
              id: 'bj-4-1-e5',
              tipo: 'opcion_unica',
              pregunta: 'Con Hi-Lo, ¿cuándo suele compensar tomar el seguro?',
              opciones: [
                'Con cuenta verdadera +3 o más',
                'Con cuenta verdadera negativa',
                'Siempre que la cuenta sea 0',
                'Cuando quedan pocos mazos',
              ],
              correcta: 0,
              explicacion: 'Con +3 o más quedan tantas cartas de valor 10 que el seguro deja de ser una mala apuesta.',
            },
          ],
        },
        {
          id: 'bj-4-2',
          titulo: 'Rendirse y pagos',
          icono: '🏳️',
          xp: 15,
          intro:
            'Algunas mesas permiten rendirte: pierdes solo la mitad de la apuesta y te retiras de la mano. Además, no todas las mesas pagan igual: el blackjack natural debe pagar 3 a 2, y las mesas de 6 a 5 son una mala noticia.',
          ejercicios: [
            {
              id: 'bj-4-2-e1',
              tipo: 'opcion_unica',
              pregunta: 'Si te rindes (surrender), ¿cuánto pierdes?',
              opciones: ['La mitad de la apuesta', 'Toda la apuesta', 'Nada', 'El doble'],
              correcta: 0,
              explicacion: 'Rendirte te devuelve media apuesta: pierdes solo la otra mitad.',
            },
            {
              id: 'bj-4-2-e2',
              tipo: 'opcion_unica',
              situacion: { jugador: ['10', '6'], crupier: '10' },
              pregunta: 'Tienes 16 y el crupier enseña un 10. Se permite rendirse. ¿Cuál es la mejor jugada?',
              opciones: ['Rendirte', 'Pedir', 'Plantarte', 'Doblar'],
              correcta: 0,
              explicacion:
                'Un 16 contra 10 pierde en promedio un poco más de media apuesta jugando. Rendirte limita la pérdida a media apuesta.',
            },
            {
              id: 'bj-4-2-e3',
              tipo: 'opcion_unica',
              situacion: { jugador: ['10', '5'], crupier: '10' },
              pregunta: 'Tienes 15 y el crupier enseña un 10. Se permite rendirse. ¿Cuál es la mejor jugada?',
              opciones: ['Rendirte', 'Pedir', 'Plantarte', 'Doblar'],
              correcta: 0,
              explicacion: 'Con el 15 contra 10 también compensa rendirse: es una de las peores situaciones del juego.',
            },
            {
              id: 'bj-4-2-e4',
              tipo: 'opcion_unica',
              situacion: { jugador: ['10', '7'], crupier: '10' },
              pregunta: 'Tienes 17 y el crupier enseña un 10. Se permite rendirse. ¿Cuál es la mejor jugada?',
              opciones: ['Plantarte', 'Rendirte', 'Pedir', 'Doblar'],
              correcta: 0,
              explicacion: 'Un 17 es una mano decente: te plantas. Rendirte tiraría media apuesta sin necesidad.',
            },
            {
              id: 'bj-4-2-e5',
              tipo: 'opcion_unica',
              pregunta: '¿Cuánto paga un blackjack natural en una mesa buena?',
              opciones: ['3 a 2', '6 a 5', '1 a 1', '2 a 1'],
              correcta: 0,
              explicacion: '3 a 2: por cada 10 fichas apostadas cobras 15.',
            },
            {
              id: 'bj-4-2-e6',
              tipo: 'opcion_unica',
              pregunta: '¿Por qué son peores las mesas donde el blackjack paga 6 a 5?',
              opciones: [
                'Porque suben mucho la ventaja de la casa',
                'Porque hay más mazos',
                'Porque el crupier pide con 17',
                'Porque no se puede doblar',
              ],
              correcta: 0,
              explicacion: 'Cobrar 6 en lugar de 7,5 por cada 5 apostados en cada blackjack sube la ventaja de la casa más de un punto porcentual.',
            },
          ],
        },
        {
          id: 'bj-4-3',
          titulo: 'Cuida tu dinero',
          icono: '💰',
          xp: 15,
          intro:
            'Practicar aquí es gratis, pero si algún día juegas de verdad, la gestión del dinero importa tanto como la estrategia. Ningún sistema de apuestas vence a la casa: lo importante es decidir de antemano cuánto puedes permitirte perder. Si el juego deja de ser diversión, pide ayuda.',
          ejercicios: [
            {
              id: 'bj-4-3-e1',
              tipo: 'opcion_unica',
              pregunta: '¿Qué es el «bankroll»?',
              opciones: [
                'El dinero que reservas solo para jugar',
                'Un tipo de apuesta',
                'La carta tapada del crupier',
                'La comisión del casino',
              ],
              correcta: 0,
              explicacion: 'Es el dinero reservado para jugar. Si lo pierdes, no debería afectar a tu vida diaria.',
            },
            {
              id: 'bj-4-3-e2',
              tipo: 'opcion_unica',
              pregunta: 'Has perdido tres manos seguidas. ¿Qué haces con tu siguiente apuesta?',
              opciones: [
                'Mantener mi apuesta habitual',
                'Doblarla para recuperar lo perdido',
                'Apostar todo lo que me queda',
                'Subirla cada vez más',
              ],
              correcta: 0,
              explicacion:
                'Cada mano es independiente: las pérdidas anteriores no cambian las probabilidades. Perseguir las pérdidas es el error más caro.',
            },
            {
              id: 'bj-4-3-e3',
              tipo: 'opcion_unica',
              pregunta: 'La «martingala» consiste en doblar la apuesta tras cada pérdida. ¿Por qué falla?',
              opciones: [
                'Porque los límites de la mesa y tu bankroll cortan la racha antes de recuperar',
                'Porque está prohibida',
                'Porque el crupier la detecta',
                'Porque solo funciona en la ruleta',
              ],
              correcta: 0,
              explicacion:
                'Una racha mala larga te obliga a apostar cantidades enormes para ganar solo una unidad, y la mesa tiene un límite máximo.',
            },
            {
              id: 'bj-4-3-e4',
              tipo: 'opcion_unica',
              pregunta: 'Con estrategia básica perfecta y buenas reglas, ¿qué ventaja tiene la casa aproximadamente?',
              opciones: ['Menos del 1 %', 'Un 10 %', 'Un 25 %', 'Ninguna: siempre ganas'],
              correcta: 0,
              explicacion: 'Alrededor del 0,5 %. Es poco, pero sigue siendo ventaja de la casa: por eso nadie «gana seguro».',
            },
            {
              id: 'bj-4-3-e5',
              tipo: 'opcion_unica',
              pregunta: '¿Cuál es una buena regla de seguridad?',
              opciones: [
                'Decidir antes cuánto puedes perder y parar al llegar',
                'Seguir hasta recuperar lo perdido',
                'Pedir dinero prestado para seguir',
                'Jugar más rápido para que pase el rato',
              ],
              correcta: 0,
              explicacion: 'Poner un límite antes de empezar y respetarlo es la mejor protección.',
            },
          ],
        },
      ],
    },
    // ------------------------------------------------------------
    // Unidad 5: retos finales
    // ------------------------------------------------------------
    {
      id: 'bj-u5',
      titulo: 'Retos',
      descripcion: 'Pon a prueba todo lo aprendido',
      lecciones: [
        {
          id: 'bj-5-1',
          titulo: 'Reto de estrategia',
          icono: '🏅',
          xp: 30,
          intro:
            'Mezcla de todo lo que has visto: manos duras, blandas y parejas, sin pistas. Recuerda: 4 a 8 mazos y el crupier se planta con 17 blando. Si fallas una, vuelve al final; tómate tu tiempo.',
          ejercicios: [
            {
              id: 'bj-5-1-e1',
              tipo: 'accion',
              situacion: { jugador: ['10', '2'], crupier: '3' },
              pregunta: 'Tienes 12 y el crupier enseña un 3. ¿Qué haces?',
              opciones: PPD,
              correcta: 0,
              explicacion: 'El 12 solo se planta contra 4, 5 o 6. Contra un 3 se pide.',
            },
            {
              id: 'bj-5-1-e2',
              tipo: 'accion',
              situacion: { jugador: ['9', '4'], crupier: '2' },
              pregunta: 'Tienes 13 y el crupier enseña un 2. ¿Qué haces?',
              opciones: PPD,
              correcta: 1,
              explicacion: 'Del 13 al 16 te plantas contra un crupier débil (del 2 al 6): él es quien se puede pasar.',
            },
            {
              id: 'bj-5-1-e3',
              tipo: 'accion',
              situacion: { jugador: ['6', '5'], crupier: '10' },
              pregunta: 'Tienes 11 y el crupier enseña un 10. ¿Qué haces?',
              opciones: PPD,
              correcta: 2,
              explicacion: 'El 11 se dobla contra todo menos el As: con 11 solo una carta de valor 10 te da 21.',
            },
            {
              id: 'bj-5-1-e4',
              tipo: 'accion',
              situacion: { jugador: ['6', '4'], crupier: '9' },
              pregunta: 'Tienes 10 y el crupier enseña un 9. ¿Qué haces?',
              opciones: PPD,
              correcta: 2,
              explicacion: 'El 10 se dobla contra todo del 2 al 9. Con un 10 o un As del crupier solo se pide.',
            },
            {
              id: 'bj-5-1-e5',
              tipo: 'accion',
              situacion: { jugador: ['5', '4'], crupier: '2' },
              pregunta: 'Tienes 9 y el crupier enseña un 2. ¿Qué haces?',
              opciones: PPD,
              correcta: 0,
              explicacion: 'El 9 solo se dobla contra 3 a 6. Contra un 2 se pide.',
            },
            {
              id: 'bj-5-1-e6',
              tipo: 'accion',
              situacion: { jugador: ['A', '7'], crupier: '9' },
              pregunta: 'Tienes As y 7 (18 blando) y el crupier enseña un 9. ¿Qué haces?',
              opciones: PPD,
              correcta: 0,
              explicacion: 'Un 18 blando se planta contra 2, 7 y 8, se dobla contra 3 a 6 y se pide contra 9, 10 y As.',
            },
            {
              id: 'bj-5-1-e7',
              tipo: 'accion',
              situacion: { jugador: ['A', '6'], crupier: '4' },
              pregunta: 'Tienes As y 6 (17 blando) y el crupier enseña un 4. ¿Qué haces?',
              opciones: PPD,
              correcta: 2,
              explicacion: 'El 17 blando se dobla contra 3 a 6: no puedes pasarte con una carta y el crupier está débil.',
            },
            {
              id: 'bj-5-1-e8',
              tipo: 'accion',
              situacion: { jugador: ['A', 'A'], crupier: '6' },
              pregunta: 'Tienes pareja de Ases y el crupier enseña un 6. ¿Qué haces?',
              opciones: PPDD,
              correcta: 3,
              explicacion: 'Los Ases siempre se dividen.',
            },
            {
              id: 'bj-5-1-e9',
              tipo: 'accion',
              situacion: { jugador: ['7', '7'], crupier: '8' },
              pregunta: 'Tienes pareja de 7 y el crupier enseña un 8. ¿Qué haces?',
              opciones: PPDD,
              correcta: 0,
              explicacion: 'Los 7 solo se dividen contra un crupier de 2 a 7. Contra un 8 se pide.',
            },
            {
              id: 'bj-5-1-e10',
              tipo: 'accion',
              situacion: { jugador: ['9', '9'], crupier: '5' },
              pregunta: 'Tienes pareja de 9 y el crupier enseña un 5. ¿Qué haces?',
              opciones: PPDD,
              correcta: 3,
              explicacion: 'Los 9 se dividen contra 2 a 6, 8 y 9. Contra un 5, divide.',
            },
          ],
        },
        {
          id: 'bj-5-2',
          titulo: 'Reto de conteo',
          icono: '🧠',
          xp: 30,
          intro:
            'Última prueba de Hi-Lo: cartas bajas (2 a 6) suman +1, medias (7 a 9) valen 0 y altas (10, J, Q, K, A) restan 1. Después, a convertir la cuenta corriente en cuenta verdadera. ¡A concentrarse!',
          ejercicios: [
            {
              id: 'bj-5-2-e1',
              tipo: 'cuenta_corriente',
              secuencia: ['K', '5', '2', '9', 'A', '6', 'Q', '3'],
              pregunta: 'Salen estas cartas en este orden. ¿Cuál es la cuenta corriente al final?',
              opciones: ['+1', '0', '+2', '-1'],
              correcta: 0,
              explicacion: 'K (-1), 5 (+1), 2 (+1), 9 (0), A (-1), 6 (+1), Q (-1), 3 (+1). Suma total: +1.',
            },
            {
              id: 'bj-5-2-e2',
              tipo: 'cuenta_corriente',
              secuencia: ['4', '4', 'J', '7', '2', '10', '10', 'K'],
              pregunta: 'Salen estas cartas en este orden. ¿Cuál es la cuenta corriente al final?',
              opciones: ['-1', '+1', '0', '-2'],
              correcta: 0,
              explicacion: '4 (+1), 4 (+1), J (-1), 7 (0), 2 (+1), 10 (-1), 10 (-1), K (-1). Suma total: -1.',
            },
            {
              id: 'bj-5-2-e3',
              tipo: 'cuenta_corriente',
              secuencia: ['A', 'K', 'Q', 'J', '10', '9', '8', '7'],
              pregunta: 'Salen estas cartas en este orden. ¿Cuál es la cuenta corriente al final?',
              opciones: ['-5', '-3', '-8', '+5'],
              correcta: 0,
              explicacion: 'Cinco cartas altas (-1 cada una) y tres neutras (9, 8, 7): -5.',
            },
            {
              id: 'bj-5-2-e4',
              tipo: 'cuenta_corriente',
              secuencia: ['2', '3', '4', '5', '6', '2', '3', '4'],
              pregunta: 'Salen estas cartas en este orden. ¿Cuál es la cuenta corriente al final?',
              opciones: ['+8', '+6', '+4', '0'],
              correcta: 0,
              explicacion: 'Las ocho son cartas bajas: +1 cada una. Suma total: +8.',
            },
            {
              id: 'bj-5-2-e5',
              tipo: 'opcion_unica',
              pregunta: 'La cuenta corriente es +12 y quedan 4 mazos. ¿Cuál es la cuenta verdadera?',
              opciones: ['+3', '+12', '+8', '+4'],
              correcta: 0,
              explicacion: '+12 ÷ 4 mazos = +3.',
            },
            {
              id: 'bj-5-2-e6',
              tipo: 'opcion_unica',
              pregunta: 'La cuenta corriente es -10 y quedan 5 mazos. ¿Cuál es la cuenta verdadera?',
              opciones: ['-2', '-10', '-5', '+2'],
              correcta: 0,
              explicacion: '-10 ÷ 5 mazos = -2.',
            },
            {
              id: 'bj-5-2-e7',
              tipo: 'opcion_unica',
              pregunta: 'La cuenta verdadera es +5 y el crupier enseña un As. ¿Qué haces con el seguro?',
              opciones: ['Tomarlo', 'Rechazarlo'],
              correcta: 0,
              explicacion: 'Con +3 o más el seguro es rentable. Con +5, todavía más.',
            },
          ],
        },
      ],
    }
  );
}
