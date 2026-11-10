// Más preguntas interactivas para que TODOS los niveles mezclen tipos (test, ordenar, tocar cartas,
// escribir una cifra y unir parejas). El campo "chequeo" solo lo usa tests/validar.js para recalcular
// la respuesta con código independiente; la app lo ignora.
(function () {
  const sel = (id, pregunta, cartas, correctas, explicacion, extra) => Object.assign({ tipo: 'seleccionar', id, pregunta, cartas, correctas, explicacion }, extra);
  const num = (id, pregunta, respuesta, explicacion, extra) => Object.assign({ tipo: 'numero', id, pregunta, respuesta, explicacion }, extra);
  const emp = (id, pregunta, pares, explicacion, chequeo) => ({ tipo: 'emparejar', id, pregunta, pares, explicacion, chequeo });
  const ord = (id, pregunta, elementos, explicacion, chequeo) => ({ tipo: 'ordenar', id, pregunta, elementos, explicacion, chequeo });

  const nuevos = {
    // ---------------- BLACKJACK ----------------
    'bj-2-1': [
      emp('bj-2-1-x1', 'Une cada situación con la jugada correcta.', [['16 contra un 10', 'Pedir'], ['17 contra un 6', 'Plantarte'], ['11 contra un 6', 'Doblar'], ['8-8 contra un 10', 'Dividir']],
        'Con 16 contra una carta fuerte hay que arriesgar; con 17 te plantas; el 11 es ideal para doblar y los 8 siempre se dividen.',
        [{ jugador: ['10', '6'], crupier: '10' }, { jugador: ['10', '7'], crupier: '6' }, { jugador: ['6', '5'], crupier: '6' }, { jugador: ['8', '8'], crupier: '10' }]),
      sel('bj-2-1-x2', 'Tienes 12 (10 + 2). Toca las cartas del crupier ante las que te plantas.', ['2', '4', '7', '5', '10', '6'], [1, 3, 5],
        'Con 12 te plantas solo si el crupier enseña un 4, 5 o 6: son las cartas con más probabilidad de que se pase.', { chequeo: { jugador: ['10', '2'], accion: 'Plantarte' } }),
    ],
    'bj-2-2': [
      sel('bj-2-2-x1', 'Tienes 9 (5 + 4). Toca las cartas del crupier ante las que doblas.', ['3', '7', '5', '10', '4', '2'], [0, 2, 4],
        'Con 9 se dobla cuando el crupier enseña de 3 a 6. Contra un 2 o contra cartas altas es mejor pedir.', { chequeo: { jugador: ['5', '4'], accion: 'Doblar' } }),
      num('bj-2-2-x2', 'Apuestas 10 fichas y doblas. ¿Cuántas fichas tienes en juego en total?', 20, 'Doblar es poner otra apuesta igual a la inicial: 10 + 10 = 20 fichas.'),
    ],
    'bj-2-3': [
      sel('bj-2-3-x1', 'Toca las cartas de las que SIEMPRE divides la pareja, contra cualquier carta del crupier.', ['A', '10', '8', '5', '9', 'K'], [0, 2],
        'Los Ases y los 8 se dividen siempre. Los 10 y las figuras nunca, el 5 se dobla y el 9 depende del crupier.', { chequeo: { siempreDividir: true } }),
      emp('bj-2-3-x2', 'Une cada pareja con la jugada correcta.', [['A-A contra un 6', 'Dividir'], ['K-K contra un 6', 'Plantarte'], ['5-5 contra un 6', 'Doblar'], ['7-7 contra un 10', 'Pedir']],
        'Los Ases se dividen, el 20 se mantiene, dos 5 son un 10 (se dobla) y 7-7 contra un 10 no se divide.',
        [{ jugador: ['A', 'A'], crupier: '6' }, { jugador: ['K', 'K'], crupier: '6' }, { jugador: ['5', '5'], crupier: '6' }, { jugador: ['7', '7'], crupier: '10' }]),
    ],
    'bj-2-4': [
      emp('bj-2-4-x1', 'Une cada mano blanda con la jugada correcta.', [['A-7 contra un 9', 'Pedir'], ['A-9 contra un 10', 'Plantarte'], ['A-2 contra un 5', 'Doblar'], ['A-A contra un 6', 'Dividir']],
        'Las manos blandas (con un As que vale 11) permiten arriesgar más porque no te pasas con la siguiente carta.',
        [{ jugador: ['A', '7'], crupier: '9' }, { jugador: ['A', '9'], crupier: '10' }, { jugador: ['A', '2'], crupier: '5' }, { jugador: ['A', 'A'], crupier: '6' }]),
      num('bj-2-4-x2', 'Tienes A y 6. ¿Qué total tienes si cuentas el As como 11?', 17, 'A (11) + 6 = 17. Es una mano blanda: si pides y te pasas, el As pasa a valer 1.', { situacion: { jugador: ['A', '6'], crupier: '5' } }),
    ],
    'bj-3-4': [
      ord('bj-3-4-x1', 'Ordena estas cuentas verdaderas, de la que más te favorece a la que menos.', ['+5', '+2', '0', '−3'], 'Cuanto más alta es la cuenta verdadera, más cartas altas quedan en el mazo y más te favorece.', { numeros: [5, 2, 0, -3] }),
      num('bj-3-4-x2', 'La cuenta corriente es +10 y quedan 5 mazos. ¿Cuánto vale la cuenta verdadera?', 2, 'Cuenta verdadera = 10 ÷ 5 = +2: ya es momento de subir la apuesta.'),
    ],
    'bj-3-5': [
      num('bj-3-5-x1', 'La cuenta corriente es -8 y quedan 4 mazos. ¿Cuánto vale la cuenta verdadera?', -2, 'Cuenta verdadera = -8 ÷ 4 = -2. Es negativa: el mazo está cargado de cartas bajas.'),
      sel('bj-3-5-x2', 'Toca las cartas que RESTAN 1 en el Hi-Lo.', ['9♦', 'K♣', '4♠', 'A♥', '7♣', 'Q♦'], [1, 3, 5], 'Restan 1 las cartas del 10 al As: la K, el A y la Q.'),
    ],
    'bj-4-1': [
      num('bj-4-1-x1', 'Tu apuesta es de 20 fichas. ¿Cuánto es el máximo que puedes poner al seguro?', 10, 'El seguro es de hasta la mitad de tu apuesta: 20 ÷ 2 = 10 fichas.'),
      emp('bj-4-1-x2', 'Une cada término con su significado.', [['Seguro', 'Apuesta extra de hasta la mitad que paga 2 a 1'], ['Blackjack natural', 'Paga 3 a 2'], ['Rendirse', 'Pierdes la mitad y te retiras']], 'Son tres opciones distintas del crupier y de la mesa; conviene conocer lo que paga cada una.'),
    ],
    'bj-4-2': [
      num('bj-4-2-x1', 'Apuestas 40 fichas y te rindes. ¿Cuántas fichas pierdes?', 20, 'Al rendirte pierdes solo la mitad de la apuesta: 40 ÷ 2 = 20 fichas.'),
      num('bj-4-2-x2', 'Haces blackjack natural con una apuesta de 20 fichas en una mesa que paga 6 a 5. ¿Cuántas fichas ganas?', 24, 'Pagar 6 a 5 es ganar 6 por cada 5 apostados: 20 × 6 ÷ 5 = 24 fichas. En una mesa de 3 a 2 serían 30.'),
      ord('bj-4-2-x3', 'Ordena estas mesas, de la que más paga por un blackjack a la que menos.', ['3 a 2', '6 a 5', '1 a 1'], 'Pagar 3 a 2 es 1,5 veces la apuesta, 6 a 5 es 1,2 veces y 1 a 1 es solo 1 vez.', { fracciones: [[3, 2], [6, 5], [1, 1]] }),
    ],
    'bj-4-3': [
      num('bj-4-3-x1', 'Tu bankroll es de 200 € y decides perder como máximo el 25 %. ¿Cuántos euros es tu límite de pérdida?', 50, '25 % de 200 € = 50 €. Al llegar a esa cifra, paras.'),
      emp('bj-4-3-x2', 'Une cada término con su significado.', [['Bankroll', 'Dinero reservado solo para jugar'], ['Martingala', 'Doblar la apuesta tras cada pérdida'], ['Límite de pérdida', 'Cantidad que decides no pasar antes de empezar']], 'El bankroll y el límite se deciden antes de jugar; la martingala es una trampa porque los límites de la mesa cortan la racha.'),
    ],
    'bj-5-1': [
      sel('bj-5-1-x1', 'Tienes 16 (10 + 6). Toca las cartas del crupier ante las que te plantas.', ['2', '9', '5', 'A', '3', '7', '6'], [0, 2, 4, 6], 'Con 16 te plantas contra cartas débiles (2 a 6) y pides contra 7 o más.', { chequeo: { jugador: ['10', '6'], accion: 'Plantarte' } }),
      emp('bj-5-1-x2', 'Une cada mano con la jugada correcta.', [['12 contra un 3', 'Pedir'], ['10 contra un 6', 'Doblar'], ['18 contra un 10', 'Plantarte'], ['9-9 contra un 6', 'Dividir']], 'Repaso de las cuatro jugadas: pedir, doblar, plantarte y dividir.',
        [{ jugador: ['7', '5'], crupier: '3' }, { jugador: ['6', '4'], crupier: '6' }, { jugador: ['10', '8'], crupier: '10' }, { jugador: ['9', '9'], crupier: '6' }]),
    ],
    'bj-5-2': [
      num('bj-5-2-x1', 'Salen estas cartas en este orden. ¿Cuánto vale la cuenta corriente? Escribe el número.', 3, '2 (+1), 5 (+1), K (-1), 6 (+1), 9 (0), 4 (+1), J (-1), 3 (+1). Total: +3.', { secuencia: ['2', '5', 'K', '6', '9', '4', 'J', '3'] }),
      num('bj-5-2-x2', 'La cuenta corriente es +9 y quedan 3 mazos. ¿Cuánto vale la cuenta verdadera?', 3, 'Cuenta verdadera = 9 ÷ 3 = +3.'),
    ],
    'bj-3-1': [
      num('bj-3-1-x1', 'Salen un 3, una K y un 9. ¿Cuánto vale la cuenta corriente? Escribe el número.', 0, '3 (+1), K (-1), 9 (0). Total: 0.', { secuencia: ['3', 'K', '9'] }),
    ],
    // ---------------- PÓKER ----------------
    'pk-1-1': [
      ord('pk-1-1-x1', 'Ordena las cartas comunes, según salen en la mesa.', ['Flop (3 cartas)', 'Turn (1 carta)', 'River (1 carta)'], 'Primero salen tres cartas juntas (flop), luego una (turn) y por último otra (river).'),
      num('pk-1-1-x2', 'Con tus 2 cartas privadas y las 5 comunes, ¿cuántas cartas tienes en total para armar tu mano?', 7, '2 + 5 = 7 cartas, de las que usas las 5 mejores.'),
      num('pk-1-1-x3', 'De esas 7 cartas, ¿cuántas cuentan para tu mano final?', 5, 'La mano de póker siempre se forma con 5 cartas: las 5 mejores de las 7 que tienes.'),
    ],
    'pk-2-1': [
      sel('pk-2-1-x1', 'Tienes cuatro corazones (A♥, 7♥ en tu mano y K♥, 4♥ en la mesa). Toca las cartas del mazo que te dan color de corazones.', ['2♥', '9♠', 'Q♥', '5♦', 'J♥', '8♣', '3♥'], [0, 2, 4, 6], 'Cualquier corazón que salga completa el color. Quedan 9 corazones en el mazo.'),
      num('pk-2-1-x2', 'Tienes 4 cartas de un mismo palo entre tu mano y la mesa. ¿Cuántas quedan en el mazo de ese palo?', 9, 'Cada palo tiene 13 cartas: 13 - 4 = 9 outs para el color.'),
    ],
    'pk-2-2': [
      emp('pk-2-2-x1', 'Une cada proyecto con sus outs.', [['Proyecto de color', '9 outs'], ['Escalera abierta', '8 outs'], ['Escalera de pulmón (gutshot)', '4 outs'], ['Dos cartas altas sin pareja', '6 outs']], 'Son los cuatro casos que más se repiten; luego multiplicas por 4 (flop) o por 2 (turn).'),
    ],
    'pk-3-2': [
      ord('pk-3-2-x1', 'Ordena los pasos para decidir si pagar con pot odds.', ['Miras cuánto tienes que pagar', 'Calculas el bote final', 'Divides lo que pagas entre el bote final', 'Lo comparas con tu probabilidad de ganar'], 'Si tu probabilidad es mayor que el porcentaje que pagas, pagar compensa a la larga.'),
    ],
    'pk-4-1': [
      ord('pk-4-1-x1', 'Ordena las posiciones empezando por el botón, en el sentido del reparto.', ['Botón', 'Ciega pequeña', 'Ciega grande'], 'Después del botón vienen la ciega pequeña y la grande, y luego el resto de jugadores.'),
    ],
    'pk-3-1': [
      ord('pk-3-1-x1', 'Ordena estas manos iniciales, de la más fuerte a la más débil.', ['Pareja de ases', 'Pareja de reyes', 'A-K del mismo palo', '7-2 de distinto palo'], 'Las parejas altas encabezan la lista, después va A-K y lo peor de todo es 7-2 sin color.'),
      emp('pk-3-1-x2', 'Une cada posición con cuándo habla después del flop.', [['Botón', 'Habla el último'], ['Ciega pequeña', 'Habla el primero'], ['Ciega grande', 'Habla el segundo']], 'Después del flop se habla empezando por la ciega pequeña y acabando en el botón.'),
    ],
    'pk-4-2': [
      ord('pk-4-2-x1', 'Ordena estas posiciones, de la mejor a la peor después del flop.', ['Botón', 'Cutoff (a su derecha)', 'Ciega grande', 'Ciega pequeña'], 'Cuanto más tarde hablas, mejor. La ciega pequeña es la peor porque habla la primera.'),
      emp('pk-4-2-x2', 'Une cada posición con su significado.', [['Posición temprana', 'Hablas de los primeros'], ['Posición tardía', 'Hablas de los últimos'], ['Botón', 'La mejor posición de la mesa']], 'Hablar tarde te da información; por eso la posición vale casi tanto como las cartas.'),
    ],
    'pk-5-1': [
      num('pk-5-1-x1', '¿De cuántas maneras distintas se puede formar la pareja de reyes?', 6, 'Hay 4 reyes y eliges 2: 6 combinaciones, igual que con los ases.'),
      emp('pk-5-1-x2', 'Une cada mano inicial con sus combinaciones posibles.', [['Pareja de ases', '6 combinaciones'], ['A-K de cualquier palo', '16 combinaciones'], ['A-K del mismo palo', '4 combinaciones']], 'Una pareja concreta tiene 6 combinaciones; A-K tiene 4 × 4 = 16, de las que 4 son del mismo palo.', [6, 16, 4]),
    ],
    'pk-5-2': [
      sel('pk-5-2-x1', 'Tienes 9♠ 8♠ y la mesa es 7♣ 6♦ K♥. Toca las cartas del mazo que te completan la escalera.', ['5♥', '10♦', '2♣', 'J♠', 'K♠', '5♠', '10♣'], [0, 1, 5, 6], 'Te sirve un 5 o un 10: son 8 outs en total (4 cincos y 4 dieces).', { situacion: { filas: [{ etiqueta: 'Tu mano', cartas: ['9♠', '8♠'] }, { etiqueta: 'Mesa', cartas: ['7♣', '6♦', 'K♥'] }] } }),
      num('pk-5-2-x2', 'En el flop tienes 12 outs. ¿Qué probabilidad aproximada tienes de completar tu mano con la regla del 4 y el 2?', 48, 'En el flop se multiplican los outs por 4: 12 × 4 = 48 %.', { unidad: '%' }),
    ],
    'pk-6-1': [
      emp('pk-6-1-x1', 'Une cada mano de cinco cartas con su nombre.', [['K♠ K♥ K♦ 2♣ 5♠', 'Trío'], ['9♥ 8♥ 7♥ 4♥ 2♥', 'Color'], ['A♣ A♦ 4♠ 4♥ 9♣', 'Doble pareja'], ['5♠ 6♦ 7♣ 8♥ 9♠', 'Escalera']], 'Fíjate en los valores (repetidos o consecutivos) y en los palos (todos iguales o no).'),
      sel('pk-6-1-x2', 'Toca las cartas que forman la doble pareja.', ['9♠', '4♥', '9♦', 'Q♣', '4♣', '2♠'], [0, 1, 2, 4], 'Hay dos nueves y dos cuatros: son las dos parejas. La Q y el 2 quedan fuera.'),
    ],
    'pk-6-2': [
      sel('pk-6-2-x1', 'Tienes siete cartas. Toca las cinco que forman tu mejor mano (una escalera).', ['4♣', '5♦', '6♠', '7♥', '8♣', 'K♦', '2♠'], [0, 1, 2, 3, 4], '4-5-6-7-8 son cinco valores consecutivos: escalera. La K y el 2 sobran.'),
      num('pk-6-2-x2', 'Con tus 2 cartas y las 5 de la mesa tienes 7 cartas. ¿Cuántas manos distintas de 5 cartas se pueden formar con ellas?', 21, 'Se eligen 5 de 7: 7 × 6 ÷ 2 = 21 combinaciones. El juego elige siempre la mejor.'),
    ],
    'pk-6-3': [
      emp('pk-6-3-x1', 'Une cada término con su significado.', [['Apuesta de valor', 'Apuestas fuerte para que te paguen'], ['Farol', 'Apuestas con una mano floja para que el rival se retire'], ['Semi-farol', 'Apuestas con un proyecto que todavía puede mejorar'], ['Jugador tight', 'Juega pocas manos y muy selectas']], 'Valor y farol son las dos razones para apostar; el semi-farol tiene un poco de las dos.'),
      ord('pk-6-3-x2', 'Ordena estos estilos, del que juega menos manos al que juega más.', ['Muy cerrado (tight)', 'Normal', 'Suelto (loose)'], 'Un jugador cerrado juega pocas manos; uno suelto juega muchas más.'),
    ],
    // ---------------- MUS ----------------
    'ms-1-1': [
      emp('ms-1-1-x1', 'Une cada carta con lo que vale o cuenta en el mus.', [['Rey', 'Vale 10 puntos'], ['Tres', 'Cuenta como un rey'], ['Dos', 'Cuenta como un as'], ['As', 'Vale 1 punto']], 'En el mus de 8 reyes el 3 se considera rey y el 2 se considera as.'),
      num('ms-1-1-x2', '¿Cuántas cartas tiene la baraja española que se usa en el mus?', 40, 'Son 4 palos de 10 cartas (sin 8 ni 9): 40 cartas.'),
      num('ms-1-1-x3', '¿Cuántas cartas recibe cada jugador al repartir?', 4, 'Cada jugador empieza con 4 cartas.'),
    ],
    'ms-2-2': [
      ord('ms-2-2-x1', 'Ordena estos juegos, del mejor al peor.', ['31', '32', '40', '37'], 'El orden de los juegos en el mus es especial: 31 es el mejor, después 32, 40, 37, 36, 35, 34 y 33.', { ordenJuego: true }),
      emp('ms-2-2-x2', 'Une cada resultado con las piedras que vale (sin envites).', [['Juego de 31', '3 piedras'], ['Otro juego (32 a 40)', '2 piedras'], ['Punto', '1 piedra']], 'Tener 31 vale 3 piedras; los demás juegos valen 2, y ganar el punto vale 1.'),
    ],
    'ms-2-1': [
      sel('ms-2-1-x1', 'Toca las cartas que forman las medias.', ['Caballo', '5', 'Caballo', 'Caballo'], [0, 2, 3], 'Las medias son tres cartas iguales: aquí, los tres caballos.'),
      emp('ms-2-1-x2', 'Une cada jugada de pares con lo que es.', [['Pareja', 'Dos cartas iguales'], ['Medias', 'Tres cartas iguales'], ['Duples', 'Dos parejas o cuatro cartas iguales']], 'Pareja, medias y duples van de menos a más.'),
    ],
    'ms-3-1': [
      emp('ms-3-1-x1', 'Une cada expresión con lo que significa.', [['Paso', 'No apuestas'], ['Envido', 'Apuestas 2 piedras'], ['Quiero', 'Aceptas la apuesta'], ['No quiero', 'Te retiras del lance'], ['Órdago', 'Apuestas todo lo que falta para ganar']], 'Son las cinco frases básicas para hablar en la mesa.'),
      ord('ms-3-1-x2', 'Ordena lo que pasa si te envidan y aceptas.', ['Un rival envida', 'Tú dices «quiero»', 'Se enseñan las cartas', 'Gana el lance quien tenga mejor mano'], 'El envite se acepta con «quiero» y entonces se comparan las manos.'),
    ],
    'ms-3-2': [
      sel('ms-3-2-x1', 'Tienes Rey, Rey, 5 y 4. Toca las cartas que descartas normalmente.', ['Rey', 'Rey', '5', '4'], [2, 3], 'Te quedas con la pareja de reyes y cambias el 5 y el 4.', { chequeo: { descarta: true } }),
      num('ms-3-2-x2', '¿Cuántas cartas puedes cambiar como máximo en un descarte?', 4, 'Puedes cambiar entre 1 y 4 cartas: hasta toda la mano.'),
    ],
    'ms-3-3': [
      num('ms-3-3-x1', 'Tu pareja lleva 23 piedras. ¿Cuántos amarracos completos son?', 4, 'Un amarraco son 5 piedras: 23 ÷ 5 = 4 amarracos y 3 piedras sueltas.'),
      num('ms-3-3-x2', 'Si llevas 28 piedras, ¿cuántas te faltan para llegar a 40?', 12, '40 - 28 = 12 piedras.'),
      emp('ms-3-3-x3', 'Une cada jugada con las piedras que vale (sin envites).', [['Ganar la Grande', '1 piedra'], ['Medias', '2 piedras'], ['Duples', '3 piedras']], 'Sin envites: Grande y Chica valen 1; en Pares, la pareja vale 1, las medias 2 y los duples 3.'),
    ],
    'ms-3-4': [
      ord('ms-3-4-x1', 'Ordena estas manos, de la mejor a la peor en la Grande.', ['Rey · Rey · Caballo · 5', 'Rey · Caballo · Sota · 7', 'Rey · Sota · 6 · 5', 'Caballo · Caballo · 7 · 4'], 'En la Grande se comparan las cartas de mayor a menor: gana quien tiene más reyes y, si empatan, la siguiente más alta.',
        { lance: 'Grande', manos: [['Rey', 'Rey', 'Caballo', '5'], ['Rey', 'Caballo', 'Sota', '7'], ['Rey', 'Sota', '6', '5'], ['Caballo', 'Caballo', '7', '4']] }),
      num('ms-3-4-x2', 'Tu mano es Rey, Caballo, As y As. ¿Cuántos puntos tienes?', 22, 'Rey (10) + Caballo (10) + As (1) + As (1) = 22: no llegas a 31, así que se juega al punto.', { situacion: { filas: [{ etiqueta: 'Tu mano', cartas: ['Rey', 'Caballo', 'As', 'As'] }] } }),
    ],
  };

  // Reparte los ejercicios de cada nivel para que no haya bloques del mismo tipo:
  // los de otros tipos se colocan a intervalos regulares desde el segundo ejercicio.
  function repartirTipos(lista) {
    const base = lista.filter((e) => e.tipo === lista[0].tipo);
    const otros = lista.filter((e) => e.tipo !== lista[0].tipo);
    if (!otros.length) return lista;
    // se alternan los tipos distintos para que no queden juntos
    const porTipo = {};
    otros.forEach((e) => (porTipo[e.tipo] = (porTipo[e.tipo] || []).concat([e])));
    const cola = [];
    while (Object.keys(porTipo).length) {
      for (const t of Object.keys(porTipo)) {
        cola.push(porTipo[t].shift());
        if (!porTipo[t].length) delete porTipo[t];
      }
    }
    const total = lista.length;
    const huecos = new Set(cola.map((_, k) => Math.min(total - 1, Math.floor(1 + (k * (total - 1)) / cola.length))));
    // por si dos caen en el mismo hueco, se desplazan al siguiente libre
    const usados = [];
    cola.forEach((_, k) => {
      let h = Math.min(total - 1, Math.floor(1 + (k * (total - 1)) / cola.length));
      while (usados.includes(h)) h = (h + 1) % total;
      usados.push(h);
    });
    const resultado = new Array(total);
    usados.forEach((h, k) => (resultado[h] = cola[k]));
    let b = 0;
    for (let i = 0; i < total; i++) if (!resultado[i]) resultado[i] = base[b++];
    return resultado;
  }

  for (const curso of CURSOS)
    for (const u of curso.unidades)
      for (const l of u.lecciones) {
        (nuevos[l.id] || []).forEach((e) => l.ejercicios.push(e));
        l.ejercicios = repartirTipos(l.ejercicios);
      }
})();
