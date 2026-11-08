/* GymCrew: caché sin conexión. Solo guarda archivos propios de la app (nunca datos ni peticiones al servidor). */
const CACHE = 'gymcrew-v7';
const FILES = ['./', 'index.html', 'styles.css', 'app.js', 'motion.js', 'gicons.js', 'i18n.js', 'srv.js', 'config.js', 'manifest.webmanifest', 'icon.svg', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== 'GET' || u.origin !== location.origin || !/(\/|\.html|\.css|\.js|\.svg|\.png|\.webmanifest)$/.test(u.pathname)) return;
  e.respondWith(fetch(r).then(res => { const cp = res.clone(); caches.open(CACHE).then(c => c.put(r, cp)).catch(() => {}); return res; }).catch(() => caches.match(r).then(m => m || caches.match('index.html'))));
});
