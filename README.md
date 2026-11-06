# GymCrew 💪

Red social para el gimnasio, hecha con HTML, CSS y JavaScript sin dependencias ni recursos externos (sin CDN, sin fuentes remotas).
Funciona abriendo `index.html`, como app instalable (PWA) y sin conexión. Los entrenos viven en el móvil; solo se comparte lo que tú decides, entreno a entreno.

> GymCrew no sustituye a un profesional de la salud ni da consejos médicos ni de dieta. Pensada para mayores de 16 años.

Este proyecto es un fork independiente de HandShake (otra carpeta, sin tocarla). Clave local: `gymcrew.v1` · clave de servidor: `gymcrew.srv` · caché PWA: `gymcrew-v1`.

## Qué hace

**Entrenos (privado)**
- Registro de un toque desde «Hoy» (tipo + cómo te sentiste) o entreno completo: fecha, hora, duración, tipo (fuerza, cardio, funcional, deporte, movilidad), grupos musculares, notas, sensación 1–5 y ejercicios con series (repeticiones, kg, RPE opcional).
- Catálogo de 64 ejercicios (es/en) + ejercicios propios. Rutinas guardadas, «Repetir el último» y rutina sugerida en «Hoy».
- Temporizador de descanso configurable (30–240 s), solo un toque corto de vibración, sin sonidos insistentes.
- Récords automáticos por ejercicio (1RM estimado con Epley, peso máximo, volumen; el primer registro es la base y no cuenta como récord). Historial por ejercicio con gráfica sencilla y volumen semanal por grupo muscular.
- Racha flexible: semanas seguidas que cumplen tu objetivo semanal (1–7, por defecto 3). La semana en curso nunca rompe la racha; si una semana no sale, la siguiente empieza de cero, sin reproches.
- 13 logros con marcos de perfil, PIN opcional, exportar CSV, copia completa y restaurar, es/en, día/noche, Liquid Glass.

**Social (opcional, privado por defecto)**
- Feed de amigos y grupos con tarjetas de entreno (tipo, duración, récords). Nunca viajan la nota ni los kilos salvo que los marques al guardar. Reacciones con emoji y comentarios cortos.
- **Seguidores como en Twitter:** eliges un `@usuario` (3–20 letras, números, punto o guion bajo) y buscas a otras personas por él. Perfil **privado por defecto** (hay que aprobar las solicitudes; se puede hacer público en Perfil). Seguirse los dos = **amigos** (chat, mensajes y grupos como antes). Ya no hay códigos de amigo en la pantalla; los grupos de gimnasio siguen entrando por código (5 letras + 3 números). Los usuarios que ya existían tienen que elegir su `@usuario` la primera vez.
- **Publicaciones públicas:** al publicar puedes marcar «Público (cualquiera en GymCrew)», además de amigos, seguidores y grupos. Las públicas (solo texto y foto o vídeo, nunca entrenos ni historias) salen en Inicio de todo el mundo: pestaña «Todo» y filtro «Público». Hace falta tener `@usuario`; máximo 10 por hora; el servidor guarda las últimas 300 durante 7 días. Cualquiera puede reaccionar y comentar (avisa al autor); bloquear a alguien las oculta en ambos sentidos y el menú «⋯» permite reportar. Se piden al servidor al abrir Inicio (cada ≥10 s) y no se guardan en el móvil.
- Reto semanal de grupo propuesto por quien lo creó. Ranking opcional por grupo con tres medidas suaves (entrenos de la semana, semanas de racha, récords del último mes); cada miembro decide si participa y puede ocultarlo. No hay ranking global.
- Quedadas («voy / no voy»), sin recordatorios ni cuentas atrás.
- Moderación mínima: bloquear, reportar un mensaje, salir de un grupo y «Borrar mis datos compartidos».

**Servidor gratuito (`DEPLOY-GRATIS.md`):** el servidor puede guardar su base y las fotos en Supabase (plan gratis, sin tarjeta) mediante las variables `SUPABASE_URL` y `SUPABASE_KEY`; con `render.yaml` se despliega en Render gratis y UptimeRobot lo mantiene despierto. Sin esas variables sigue funcionando con archivos locales (Oracle/VPS, `server/DEPLOY.md`). Se niega a arrancar si no puede leer Supabase para no pisar datos.

**Movimiento (`motion.js`, sin dependencias):** el menú ＋ son cuatro tarjetas de color con icono que entran escalonadas y flotan suavemente (el botón ＋ gira al abrirlo). Cada pulsación deja un destello de luz bajo el dedo; al reaccionar (❤️ y emojis) salen emojis volando; las publicaciones y tarjetas aparecen con un deslizamiento suave al hacer scroll; los mensajes nuevos del chat y las publicaciones que llegan brillan; la campana se agita con una notificación nueva; los iconos de la barra saltan al cambiar de pestaña. Con «reducir movimiento» del sistema todo se apaga y el contenido aparece sin animar.

**Menús más claros (noviembre):** **Ajustes** es ahora un índice con tu cuenta arriba y apartados con icono y el valor actual (Apariencia e idioma, Entrenamiento, Avisos y vibración, Privacidad y seguridad —PIN y usuarios bloqueados—, Copias y exportación, Ayuda y tutorial, Avanzado —servidor y modo prueba—) y una **Zona de peligro** aparte para los borrados. Cada apartado se abre en su página y «Volver» regresa al índice. En **Social** el orden es Amigos · Chats · Grupos (Amigos primero) y el @usuario ya no sale repetido en Perfil.

**Cuenta, Entrenos y perfil (noviembre):** la primera vez, antes de nada, una **guía de 3 pasos** explica cómo crear la cuenta; después viene el formulario y, nada más crearla, una pantalla **obligatoria para elegir el @usuario** (no se puede saltar ni cerrar; si cierras la app sin elegirlo, vuelve a salir) y solo entonces empieza el **tutorial de uso de la app**. Lo primero que ve una persona nueva es **crear cuenta con correo y contraseña** (o «Entrar» si ya tiene); pide nombre, correo, contraseña (mín. 8) y confirmar que tiene 16 años o más. La contraseña se guarda en el servidor con scrypt y sal propia (sin dependencias nuevas), con límite de intentos; el correo no se envía ni se comparte con nadie. Entrar desde otro dispositivo da acceso a la misma identidad (máx. 8 dispositivos). «Mi día» (Hoy, tu semana y récords) ahora es la primera pestaña de **Entrenos** (Hoy · Historial · Rutinas · Progreso) e Inicio queda solo con el feed. El **perfil** muestra tu nombre y tu @usuario y, debajo, tu actividad: **Publicaciones**, **Respuestas** y **Fotos**.

**Inicio estilo Twitter y notificaciones:** Inicio tiene dos pestañas, «Para ti» (línea de tiempo con historias, filtros Todo/Amigos/Grupos, caja «Comparte…» y publicaciones en filas tipo tweet con comentar, ❤️ me gusta, más reacciones y compartir) y «Mi día» (tarjeta Hoy, registro rápido, semana y récords). Tocar una publicación abre su hilo con respuestas. Aparece el aviso «Nuevas publicaciones» si llegan mientras miras. El botón ＋ abre un menú: Registro rápido, Entreno completo, Publicación, Historia. La campana de la cabecera guarda las notificaciones: me gusta/reacción, comentario, solicitud de amistad y nuevo amigo (y alguien que se une a tu grupo). Se pueden quitar los avisos emergentes en Ajustes; la lista se sigue guardando. Quitar un me gusta borra su notificación; bloquear a alguien borra las suyas. **Decisión:** «te siguen» = te envían una solicitud de amistad o aceptan la tuya; se mantiene la amistad mutua por código (privacidad), sin seguidores unilaterales. Sin recordatorios ni avisos insistentes.

**Inicio y feed fusionados:** Inicio reúne en una sola pantalla la fila «Tu historia / crew», la tarjeta «Hoy» con el registro rápido, tu semana, récords recientes y las «Novedades» (caja para publicar + feed de amigos y grupos). Social queda para Grupos, Chats y Amigos. «Últimos entrenos» vive solo en Entrenos.

**Publicaciones e historias (opcional, con servidor)**
- Publicaciones con texto, foto o vídeo y audiencia elegida cada vez (amigos y/o grupos de gimnasio; nada marcado por defecto). Se pueden borrar y se llevan su archivo del servidor.
- Historias de 24 h (foto, vídeo o solo texto) con visor a pantalla completa, fila «Tu historia» y aro para las no vistas. Sin avance forzado si tienes «reducir movimiento».
- Las fotos se reducen a 1280 px y se recomprimen en el móvil, lo que elimina EXIF (ubicación y modelo del móvil). Los vídeos se recodifican en el móvil: máx. 15 s, 720 px y **sin audio**.
- Reacciones y comentarios funcionan igual que en los entrenos.

**Diseño no manipulador:** sin culpa por fallar, sin cuentas atrás con presión, sin avisos insistentes, sin comparaciones obligatorias, sin recompensas aleatorias ni de pago.

## Estructura
`index.html` · `styles.css` · `app.js` (lógica) · `i18n.js` (inglés) · `srv.js` (cliente WebSocket) · `config.js` · `sw.js` · `manifest.webmanifest` · `icon.svg` · `server/` (Node + `ws`).
Guías: `GUIA-PUBLICAR.md` (GitHub Pages), `server/DEPLOY.md` (servidor), `PRUEBA-EN-MOVIL.md` (prueba de 4 días).

## Probarla en local
Abre `index.html` (modo local) o sirve la carpeta: `python3 -m http.server 8000`. Con servidor propio:
```
cd server && npm install && node server.js      # http://localhost:8080 (sirve también la app)
```

## Decisiones de producto
- **Privado por defecto, compartir es explícito:** el selector «Compartir este entreno» está apagado y se decide al guardar. El servidor no guarda historial de entrenos ni de chats; solo reenvía y mantiene una cola para quien está desconectado. **Excepción: las fotos y vídeos** que subes a una publicación o historia se guardan en el servidor (publicaciones 30 días, historias 25 h, o hasta que las borres) porque el WebSocket no admite archivos.
- **Sin ranking global:** solo opcional dentro de cada grupo, con tres medidas amables y oculto por defecto.
- **Racha en semanas, no en días:** los días de descanso son parte del entrenamiento.
- **Sin consejos médicos ni de dieta**; aviso en bienvenida y Ajustes; 16+.
- **Compatibilidad del servidor:** todo lo nuevo son tipos de mensaje nuevos (`gcreate`, `gjoin`, `gx`, `block`, `unblock`, `report`). Los tipos antiguos o desconocidos se ignoran sin cerrar la conexión.
- **Campos nuevos** con valores por defecto en `defaults()` y normalizados en `load()`.

## Cambios por fase
1. **Fork limpio:** nuevo nombre, iconos, manifest, textos, paleta azul (día y noche) y claves. Eliminados rollos y tienda, «efecto», minijuegos, duelos, torneos, trofeos y el pase de temporada (`duels.js` borrado de la copia). Se conservan chat, amigos por código, grupos, presencia, marcos, logros, PIN, copia/restaurar, i18n, PWA y accesibilidad.
2. **Entrenos:** modelo de datos, catálogo, editor, registro rápido, rutinas, temporizador, récords, progreso, volumen semanal y racha.
3. **Social:** feed, reacciones, comentarios, grupos con código, retos, ranking opcional, quedadas, bloqueo/reporte/salir/borrar; parches en `server/server.js`.
5. **Aspecto de red social (azul):** paleta azul en día y noche, icono y manifest; fila «tu crew» tipo historias (aro azul si han entrenado en 72 h), caja «¿Qué has entrenado hoy?», tarjetas del feed con cifras destacadas y barra Animar · Comentar · Más, avatares en gama azul-violeta, botones con degradado.
4. **Pulido:** pantalla Inicio rehecha (Hoy + rutina sugerida, semana, récords recientes, actividad de amigos), barra Inicio·Entrenos·＋·Social·Perfil, inglés completo, objetivos táctiles ≥ 44 px, texto ≥ 11 px, foco visible, movimiento reducido, calendario que cabe a 360 px.

## Verificación (resultados reales de esta sesión, en Chromium/Playwright y Node 22)
| Comprobación | Resultado |
|---|---|
| `node --check` app.js, i18n.js, srv.js, config.js, sw.js, server/server.js | todo OK |
| Smoke (arranque, 4 pestañas + ＋, registro rápido, editor, récord 1RM 88,7, logro, rutina, temporizador, ≥ 60 ejercicios, sin errores) | 15/15 |
| Servidor (health, amistad, post, reacción, validaciones, gcreate/gjoin, stat/meet/rsvp/gset, borrar compartido, reporte, bloqueo, tipos viejos ignorados, reconexión) | 30/30 |
| E2E con 2 navegadores y servidor real (A y B amigos por código → A comparte → B lo ve y reacciona/comenta → B bloquea a A y deja de verlo; grupo por código con 3 personas; borrar datos compartidos; sin errores) | 19/19 |
| QoL/PWA (CSV, copia/restaurar sin duplicar, datos corruptos, PIN, búsqueda, service worker, offline, manifest, movimiento reducido) | 17/17 |
| Accesibilidad (390×844 y 360×640, día y noche, 4 pestañas): objetivos < 44 px, texto < 11 px, desborde horizontal | 0 / 0 / ninguno |
| Cobertura inglés: textos en español sin traducir | solo falsos positivos («Español», URL de ejemplo) |
| Fotos/vídeos (subida HTTP: 401/415/413/404/CORS; foto 3000×2000 → 1280 px sin EXIF; vídeo 20 s → 15 s, 720 px, < 4 MB; publicación y historia entre 2 navegadores; visor reproduce vídeo; un usuario no puede reutilizar el archivo de otro; borrar publicación y «borrar mis datos» eliminan los archivos del servidor) | 28/28 |
| Notificaciones e Inicio estilo Twitter (2 navegadores: solicitud/amigo, me gusta y quitar me gusta, comentario, hilo y respuesta, avisos apagados, filtros, menú ＋, bloqueo) | 22/22 |
| Movimiento (aparición al deslizar, destello, corazones, menú ＋, campana, movimiento reducido) | 12/12 |
| Servidor con almacenamiento remoto simulado (carga tras reinicio: 2 usuarios recuperados; fotos subidas/servidas/borradas en el almacén; clave incorrecta → no arranca; URL sin https → no arranca; sin variables → modo archivo) + fotos/vídeos 28/28, servidor 30/30, e2e 19/19 | todo OK |
| Tamaño `app.js` | ≈190 KB sin comprimir, 54 KB gzip (límite 90 KB) |

Capturas revisadas a 390×844 y 360×640, día y noche: Inicio, Entrenos, registro, Social y Perfil.

## Limitaciones conocidas y cosas sin verificar
- **Sin verificar con Supabase y Render reales** (no tengo cuentas): el código se probó contra una simulación de su API. Los nombres de rutas de Supabase Storage/REST y los pasos de las guías pueden haber cambiado; si algo falla, el log de Render dice la causa.
- Las animaciones se han probado en Chromium; la fluidez a 60 fps en un móvil de gama baja está sin verificar (si va justo, activa «reducir movimiento» en el sistema).
- Las notificaciones se guardan en el servidor (se sincronizan entre dispositivos, máx. 100 y 30 días) y no hay aviso del sistema con la app cerrada. No puedes dar me gusta a tus propias publicaciones. El registro rápido está ahora en «Mi día» y en el menú ＋.
- **Sin verificar:** móvil real (táctil, vibración, instalación PWA, notificaciones), servidor real con HTTPS (Oracle/Caddy) y el script `setup.sh`; GitHub Pages; inicio de sesión con Google (necesita tu ID de cliente). Todo lo anterior se probó solo con Chromium de escritorio y un servidor local.
- Las reacciones a entrenos del feed de amigos llegan solo al dueño del entreno (no a otros amigos).
- El registro de un toque no es compartible; solo se comparte desde el editor completo.
- Quien bloquea a alguien puede seguir uniéndose a un grupo donde esté esa persona; el contenido de la persona bloqueada se oculta en su móvil, pero el servidor no lo impide.
- Un descanso fuera de rango (< 30 s) se restablece al valor por defecto (90 s) en lugar de ajustarse al mínimo.
- Los récords y estadísticas compartidos los calcula cada móvil; el servidor valida formato, no veracidad.
- Quedan entradas de traducción y reglas CSS del HandShake original sin podar (no afectan al funcionamiento).
- **Fotos y vídeos:** quien tenga el enlace a un archivo (id aleatorio de 128 bits) puede verlo hasta que caduque; el enlace solo se envía a la audiencia elegida, pero no hay control de acceso por persona. No se cifran en el servidor.
- Los archivos no entran en la copia de seguridad diaria (`db.json`); si restauras el servidor, las publicaciones antiguas mostrarán «Este contenido ya no está disponible».
- Sin servidor no se pueden publicar fotos, vídeos ni historias. En el vídeo se pierde el audio a propósito; en navegadores sin `MediaRecorder` solo se aceptan clips ya pequeños (< 4 MB).
- No se puede responder a una historia ni reaccionar a ella (solo verla); las historias no tienen contador de visitas.
- El recodificado de vídeo ocurre en tiempo real (un clip de 15 s tarda unos 15 s) y no se ha probado en móvil real.
- Los reportes solo se guardan en `db.json` del servidor para revisión manual.
- Los mensajes y cuentas del servidor no están cifrados de extremo a extremo (ver `server/DEPLOY.md`).
- **Seguidores y público, sin verificar en móvil real ni en Render/Supabase reales.** Las reacciones y comentarios de seguidores que no son amigos llegan solo al dueño; el contenido «para seguidores» solo lo reciben quienes ya te siguen. Las públicas no se pueden editar (solo borrar). No hay moderación automática: los reportes se revisan a mano en `db.json`. Clientes antiguos (sin `@usuario`) que envíen solicitudes por código siguen funcionando, pero no ven la pantalla nueva.
- **Cuentas: sin verificar en producción.** El correo **no se verifica** (no hay servicio de correo, que sería un recurso externo) y **no se puede recuperar la contraseña**: quien la olvide no puede volver a entrar a esa cuenta (los entrenos siguen en su dispositivo). El servidor sigue aceptando perfiles anónimos de versiones antiguas; la pantalla de cuenta es obligatoria solo en la app nueva. Los entrenos no se sincronizan entre dispositivos: la cuenta solo identifica tu perfil social. No hay «borrar cuenta» todavía. «Continuar sin cuenta» solo aparece si no hay servidor. Quien ya usaba la app puede crear su cuenta desde Ajustes y conserva su perfil, amigos y seguidores.
- **Respuestas en el perfil:** solo salen las respuestas a publicaciones que aún están en el dispositivo (las de otras personas se conservan mientras no salgan de las últimas 150).

## Entrenos públicos y temas
- Al guardar un entreno puedes marcar **Público**: no hace falta tener amigos; cualquiera en GymCrew lo ve en Inicio › Público y puede reaccionar y comentar (necesitas tu @usuario).
- Las publicaciones y los entrenos pueden llevar un **tema** (fuerza, cardio, movilidad, rutinas, progreso, técnica, motivación, preguntas, principiantes). La lista es fija y el servidor descarta cualquier otro valor. En Inicio hay una fila de temas para filtrar.

## Inicio y perfil (v. redes)
- **Inicio** tiene solo dos pestañas: **Para ti** (todo lo público, con lo más comentado un poco por delante, e historias públicas) y **Siguiendo** (tú, tus amigos, tus grupos y la gente que sigues, con sus historias). Un único filtro de **tema**.
- Las **historias** también pueden ser públicas (marca «Público» al subirlas; el servidor las borra a las 24 h).
- **Perfil** al estilo red social: banner (6 colores, solo lo ves tú de momento), foto encima, nombre, @usuario, contadores y debajo **Publicaciones · Respuestas · Fotos**. «Editar perfil» abre foto, banner, @ y privacidad; «Racha, logros y marco» queda plegado.
