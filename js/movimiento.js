// MOVIMIENTO: animaciones al navegar. Ondas al pulsar, origen del zoom al abrir una pantalla y aparición de
// los elementos al hacer scroll. Todo se apaga con «Menos movimiento» o con prefers-reduced-motion.
(function () {
  const quieto = () => (typeof sinMovimiento === 'function' ? sinMovimiento() : false);
  const origen = { x: 0, y: 0, t: 0 };
  const TOCABLE = 'button, a[href], [role="button"], [role="tab"], .juego, .repaso, .nodo, .opcion, .articulo, summary';

  // Onda dorada en el punto donde tocas (se crea fuera de la pantalla actual y no estorba)
  document.addEventListener('pointerdown', (e) => {
    origen.x = e.clientX; origen.y = e.clientY; origen.t = Date.now();
    if (quieto() || !e.target.closest || !e.target.closest(TOCABLE) || e.target.closest('#portada')) return;
    const o = document.createElement('span');
    o.className = 'onda';
    o.setAttribute('aria-hidden', 'true');
    o.style.left = e.clientX + 'px';
    o.style.top = e.clientY + 'px';
    document.body.append(o);
    setTimeout(() => o.remove(), 700);
  }, { passive: true });

  // Desde dónde se abre la pantalla nueva: el último toque (si fue hace poco) o el centro-alto
  window.origenZoom = (raiz) => {
    const reciente = Date.now() - origen.t < 900;
    raiz.style.setProperty('--ox', reciente ? origen.x + 'px' : '50%');
    raiz.style.setProperty('--oy', reciente ? origen.y + 'px' : '38%');
  };

  // Los elementos que quedan fuera de pantalla entran con un pequeño rebote cuando llegas a ellos
  let obs = null;
  window.revelarScroll = (raiz) => {
    if (obs) { obs.disconnect(); obs = null; }
    if (quieto() || typeof IntersectionObserver !== 'function') return;
    const alto = window.innerHeight || 800;
    const lista = Array.from(raiz.querySelectorAll('main > *, .lista-pr > li, .articulos > *, #panel-juegos .juego, .ajuste-grupo, details, section'))
      .filter((n) => !n.closest('.torre') && !n.hidden && !n.closest('[hidden]') && !n.querySelector('.rv') && n.getBoundingClientRect().top > alto - 30 && n.getBoundingClientRect().height > 20);
    if (!lista.length) return;
    let lote = 0, aviso = 0;
    obs = new IntersectionObserver((entradas) => {
      entradas.filter((en) => en.isIntersecting).forEach((en, k) => {
        en.target.style.setProperty('--rd', k * 70 + 'ms');
        en.target.classList.add('rv-ok');
        obs && obs.unobserve(en.target);
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -6% 0px' });
    lista.forEach((n, i) => { n.classList.add('rv'); n.style.setProperty('--rx', (i % 2 ? 14 : -14) + 'px'); obs.observe(n); });
    // por si el navegador no avisa (pantalla minimizada...): nada se queda oculto
    setTimeout(() => raiz.querySelectorAll('.rv:not(.rv-ok)').forEach((n) => { const r = n.getBoundingClientRect(); if (r.top < (window.innerHeight || 800)) n.classList.add('rv-ok'); }), 2500);
  };
})();
