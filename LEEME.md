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
- `node tests/recorrido.js`: juega los 150 niveles respondiendo bien cada pregunta (todos los tipos) y comprueba que cada nivel mezcla al menos 3 tipos. Tarda unos minutos.
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

## Bienvenida, barra inferior y pestaña Útil

- **Bienvenida**: la primera vez se muestra una pantalla de presentación (se puede volver a ver desde Ajustes → Bienvenida).
- **Barra inferior** con tres pestañas: **Juegos** (blackjack, póker, mus, baccarat y vídeo póker, mapas y logros en la misma pestaña), **Útil** y **Ajustes**. Se oculta durante las lecciones y el entrenador de conteo.
- **Útil** (`js/util.js`, datos en `data/ayuda.js`): calculadoras (cuenta verdadera, outs, pot odds), contador rápido de cartas, tabla de estrategia básica de blackjack, chuleta de conteo, ranking de póker, valores del mus y glosario. La tabla se verifica en `tests/validar.js` contra la lógica de estrategia.
- `tests/navegador.js` cubre ahora la bienvenida, la barra y las calculadoras (174 comprobaciones).

## Ruta dorada VIP

- Junto a cada nivel del mapa hay un **nivel Oro** (👑) más difícil: 38 en total (`data/premium.js`). Dan el doble de XP y se abren al completar el nivel normal de al lado.
- Solo se pueden jugar con el **VIP** activo. Sin VIP, tocar un nivel Oro abre la pantalla de la membresía.
- Los ejercicios Oro se **generan con código** (semilla fija por nivel) y la respuesta se calcula al generarlos; `tests/validar.js` los recalcula con código independiente.
- **Ajustes de la membresía** en `PREMIUM` (arriba de `data/premium.js`): precio, periodo, `diasPrueba`, `modoPrueba` y `nube`.
  - `modoPrueba: true` (por defecto): el botón activa 5 días de VIP en ese dispositivo **sin cobrar** (demostración).
  - `modoPrueba: false`: **cobro real**. La persona entra con su correo (enlace sin contraseña), paga con Stripe (5 días gratis la primera vez, después 4,99 €/mes) y el VIP se guarda en su cuenta.

### Cobro real: cómo está montado

- **Supabase** (proyecto «Gym social»): tabla `entrenador_vip` (solo lectura para el usuario, la escribe únicamente el webhook) y tres funciones: `entrenador-checkout` (abre el pago), `entrenador-portal` (gestionar/cancelar) y `entrenador-webhook` (recibe los avisos de Stripe y comprueba su firma). El código está en `supabase/functions/`.
- **App** (`js/cuenta.js`): acceso por correo, sincroniza el VIP al abrir la app y al volver del pago.

### Lo que falta para empezar a cobrar (lo haces tú, una vez)

1. Crea una cuenta en stripe.com y, en **Productos**, un producto «VIP» con precio recurrente de 4,99 € al mes. Copia el **ID del precio** (empieza por `price_`).
2. En Stripe → Developers → **Webhooks** → añade el endpoint `https://coqptiznghgxbidhexps.supabase.co/functions/v1/entrenador-webhook` con los eventos `checkout.session.completed` y `customer.subscription.created`, `.updated` y `.deleted`. Copia el **signing secret** (`whsec_…`).
3. En Stripe → Settings → Billing → **Customer portal**: actívalo (para que puedan cancelar).
4. En Supabase → Edge Functions → **Secrets** añade: `STRIPE_SECRET_KEY` (clave secreta `sk_…`), `STRIPE_PRICE_ID`, `STRIPE_WEBHOOK_SECRET` y `APP_URL` = `https://entrenador-cartas.onrender.com`. (Nunca pongas la clave secreta en el código ni en el chat.)
5. En Supabase → Authentication → **URL Configuration** → *Redirect URLs*: añade `https://entrenador-cartas.onrender.com/**` (si no, el enlace del correo no vuelve a la app).
6. Cuando todo lo anterior esté hecho, cambia `modoPrueba: true` por `false` en `data/premium.js`, sube los cambios y prueba con una tarjeta de pruebas de Stripe (4242 4242 4242 4242) en modo test antes de pasar a producción.

**Límites que conviene saber**
- Los niveles Oro viajan dentro del código de la web, así que alguien con conocimientos podría saltarse el bloqueo. Para protegerlos de verdad habría que servirlos desde el servidor solo a los VIP.
- El proyecto de Supabase es el mismo que el de «Gym social»: comparten el sistema de cuentas (los usuarios son los mismos) y la plantilla de los correos de acceso.
- `tests/recorrido.js` juega ahora también los 150 niveles Oro. `tests/webhook.mjs` prueba la firma de Stripe y la lógica del VIP.

## Más juegos y más lecciones (noviembre)

- **Baccarat (Punto Banco)** y **Vídeo póker (Jacks or Better 9/6)**: 9 niveles cada uno (+9 niveles Oro cada uno). Archivos: `data/casino.js` (cursos y generadores) y `data/videopoker-datos.js` (232 manos con su mejor jugada, calculada con valor esperado exacto; se regenera con `node tools/armar-datos-videopoker.js`).
- **Niveles de «Práctica extra»** al final de blackjack, póker y mus (`data/practica.js`), con los generadores de `data/generadores.js`.
- `tests/validar.js` comprueba el bacarrá con reglas propias de la tercera carta y enumeración exacta de probabilidades (empate ≈ 9,5 %; ventaja de la casa ≈ 1,06 % Banca, ≈ 1,24 % Jugador, ≈ 14 % Empate) y cada jugada de vídeo póker recalculando el valor esperado de las 32 formas de guardar cartas.
- Aviso: el retorno «≈ 99,5 %» de la 9/6 con juego perfecto es una cifra conocida que NO recalcula el validador. Es contenido educativo, sin dinero real; no es una invitación a apostar.
- **30 niveles normales por juego** (150 en total, más 150 niveles Oro): `data/ampliacion.js` añade las unidades nuevas (blackjack, póker y mus con generadores; baccarat y vídeo póker con `data/casino.js`). Los niveles «Examen» y «Torneo» usan las situaciones difíciles.

## Tienda, energía, fichas y cofres (`js/tienda.js`)

- La pestaña **Tienda** (antes «VIP») contiene la energía, el pase VIP y los cosméticos.
- **Energía ⚡**: cada nivel (normal u Oro) gasta 1. Cada día empiezas con 2 y, si bajas de 2, se recupera 1 cada 30 min. Se compra con fichas (1 ⚡ = 10 🪙, 3 ⚡ = 25 🪙). El VIP tiene energía ilimitada. Los repasos y el conteo no gastan. Los números están al principio de `js/tienda.js` (`ENERGIA`, `COMPRAS_ENERGIA`).
- **Fichas 🪙**: 3 por nivel nuevo (6 en Oro), 5 por la meta diaria y las de los cofres. Empiezas con 20.
- **Cofres 🎁**: uno cada 6 niveles de cada juego (`CADA_COFRE`); dan 8–20 fichas y un premio extra (XP, energía, congelador o un bote de fichas).
- **Cosméticos**: fondos, barajas y aspecto de Nai (catálogo `CATALOGO` en `js/tienda.js`; estilos al final de `css/estilos.css`). Son solo estéticos.
- Las fichas NO se compran con dinero real (eso necesitaría otro producto en Stripe). Todo el estado va en el progreso y entra en la copia de seguridad.
- Limitación: como el resto del progreso, vive en el navegador; quien sepa puede editarlo.

- **Iconos propios**: la app no usa emojis. `js/iconos.js` dibuja 79 iconos SVG animados y sustituye automáticamente cualquier emoji que aparezca en un texto (`EMOJI_A_ICONO`). Las animaciones se apagan con el modo calma y con «reducir movimiento».
- **Tienda con pestañas** (Fondos, Barajas, Aspecto de Nai) y **VIP ×2**: el pase da el doble de XP y de fichas (niveles, repasos, conteo y cofres; `multVip()` en `js/app.js`).
- **Chuletas VIP**: en la pestaña Útil las cinco chuletas son exclusivas del VIP y llevan borde dorado; sin VIP muestran un candado y abren la pantalla del pase (`chuleta()` en `js/util.js`).
- **Tres formas más de responder** (`data/formas-nuevas.js`, render en `js/app.js`, estilos al final de `css/estilos.css`):
  - `clasificar`: la carta que sale se arrastra (o se toca el cajón, o teclas 1-3) a su cajón: Hi-Lo, valores, manos de póker, estrategia…
  - `deslizador`: mueve el control hasta tu estimación (porcentajes, cuenta verdadera, puntos…) y se acepta dentro de un margen.
  - `rellenar`: completa la frase tocando palabras de un banco (con palabras de relleno).
  Se añaden a 40 niveles existentes; `tests/validar.js` recalcula las respuestas verificables con reglas independientes.
- **Baraja española** (`js/baraja-espanola.js`): las preguntas del mus (y su ruta Oro) muestran cartas españolas dibujadas en SVG (oros, copas, espadas y bastos; sota 10, caballo 11, rey 12). El mus no usa palos, así que cada carta recibe uno según su posición. En la tienda hay una pestaña «Baraja española» con 6 estilos (Clásica, Taberna, Pergamino, Dorada, Nocturna y Neón) que cambian los colores mediante variables `--es-*`.
- **Relámpago** (`tipo:'relampago'`): cuarta forma de responder, rápida y con cuenta atrás. Una serie de 4-6 decisiones («¿pedir o plantarse?», «¿compensa pagar?», «¿hay juego?», «¿es natural?», «¿paga?»), de 5-12 s cada una; pasar el tiempo cuenta como fallo y con 5 o más situaciones vale 1 fallo. Teclas 1-3; sin cuenta atrás en modo calma. Formato: `{opciones:[...], items:[[texto, índiceCorrecto, etiqueta], ...], segundos}`.
- **Variedad en todos los niveles** (`data/variedad-generada.js`): cada uno de los 150 niveles normales lleva un ejercicio extra de clasificar, deslizador o relámpago, generado con una semilla fija (el id del nivel), así que siempre es el mismo y la repetición espaciada funciona. El validador recalcula todas sus respuestas con reglas independientes.
- **Mis estadísticas** (`mostrarEstadisticas`, en `js/extras.js`; botón en Juegos): la app guarda aciertos y fallos por tema, por tipo de pregunta y por día (`stats` en el progreso, entra en la copia de seguridad). Muestra tus puntos débiles (temas por debajo del 85 % con al menos 5 respuestas) con un botón «Entrenar» que genera un repaso de 8 preguntas de ese tema.
