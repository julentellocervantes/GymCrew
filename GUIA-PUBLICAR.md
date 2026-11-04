# Publicar GymCrew con https (gratis, ~10 minutos)

Hace falta para: instalar la app en la pantalla de inicio, usarla sin conexión y (más adelante) el inicio de sesión con Google.
Solo puedes hacerlo tú: necesita tu cuenta de GitHub.

## Opción A — GitHub Pages (recomendada)
1. Crea una cuenta en https://github.com (si no tienes) y un repositorio nuevo, por ejemplo `gymcrew`. **Público** (Pages gratis lo requiere; ver nota de privacidad abajo).
2. Descomprime `gymcrew.zip` en tu ordenador y sube **todo el contenido** al repositorio (botón *Add file → Upload files*; incluye la carpeta oculta `.github`; si no la ves, activa «mostrar archivos ocultos» o usa Git).
3. En el repositorio: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
4. Ve a la pestaña **Actions**: verás «Publicar en GitHub Pages» ejecutándose. Cuando esté verde, la dirección aparece en Settings → Pages (algo como `https://TU-USUARIO.github.io/gymcrew/`).
5. Ábrela en el móvil. En Android/Chrome: menú ⋮ → *Instalar app*. En iPhone/Safari: Compartir → *Añadir a pantalla de inicio*.

**Nota de privacidad:** el repositorio solo contiene el código de la app. Tus entrenos se guardan en tu móvil (localStorage), nunca en GitHub. No pegues ninguna clave secreta en `config.js` (el ID de cliente de Google no es secreto, pero tu servidor sí debe tener su propio dominio).

## Opción B — todo en tu servidor de Oracle
Sigue `server/DEPLOY.md`: el mismo servidor sirve la app con https y ya incluye el modo instalable.

## Después de publicar
- **Google (opcional):** en https://console.cloud.google.com crea un *ID de cliente OAuth (aplicación web)*, añade tu dirección de Pages en «Orígenes de JavaScript autorizados» y pega el ID en `config.js` (`googleClientId`). Vuelve a subir el archivo.
- **Servidor de amigos y grupos:** tras desplegarlo (`server/DEPLOY.md`), pon su dirección en `config.js` (`serverUrl: 'https://tu-servidor.duckdns.org'`).
- Para actualizar la app: sube los archivos nuevos al repositorio; Pages se republica solo. El móvil recoge la versión nueva al abrirla con conexión.
