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
- **Rangos** según tu XP (Novato, Aprendiz, Jugador, Tahúr, Maestro, Leyenda) y **9 logros**. Se ven pulsando la tarjeta de rango del inicio.

## Estructura de carpetas

- `index.html`: la página. Aquí se enlazan los archivos de datos.
- `css/estilos.css`: el diseño.
- `js/app.js`: la lógica (pantallas, mapa, ejercicios, XP y racha).
- `js/mascota.js`: el dibujo de Nai y sus estados de ánimo (`normal`, `feliz`, `pensando`, `triste`, `celebrando`).
- `data/cursos.js`: crea la lista de juegos. El orden en que se enlazan los archivos en `index.html` es el orden del inicio.
- `data/blackjack.js`, `data/poker.js`, `data/mus.js`: un archivo por juego, con sus unidades, niveles y ejercicios.
- `data/*-extra.js`: niveles adicionales que se añaden a cada curso (mismo formato). Puedes seguir ampliando ahí.

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
- El enlace «Reiniciar progreso» del inicio lo borra todo.

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
