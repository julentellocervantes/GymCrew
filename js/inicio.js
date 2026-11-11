// Arranque de la app (se carga el último, cuando todo lo demás ya existe).
aplicarAjustes();

// Cada pantalla principal enciende su pestaña en la barra inferior; el resto (niveles, resultados,
// entrenador) la ocultan para que el contenido ocupe toda la pantalla.
{
  const pestanaDe = { mostrarInicio: 'juegos', mostrarMapa: 'juegos', mostrarLogros: 'juegos', mostrarUtil: 'util', mostrarAjustes: 'ajustes' };
  for (const [nombre, pestana] of Object.entries(pestanaDe)) {
    const original = window[nombre];
    window[nombre] = function (...args) {
      const resultado = original.apply(this, args);
      barra(pestana);
      return resultado;
    };
  }
}

if (progreso.bienvenida) mostrarInicio('fundido');
else mostrarBienvenida();

// Sin conexión: el service worker guarda la app. En tu ordenador (localhost) no se activa para que
// los cambios que haces se vean siempre; para probarlo allí abre la página con ?pwa en la dirección.
if ('serviceWorker' in navigator) {
  const enLocal = ['localhost', '127.0.0.1'].includes(location.hostname);
  if (!enLocal || location.search.includes('pwa')) {
    window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
  }
}
