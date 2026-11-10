// Ejercicios interactivos que no son de tipo test (se añaden a niveles ya existentes):
//   seleccionar: tocar las cartas que cumplen algo        { cartas, correctas: [posiciones] }
//   numero:      escribir una cifra                       { respuesta, unidad? }
//   emparejar:   unir cada término con su significado     { pares: [[izquierda, derecha], ...] }
(function () {
  const nuevos = {
    'bj-1-1': [
      { tipo: 'seleccionar', id: 'bj-1-1-s1', pregunta: 'Toca todas las cartas que valen 10 en el blackjack.', cartas: ['K♠', '5♦', 'Q♥', '10♣', 'A♠', '9♦', 'J♦'], correctas: [0, 2, 3, 6], explicacion: 'Las figuras (J, Q, K) y el 10 valen 10. El As vale 1 u 11 y el resto valen lo que marcan.' },
      { tipo: 'numero', id: 'bj-1-1-n1', pregunta: 'Tienes A, 7 y 9. ¿Qué total tienes?', situacion: { jugador: ['A', '7', '9'], crupier: '6' }, respuesta: 17, explicacion: 'Con el As como 11 sumarías 27 y te pasarías, así que vale 1: 1 + 7 + 9 = 17.' },
    ],
    'bj-1-2': [
      { tipo: 'emparejar', id: 'bj-1-2-m1', pregunta: 'Une cada jugada con lo que significa.', pares: [['Plantarte', 'No pides más cartas'], ['Pedir', 'Recibes otra carta'], ['Doblar', 'Doblas la apuesta y recibes una sola carta'], ['Dividir', 'Separas una pareja en dos manos']], explicacion: 'Plantarte y pedir son las jugadas básicas; doblar y dividir te dejan jugar con más dinero cuando la situación te favorece.' },
    ],
    'bj-3-1': [
      { tipo: 'seleccionar', id: 'bj-3-1-s1', pregunta: 'Toca las cartas que SUMAN +1 en el Hi-Lo.', cartas: ['5♠', 'K♥', '8♦', '2♣', 'A♠', '6♥'], correctas: [0, 3, 5], explicacion: 'Suman +1 las cartas del 2 al 6: aquí el 5, el 2 y el 6. La K y el A restan y el 8 es neutro.' },
      { tipo: 'seleccionar', id: 'bj-3-1-s2', pregunta: 'Toca las cartas que RESTAN 1 en el Hi-Lo.', cartas: ['10♣', '7♦', 'Q♠', '3♥', '9♣', 'A♦'], correctas: [0, 2, 5], explicacion: 'Restan 1 las cartas del 10 al As: el 10, la Q y el A. El 7 y el 9 valen 0 y el 3 suma 1.' },
    ],
    'bj-3-2': [
      { tipo: 'seleccionar', id: 'bj-3-2-s1', pregunta: 'Toca las cartas neutras (valen 0) en el Hi-Lo.', cartas: ['4♦', '9♠', '8♥', 'J♣', '7♠', '2♥'], correctas: [1, 2, 4], explicacion: 'Las cartas del 7 al 9 no cambian la cuenta: el 9, el 8 y el 7.' },
      { tipo: 'numero', id: 'bj-3-2-n1', pregunta: 'Salen estas cartas en este orden. ¿Cuánto vale la cuenta corriente? Escribe el número.', secuencia: ['4', 'K', '3', '3', 'Q', '6', '8'], respuesta: 2, explicacion: '4 (+1), K (-1), 3 (+1), 3 (+1), Q (-1), 6 (+1), 8 (0). Total: +2.' },
      { tipo: 'numero', id: 'bj-3-2-n2', pregunta: 'Salen estas cartas en este orden. ¿Cuánto vale la cuenta corriente? Escribe el número.', secuencia: ['A', '10', '9', 'K', '2', '7'], respuesta: -2, explicacion: 'A (-1), 10 (-1), 9 (0), K (-1), 2 (+1), 7 (0). Total: -2.' },
    ],
    'bj-3-3': [
      { tipo: 'numero', id: 'bj-3-3-n1', pregunta: 'La cuenta corriente es +6 y quedan 2 mazos. ¿Cuánto vale la cuenta verdadera?', respuesta: 3, explicacion: 'Cuenta verdadera = cuenta corriente ÷ mazos que quedan: 6 ÷ 2 = 3.' },
      { tipo: 'numero', id: 'bj-3-3-n2', pregunta: 'La cuenta corriente es +8 y quedan 4 mazos. ¿Cuánto vale la cuenta verdadera?', respuesta: 2, explicacion: 'Cuenta verdadera = cuenta corriente ÷ mazos que quedan: 8 ÷ 4 = 2.' },
    ],
    'pk-1-2': [
      { tipo: 'seleccionar', id: 'pk-1-2-s1', pregunta: 'Tienes siete cartas. Toca las cinco que forman el color (mismo palo).', cartas: ['A♥', '7♠', 'K♥', '2♥', '9♣', 'J♥', '5♥'], correctas: [0, 2, 3, 5, 6], explicacion: 'Hay cinco corazones: A, K, 2, J y 5. Con cinco cartas del mismo palo tienes color.' },
      { tipo: 'seleccionar', id: 'pk-1-2-s2', pregunta: 'Toca las cartas que forman el trío.', cartas: ['9♠', '4♥', '9♦', '9♣', 'Q♠'], correctas: [0, 2, 3], explicacion: 'Tres cartas del mismo valor forman un trío: los tres nueves.' },
    ],
    'pk-3-2': [
      { tipo: 'numero', id: 'pk-3-2-n1', pregunta: 'El bote tiene 100 fichas y debes pagar 25 para ver la siguiente carta. ¿Qué porcentaje del bote final pondrías tú? (redondea)', unidad: '%', respuesta: 20, explicacion: 'Pot odds = lo que pagas ÷ (bote + lo que pagas) = 25 ÷ 125 = 20 %.' },
    ],
    'pk-2-2': [
      { tipo: 'numero', id: 'pk-2-2-n1', pregunta: 'En el flop tienes 8 outs. ¿Qué probabilidad aproximada tienes de completar tu jugada con la regla del 4 y el 2?', unidad: '%', respuesta: 32, explicacion: 'En el flop se multiplican los outs por 4: 8 × 4 = 32 %.' },
      { tipo: 'numero', id: 'pk-2-2-n2', pregunta: 'En el turn tienes 9 outs. ¿Qué probabilidad aproximada tienes de completar tu jugada con la regla del 4 y el 2?', unidad: '%', respuesta: 18, explicacion: 'En el turn se multiplican los outs por 2: 9 × 2 = 18 %.' },
    ],
    'pk-4-1': [
      { tipo: 'emparejar', id: 'pk-4-1-m1', pregunta: 'Une cada término con lo que significa.', pares: [['Botón', 'Marca quién reparte y habla el último'], ['Ciega pequeña', 'Apuesta obligatoria a la izquierda del botón'], ['Ciega grande', 'Apuesta obligatoria, normalmente el doble que la pequeña']], explicacion: 'Las ciegas obligan a poner fichas en cada mano; el botón rota para que todos pasen por todas las posiciones.' },
    ],
    'pk-4-3': [
      { tipo: 'emparejar', id: 'pk-4-3-m1', pregunta: 'Une cada ronda con lo que ocurre en ella.', pares: [['Preflop', 'Cada jugador recibe sus dos cartas'], ['Flop', 'Salen tres cartas comunes'], ['Turn', 'Sale la cuarta carta común'], ['River', 'Sale la quinta y última carta común']], explicacion: 'Después de cada ronda de cartas hay una ronda de apuestas.' },
    ],
    'ms-1-1': [
      { tipo: 'seleccionar', id: 'ms-1-1-s1', pregunta: 'Toca las cartas que valen 10 puntos en el mus.', cartas: ['Rey', 'As', '3', 'Caballo', '5', '2', 'Sota'], correctas: [0, 2, 3, 6], explicacion: 'Valen 10 el Rey, el Caballo, la Sota y el 3. El As y el 2 valen 1 y las demás valen lo que marcan.' },
    ],
    'ms-1-2': [
      { tipo: 'emparejar', id: 'ms-1-2-m1', pregunta: 'Une cada lance con lo que se juega.', pares: [['Grande', 'Gana quien tiene las cartas más altas'], ['Chica', 'Gana quien tiene las cartas más bajas'], ['Pares', 'Parejas, medias o duples'], ['Juego', 'Cartas que suman 31 o más']], explicacion: 'Los lances se juegan en orden: grande, chica, pares y juego (o punto si nadie tiene juego).' },
    ],
    'ms-2-2': [
      { tipo: 'numero', id: 'ms-2-2-n1', pregunta: 'Tu mano es Rey, 7, Sota y 4. ¿Cuántos puntos tienes?', situacion: { filas: [{ etiqueta: 'Tu mano', cartas: ['Rey', '7', 'Sota', '4'] }] }, respuesta: 31, explicacion: 'Rey (10) + 7 + Sota (10) + 4 = 31: tienes juego, y además es la mejor puntuación.' },
      { tipo: 'numero', id: 'ms-2-2-n2', pregunta: 'Tu mano es Caballo, 6, As y 2. ¿Cuántos puntos tienes?', situacion: { filas: [{ etiqueta: 'Tu mano', cartas: ['Caballo', '6', 'As', '2'] }] }, respuesta: 18, explicacion: 'Caballo (10) + 6 + As (1) + 2 (1) = 18: no llega a 31, así que juegas al punto.' },
    ],
  };
  for (const curso of CURSOS)
    for (const u of curso.unidades)
      for (const l of u.lecciones)
        (nuevos[l.id] || []).forEach((e) => l.ejercicios.push(e));
})();
