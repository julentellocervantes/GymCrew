// Ejercicios de tipo "ordenar": hay que colocar los elementos en el orden correcto.
// "elementos" está escrito YA en el orden correcto; la app los mezcla al mostrarlos.
(function () {
  const nuevos = {
    'bj-1-1': [{ id: 'bj-1-1-o1', pregunta: 'Ordena estas manos de blackjack, de la peor a la mejor.', elementos: ['Pasarte de 21', 'Sumar 17', 'Sumar 20', 'Sumar 21 con tres cartas', 'Blackjack (As + carta de 10)'], explicacion: 'Pasarte pierde siempre. Después gana el total más alto, y un blackjack natural (21 con solo dos cartas) vence a cualquier otro 21.' }],
    'bj-1-2': [{ id: 'bj-1-2-o1', pregunta: 'Ordena los pasos de una mano de blackjack.', elementos: ['Haces tu apuesta', 'Se reparten las cartas', 'Decides tu jugada', 'Juega el crupier', 'Se pagan las apuestas'], explicacion: 'Se apuesta antes de ver las cartas, tú juegas primero y el crupier cierra la mano; al final se cobra o se paga.' }],
    'bj-3-3': [{ id: 'bj-3-3-o1', pregunta: 'Ordena los pasos para calcular la cuenta verdadera.', elementos: ['Llevas la cuenta corriente', 'Calculas cuántos mazos quedan', 'Divides la cuenta entre los mazos', 'Decides cuánto apostar'], explicacion: 'Cuenta verdadera = cuenta corriente ÷ mazos que quedan en el zapato. Con ese número decides tu apuesta.' }],
    'pk-1-2': [{ id: 'pk-1-2-o1', pregunta: 'Ordena estas manos de póker, de la más débil a la más fuerte.', elementos: ['Pareja', 'Doble pareja', 'Trío', 'Escalera', 'Color', 'Full'], explicacion: 'El ranking sube así: pareja, doble pareja, trío, escalera, color, full, póker y escalera de color.' }],
    'pk-4-3': [{ id: 'pk-4-3-o1', pregunta: 'Ordena las rondas de una mano de Texas Hold\'em.', elementos: ['Preflop', 'Flop', 'Turn', 'River'], explicacion: 'Primero se reparten las dos cartas privadas (preflop), luego salen tres comunes (flop), una cuarta (turn) y una quinta (river).' }],
    'ms-1-2': [{ id: 'ms-1-2-o1', pregunta: 'Ordena los lances del mus, del primero al último.', elementos: ['Grande', 'Chica', 'Pares', 'Juego'], explicacion: 'Se juegan en este orden: grande, chica, pares y juego (o punto si nadie tiene juego).' }],
    'ms-2-1': [{ id: 'ms-2-1-o1', pregunta: 'Ordena estas jugadas de pares, de menor a mayor.', elementos: ['Pareja', 'Medias (trío)', 'Duples'], explicacion: 'Unas medias (tres cartas iguales) ganan a una pareja, y los duples (dos parejas o cuatro iguales) ganan a las medias.' }],
  };
  for (const curso of CURSOS)
    for (const u of curso.unidades)
      for (const l of u.lecciones)
        (nuevos[l.id] || []).forEach((e) => l.ejercicios.push(Object.assign({ tipo: 'ordenar' }, e)));
})();
