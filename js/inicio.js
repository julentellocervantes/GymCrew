// Arranque de la app (se carga el último, cuando todo lo demás ya existe).
aplicarAjustes();
mostrarInicio('fundido');

// Sin conexión: el service worker guarda la app. En tu ordenador (localhost) no se activa para que
// los cambios que haces se vean siempre; para probarlo allí abre la página con ?pwa en la dirección.
if ('serviceWorker' in navigator) {
  const enLocal = ['localhost', '127.0.0.1'].includes(location.hostname);
  if (!enLocal || location.search.includes('pwa')) {
    window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
  }
}
