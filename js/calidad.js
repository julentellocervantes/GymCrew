// CALIDAD: pequeños detalles que hacen que la app se sienta más cuidada.
// - Avisos (toast) de la app: sin conexión, de nuevo conectado y «nueva versión disponible».
// - Los números de la cabecera (fichas, XP, racha) suben contando en vez de saltar.
// - Un toque de vibración muy suave al pulsar botones y tarjetas (si la vibración está activa).
// Todo respeta «reducir movimiento», el modo calma y los ajustes de vibración.
(function () {
  const calma = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.dataset.calma === 'si' || (typeof progreso === 'object' && progreso && progreso.ajustes && progreso.ajustes.calma);
  const automatizado = () => navigator.webdriver === true; // los tests leen los números al instante

  // ---------- avisos ----------
  let aviso = null;
  window.avisoApp = function (texto, accion, alPulsar) {
    if (aviso) aviso.remove();
    aviso = document.createElement('div');
    aviso.className = 'aviso-app';
    aviso.setAttribute('role', 'status');
    aviso.setAttribute('aria-live', 'polite');
    const t = document.createElement('span');
    t.textContent = texto;
    aviso.append(t);
    if (accion) {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = accion;
      b.addEventListener('click', () => { if (alPulsar) alPulsar(); });
      aviso.append(b);
    }
    document.body.append(aviso);
    const este = aviso;
    if (!accion) setTimeout(() => { este.classList.add('sale'); setTimeout(() => este.remove(), 350); }, 3200);
    return este;
  };
  window.addEventListener('offline', () => window.avisoApp('Sin conexión: la app sigue funcionando'));
  window.addEventListener('online', () => window.avisoApp('De nuevo conectado'));

  // Cuando se instala una versión nueva, se ofrece recargar (solo si ya había una instalada)
  if ('serviceWorker' in navigator) {
    const habiaControl = !!navigator.serviceWorker.controller;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!habiaControl) return;
      window.avisoApp('Hay una versión nueva de la app', 'Actualizar', () => location.reload());
    });
  }

  // ---------- números que cuentan ----------
  const ultimo = {};
  function contar(dato, desde, hasta) {
    const nodo = [...dato.childNodes].reverse().find((n) => n.nodeType === 3);
    if (!nodo) return;
    const pref = nodo.data.replace(/[\d]+\s*$/, '');
    const t0 = performance.now();
    const dur = Math.min(900, 350 + (hasta - desde) * 12);
    dato.classList.add('pop');
    const paso = (t) => {
      const k = Math.min(1, (t - t0) / dur);
      const e = 1 - Math.pow(1 - k, 3);
      nodo.data = pref + Math.round(desde + (hasta - desde) * e);
      if (k < 1 && nodo.isConnected) requestAnimationFrame(paso);
      else { nodo.data = pref + hasta; setTimeout(() => dato.classList.remove('pop'), 400); }
    };
    requestAnimationFrame(paso);
  }
  function revisarMarcador() {
    document.querySelectorAll('.marcador .dato[title]').forEach((d) => {
      const clave = d.getAttribute('title');
      const m = /(\d+)\s*$/.exec(d.textContent);
      if (!m) return;
      const v = Number(m[1]);
      const antes = ultimo[clave];
      ultimo[clave] = v;
      if (antes === undefined || antes === v || v < antes || d.dataset.contado === String(v) || calma() || automatizado()) return;
      d.dataset.contado = String(v);
      contar(d, antes, v);
    });
  }
  let pendiente = false;
  new MutationObserver(() => {
    if (pendiente) return;
    pendiente = true;
    requestAnimationFrame(() => { pendiente = false; revisarMarcador(); });
  }).observe(document.body, { childList: true, subtree: true });

  // ---------- un toque suave al pulsar ----------
  const tactil = 'button, .opcion, .juego, .nodo, .articulo, .pestana, .repaso';
  document.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse' || !navigator.vibrate) return;
    const objetivo = e.target.closest && e.target.closest(tactil);
    if (!objetivo || objetivo.disabled) return;
    if (typeof progreso === 'object' && progreso && progreso.ajustes && (progreso.ajustes.vibracion === false || progreso.ajustes.calma)) return;
    try { navigator.vibrate(6); } catch (err) { /* sin vibración */ }
  }, { passive: true });
})();
