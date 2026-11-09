// Service worker: hace que la app funcione sin conexión.
// - Al instalarse guarda todos los archivos de la app.
// - Después, con conexión siempre usa la versión más nueva (y la guarda); sin conexión usa la guardada.
//   Así no hace falta cambiar nada cuando editas los archivos.
const CACHE = 'entrenador-cartas-v1';
const ARCHIVOS = [
  './', 'index.html', 'manifest.webmanifest',
  'css/estilos.css', 'js/app.js', 'js/mascota.js',
  'data/cursos.js', 'data/blackjack.js', 'data/poker.js', 'data/mus.js',
  'data/blackjack-extra.js', 'data/poker-extra.js', 'data/mus-extra.js',
  'icons/icono.svg', 'icons/icono-192.png', 'icons/icono-512.png', 'icons/icono-maskable-512.png', 'icons/apple-touch-icon.png',
];
const ESPERA_RED = 3000; // si la red tarda más de 3 s, se usa lo guardado

self.addEventListener('install', (evento) => {
  evento.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(ARCHIVOS.map((a) => new Request(a, { cache: 'reload' })))).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    caches.keys()
      .then((claves) => Promise.all(claves.filter((k) => k !== CACHE && k.startsWith('entrenador-cartas-')).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (evento) => {
  const peticion = evento.request;
  if (peticion.method !== 'GET') return;
  const url = new URL(peticion.url);

  // Tipografías de Google: se guardan la primera vez y después salen del móvil
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    evento.respondWith(
      caches.open(CACHE).then((c) =>
        c.match(peticion).then((guardada) =>
          guardada ||
          fetch(peticion).then((r) => { if (r.ok || r.type === 'opaque') c.put(peticion, r.clone()); return r; }).catch(() => Response.error())
        )
      )
    );
    return;
  }
  if (url.origin !== location.origin) return;

  evento.respondWith(redPrimero(peticion));
});

function redPrimero(peticion) {
  return caches.open(CACHE).then((c) => {
    const red = fetch(peticion).then((r) => {
      if (r.ok) c.put(peticion, r.clone());
      return r;
    });
    const limite = new Promise((resolver) => setTimeout(resolver, ESPERA_RED, null));
    return Promise.race([red.catch(() => null), limite]).then((r) =>
      r || c.match(peticion, { ignoreSearch: true }).then((guardada) => guardada || red.catch(() => c.match('index.html')))
    );
  });
}
