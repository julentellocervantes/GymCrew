/* Configuración de GymCrew.
   Para activar "Continuar con Google" pega aquí tu ID de cliente de OAuth (Google Cloud Console >
   APIs y servicios > Credenciales > ID de cliente de OAuth, tipo "Aplicación web").
   Añade el origen desde el que abres la app (por ejemplo http://localhost:5500) en "Orígenes de JavaScript autorizados".
   Con file:// Google no permite iniciar sesión: usa Live Server o un hosting HTTPS. */
window.GYM_CONFIG = {
  googleClientId: '',
  // Dirección de tu servidor (ver server/DEPLOY.md), por ejemplo 'https://gymcrew-julen.duckdns.org'.
  // Vacío = se usa el servidor desde el que se abre la app, o el modo local.
  serverUrl: ''
};
