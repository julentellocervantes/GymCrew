/* GymCrew · capa de movimiento: destello al pulsar, emojis que vuelan,
   aparición al deslizar y brillo en lo nuevo. Sin dependencias. */
(function () {
  'use strict';
  const mq = window.matchMedia ? matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  const calm = () => { try { return mq.matches || (typeof reduceMotion === 'function' && reduceMotion()); } catch (e) { return mq.matches; } };
  const EMO = /\p{Extended_Pictographic}/u;
  const rnd = (a, b) => a + Math.random() * (b - a);

  function add(cls, x, y, txt, vars, life) {
    const n = document.createElement('div'); n.className = cls; if (txt) n.textContent = txt;
    n.style.left = x + 'px'; n.style.top = y + 'px';
    for (const k in (vars || {})) n.style.setProperty(k, vars[k]);
    document.body.appendChild(n); setTimeout(() => n.remove(), life || 1300); return n;
  }
  const ripple = (x, y) => add('rip', x, y, '', null, 800);
  function burst(x, y, emo, n) {
    n = n || 7;
    add('fly big', x, y, emo, null, 1000);
    for (let i = 0; i < n; i++) {
      const a = rnd(-Math.PI * .95, -Math.PI * .05), d = rnd(50, 120);
      add('fly', x, y, emo, { '--x': Math.cos(a) * d + 'px', '--y': Math.sin(a) * d - 20 + 'px', '--r': rnd(-50, 50) + 'deg', '--sz': rnd(.9, 1.6) + 'rem', '--d': rnd(.8, 1.3) + 's', '--dl': i * 35 + 'ms' }, 1700);
    }
  }
  window.fxBurst = (x, y, e, n) => { if (!calm()) burst(x, y, e, n); };

  /* pulsación: destello en todo lo que se toca; emojis vuelan en reacciones */
  const TAP = 'button, [role="button"], .row, .tab, .tweet, .nt-row, .nw-card, .day, .fx';
  document.addEventListener('pointerdown', e => {
    if (calm()) return;
    const t = e.target.closest && e.target.closest(TAP);
    if (!t || t.disabled) return;
    ripple(e.clientX, e.clientY);
  }, { passive: true });
  document.addEventListener('click', e => {
    if (calm()) return;
    const b = e.target.closest && e.target.closest('button, .fx, [role="button"]');
    if (!b || b.disabled) return;
    const t = (b.textContent || '').trim();
    const m = t.match(/^\p{Extended_Pictographic}(️|‍\p{Extended_Pictographic})*/u);
    const isLike = b.classList.contains('tw-act') && b.classList.contains('like');
    const first = isLike ? (b.classList.contains('on') ? '' : '❤️') : (m ? m[0] : '');
    const small = t.length <= 6 || b.classList.contains('tw-act') || b.classList.contains('react');
    if (first && small && first !== '🤍' && EMO.test(first) && !b.classList.contains('nw-card') && !b.classList.contains('tab')) {
      const r = b.getBoundingClientRect(); burst(e.clientX || r.left + r.width / 2, e.clientY || r.top + r.height / 2, first);
    }
  }, true);

  /* aparición al deslizar */
  const SEL = '.tweet, .nt-row, .glass.row, .reg, .card, .fold, .pass-card, .tn-game, .day-sep';
  let io = null, stag = 0, stagT = 0;
  if ('IntersectionObserver' in window) {
    io = new IntersectionObserver(es => {
      es.forEach(en => {
        if (!en.isIntersecting) return;
        const el = en.target; io.unobserve(el);
        const d = Math.min(stag++, 5) * 60; clearTimeout(stagT); stagT = setTimeout(() => { stag = 0; }, 160);
        setTimeout(() => { el.classList.remove('pre'); setTimeout(() => el.classList.remove('rev'), 900); }, d);
      });
    }, { threshold: .08, rootMargin: '0px 0px -6% 0px' });
  }
  function prep(root) {
    if (!io || calm() || !root.querySelectorAll) return;
    const list = root.matches && root.matches(SEL) ? [root] : [];
    root.querySelectorAll(SEL).forEach(x => list.push(x));
    for (const el of list) {
      if (el.classList.contains('rev') || el.dataset.noRev) continue;
      const r = el.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) continue;               // oculto: no tocar
      if (r.top < window.innerHeight * .98 && r.bottom > 0) continue; // ya a la vista: sin parpadeo
      if (r.top < 0) continue;
      el.classList.add('rev', 'pre'); io.observe(el);
    }
  }
  let pend = [], raf = 0;
  new MutationObserver(ms => {
    for (const m of ms) m.addedNodes.forEach(n => { if (n.nodeType === 1) pend.push(n); });
    if (!raf) raf = requestAnimationFrame(() => { raf = 0; const p = pend; pend = []; p.forEach(prep); });
  }).observe(document.body, { childList: true, subtree: true });

  /* cabecera al deslizar */
  let sy = 0;
  addEventListener('scroll', () => { if (sy) return; sy = requestAnimationFrame(() => { sy = 0; document.body.classList.toggle('scrolled', scrollY > 8); }); }, { passive: true });

  /* campana: se agita cuando sube el número de no leídas */
  const bell = document.getElementById('bellBtn'), badge = document.getElementById('bellBadge');
  if (bell && badge) {
    let last = 0;
    new MutationObserver(() => {
      const n = badge.classList.contains('hidden') ? 0 : +badge.textContent || 0;
      if (n > last && !calm()) { bell.classList.remove('ring'); void bell.offsetWidth; bell.classList.add('ring'); setTimeout(() => bell.classList.remove('ring'), 1000); }
      last = n;
    }).observe(badge, { childList: true, attributes: true, attributeFilter: ['class'], characterData: true, subtree: true });
  }

  /* publicaciones nuevas que llegan arriba: brillo */
  const fl = document.getElementById('feedList');
  if (fl) {
    let seen = new Set();
    new MutationObserver(() => {
      const items = [...fl.querySelectorAll('.tweet[data-id]')];
      const ids = new Set(items.map(x => x.dataset.id));
      if (seen.size && !calm()) items.forEach(x => { if (!seen.has(x.dataset.id) && x.getBoundingClientRect().top < innerHeight) { x.classList.add('fresh'); setTimeout(() => x.classList.remove('fresh'), 2300); } });
      seen = ids;
    }).observe(fl, { childList: true });
  }
})();
