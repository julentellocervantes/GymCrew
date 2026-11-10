# Entrenador de cartas (estilo Duolingo)

Web app hecha solo con HTML, CSS y JavaScript. No necesita Node, Expo ni instalar paquetes: se abre con **Live Server** en Visual Studio Code.

Pantallas: **elegir juego → mapa de niveles → Nai te explica el nivel → ejercicios → resultado**.
Nai es la mascota: te saluda, te explica cada nivel, lee las preguntas y reacciona cuando aciertas o fallas.

## Cómo abrirla

1. Instala **Visual Studio Code**: https://code.visualstudio.com
2. Descomprime el zip y abre la carpeta `entrenador-cartas` (*Archivo → Abrir carpeta*).
3. Instala la extensión **Live Server** (autor: Ritwick Dey). VS Code te la sugerirá al abrir la carpeta.
4. Abre `index.html` y pulsa **Go Live** (abajo a la derecha), o clic derecho sobre `index.html` → **Open with Live Server**.
5. Cada vez que guardes un archivo, la página se recarga sola.

**En el móvil:** con Live Server en marcha, abre `http://IP-DE-TU-PC:5500` en el navegador del móvil (misma wifi que el PC). Si no carga, puede que el cortafuegos de Windows esté bloqueando el puerto 5500.

## Qué contiene

| Juego | Niveles | Estado |
|---|---|---|
| Blackjack | 16 | Estrategia básica, conteo Hi-Lo y desviaciones, seguro, rendición, dinero y retos |
| Póker (Texas Hold'em) | 14 | Manos, outs, pot odds, ciegas, posición, rondas, probabilidades, quién gana |
| Mus | 8 | Baraja, lances, hablar, descartes, piedras y comparar manos (8 reyes) |

Los niveles se desbloquean en orden. Puedes repetir cualquiera que ya hayas completado.

## Extras

- **Repaso rápido** (en cada mapa, cuando ya has completado algún nivel): 8 preguntas al azar de lo que ya has hecho. Da XP según tus aciertos, pero no desbloquea niveles.
- **Rangos** según tu XP (Novato, Aprendiz, Jugador, Tahúr, Maestro, Leyenda) y **10 logros**. Se ven pulsando la tarjeta de rango del inicio.
- **Meta diaria** (10, 20, 30 o 50 XP, la eliges en Ajustes) con un anillo en el inicio. Cada 7 días de racha ganas un **congelador** 🧊 (máximo 2) que salva la racha si te saltas un día.
- **Repetición espaciada**: cada pregunta que respondes se apunta. Si aciertas, tarda más en volver (1, 2, 4, 8 y 16 días); si fallas, vuelve hoy. En el inicio aparecen **Repaso del día** y **Mis errores**, que mezclan preguntas de todos los juegos.
- **Preguntas interactivas** (no solo tipo test): **ordenar** fichas (pasos de una mano, ranking de manos), **tocar las cartas** que cumplen algo (p. ej. las que suman +1 en el Hi-Lo), **escribir una cifra** (cuenta corriente, total de la mano, outs, pot odds, cuenta verdadera, puntos del mus) y **unir parejas** (término ↔ significado).
- **Entrena el conteo**: cartas una a una a la velocidad que elijas (2 s, 1,2 s o 0,7 s) y al final dices la cuenta Hi-Lo. Se guarda tu récord en cartas por minuto.
- **Efectos de sonido**: clic al pulsar, acierto, error, pareja unida, carta repartida en el conteo, fanfarria al terminar un nivel y sonidos para meta diaria, logro y nuevo rango. Se generan con Web Audio (no hay archivos de audio, así que funcionan sin conexión) y se desactivan en Ajustes.
- **Ajustes**: meta diaria, letra grande, menos movimiento, sonido, **copia de seguridad** (descargar y restaurar un archivo .json) y enlace de ayuda por si el juego con dinero te preocupa.
- **Accesibilidad**: las cartas tienen nombre para lectores de pantalla (p. ej. «rey de picas»), la barra de progreso y el feedback se anuncian, y el foco pasa a «Continuar» al responder.

## Instalarla como app (PWA)

Si la web está publicada (https), el navegador te ofrece **instalarla** en el móvil o el ordenador: aparece un botón «Instala la app» en el inicio. En iPhone: Compartir → «Añadir a pantalla de inicio». Una vez instalada **funciona sin conexión**.

- `manifest.webmanifest`, `icons/` y `sw.js` hacen que sea instalable. Con conexión siempre carga la versión más nueva; sin conexión usa la guardada.
- En tu ordenador (`localhost`, Live Server) el modo sin conexión **no se activa**, para que veas siempre tus cambios. Para probarlo, abre `http://127.0.0.1:5500/index.html?pwa`.
- Si añades archivos nuevos (por ejemplo `data/otro.js`), añádelos también a la lista `ARCHIVOS` de `sw.js`.
- Las opciones de respuesta se mezclan en cada pregunta (las jugadas de blackjack mantienen su orden).

## Estructura de carpetas

- `index.html`: la página. Aquí se enlazan los archivos de datos.
- `css/estilos.css`: el diseño.
- `js/app.js`: la lógica principal (pantallas, mapa, ejercicios, XP, racha, meta diaria y repetición espaciada).
- `js/sonido.js`: los efectos de sonido (cada uno es una pequeña receta de notas; puedes cambiarlos ahí).
- `js/extras.js`: repaso del día, ajustes, copia de seguridad y entrenador de conteo.
- `js/inicio.js`: arranque de la app (se carga el último).
- `tests/`: pruebas automáticas (ver abajo).
- `js/mascota.js`: el dibujo de Nai y sus estados de ánimo (`normal`, `feliz`, `pensando`, `triste`, `celebrando`).
- `data/cursos.js`: crea la lista de juegos. El orden en que se enlazan los archivos en `index.html` es el orden del inicio.
- `data/blackjack.js`, `data/poker.js`, `data/mus.js`: un archivo por juego, con sus unidades, niveles y ejercicios.
- `data/*-extra.js`: niveles adicionales que se añaden a cada curso (mismo formato). Puedes seguir ampliando ahí.
- `data/ordenar-extra.js`: ejercicios de ordenar. Cada uno lleva `elementos` ya en el orden correcto (la app los mezcla).
- `data/variedad-extra.js`: más preguntas interactivas para que todos los niveles mezclen tipos. Al cargar, reparte los ejercicios de cada nivel para que no haya bloques del mismo tipo. El campo `chequeo` solo lo usa el validador.
- `data/interactivos-extra.js`: ejercicios `seleccionar` (`cartas` + `correctas` con las posiciones), `numero` (`respuesta` entera y `unidad` opcional) y `emparejar` (`pares: [[término, significado], ...]`). El validador recalcula la respuesta de casi todos con reglas independientes y te avisa si algo no cuadra.

## Pruebas

- `node tests/validar.js`: comprueba la estructura de todos los datos y recalcula con código independiente las respuestas de estrategia básica, Hi-Lo, cuenta verdadera, mus y póker. No necesita instalar nada. Ejecútalo cada vez que añadas ejercicios.
- `node tests/recorrido.js`: juega los 38 niveles respondiendo bien cada pregunta (todos los tipos) y comprueba que cada nivel mezcla al menos 3 tipos. Tarda unos minutos.
- `node tests/navegador.js`: abre la app en un navegador real (Playwright) y prueba pantallas, repetición espaciada, rachas, ajustes, copia de seguridad y conteo. Necesita `npm i playwright` y la carpeta servida, por ejemplo con `python3 -m http.server 8123`.

## Cómo añadir ejercicios o niveles

Abre el archivo del juego (por ejemplo `data/blackjack.js`). Un **nivel** es una `leccion` dentro de una `unidad`. Cada nivel tiene:

- `id` único, `titulo`, `icono` (un emoji), `xp`.
- `intro`: lo que Nai explica antes de empezar (un solo texto).
- `ejercicios`: la lista de preguntas.

Cada ejercicio necesita `id` único, `pregunta`, `opciones`, `correcta` (la posición de la respuesta correcta, **empezando en 0**) y `explicacion`. Para dibujar cartas:

- Blackjack: `situacion: { jugador: ['10', '6'], crupier: '10' }`
- Cualquier juego: `situacion: { filas: [{ etiqueta: 'Tu mano', cartas: ['9♠', '9♦'] }, { etiqueta: 'Mesa', cartas: ['K♥', '3♠'] }] }`
- Conteo: `secuencia: ['5', '3', 'K']`

Cuidado con las comas entre elementos y con las comillas.

## Cómo añadir un juego nuevo

1. Copia `data/poker.js` a `data/otro.js` y cambia `id`, `nombre`, `icono`, `color`, `descripcion`, `reglas` y el contenido.
2. Enlázalo en `index.html`, debajo de los otros, antes de `js/app.js`.

## Cómo funciona el progreso

- El XP, la racha y los niveles completados se guardan en tu navegador (localStorage). Si cambias de navegador o de dirección, empiezas de cero.
- Si fallas un ejercicio, vuelve al final de la lección hasta que lo aciertes.
- Teclado: `1`, `2`, `3`… eligen respuesta y `Enter` continúa.
- Ajustes → «Descargar copia» guarda tu progreso en un archivo; «Restaurar copia» lo recupera (útil si cambias de móvil o borras los datos del navegador).
- Ajustes → «Reiniciar progreso» lo borra todo (los ajustes de letra y movimiento se conservan).
- Si el navegador no deja guardar (modo privado), el inicio lo avisa.

## Animaciones

- Las pantallas entran deslizándose (adelante/atrás), las cartas se reparten, las opciones aparecen en cascada, la barra de progreso se estira suave y Nai reacciona (salta si aciertas, se lamenta si fallas, celebra con los brazos en alto).
- En el resultado suben los contadores de XP y precisión, y hay confeti si lo has hecho bien.
- Solo se animan `transform` y `opacity` (van por la tarjeta gráfica, sin tirones). Las curvas están en `:root` de `css/estilos.css` (`--suave`, `--rebote`).
- Si tu sistema operativo tiene activado «reducir movimiento», se desactivan.

## Aspecto

- Tema claro color crema, y tema oscuro cálido automático si tu móvil/PC usa modo oscuro. Los colores están al principio de `css/estilos.css`.
- Tipografía Nunito (se carga de Google Fonts; sin internet se usa la del sistema, sin romper nada).
- Efectos: onda al pulsar, chispas al acertar, Nai reacciona si la tocas, brillos en botones y niveles completados, anillo en el nivel actual, estrellas en el resultado, fondo con palos que flotan.

## Antes de publicar

- **Revisa el contenido con alguien que juegue.** Las respuestas del blackjack se han comprobado con una tabla de estrategia básica para 4 a 8 mazos con el crupier plantándose en 17 blando; con otras reglas, algunas jugadas cambian. Las manos del póker, los lances del mus y las probabilidades se comprobaron con cálculos propios, pero los cursos de póker y mus siguen siendo iniciales: el mus tiene variantes según la zona, así que conviene contrastarlo.
- Mantén el planteamiento educativo: sin dinero real, sin apuestas y con clasificación de edad 18+.
- Para llevarla a las tiendas de apps más adelante habría que empaquetarla (por ejemplo con Capacitor). Es un paso posterior.
