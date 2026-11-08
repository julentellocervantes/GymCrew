/* GymCrew · iconos propios.
   Cada emoji de la interfaz se sustituye por un icono dibujado a mano en SVG (pesas, barra, kettlebell,
   llama, medallas...). El emoji original sigue en el texto —oculto— para copiar/pegar, lectores de pantalla
   y el resto de la app. Los iconos se pintan con máscara CSS: heredan el color del texto y algunos llevan degradado.
   Sin imágenes ni recursos externos. El texto que escribe la gente (publicaciones y chats) no se toca. */
(function () {
  'use strict';
  const C = 'M3 12a9 9 0 1 0 18 0a9 9 0 1 0-18 0';              // círculo
  const FACE = C + 'M9 10v.4M15 10v.4';
  // nombre: [trazado, relleno?]
  const P = {
    heart: ['M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.6-7 10-7 10z', 1],
    heartO: ['M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.6-7 10-7 10z'],
    chat: ['M4 5h16v11H10l-4 4v-4H4z'],
    dumbbell: ['M6.5 6.5v11M17.5 6.5v11M3.5 9v6M20.5 9v6M6.5 12h11'],
    barbell: ['M7 5v14M4 8v8M17 5v14M20 8v8M7 12h10M1.5 12h2.5M20 12h2.5'],
    flame: ['M12 21.5c-4 0-6.5-2.7-6.5-6.2 0-3 2-4.6 3-7.3 1.2 1.2 1.6 2.4 1.6 3.4 1.4-1.2 2.4-3.4 2.2-6.4 3.2 2 5.2 5.6 5.2 9.6 0 3.4-2.5 6.9-5.5 6.9z', 1],
    medal: ['M8.5 3l3.5 6.5L15.5 3M7 15a5 5 0 1 0 10 0a5 5 0 1 0-10 0M12 13v4'],
    medal2: ['M8.5 3l3.5 6.5L15.5 3M7 15a5 5 0 1 0 10 0a5 5 0 1 0-10 0M10.4 13.2h3.2l-3.2 3.8h3.4'],
    medal3: ['M8.5 3l3.5 6.5L15.5 3M7 15a5 5 0 1 0 10 0a5 5 0 1 0-10 0M10.4 13.2h3.2l-1.6 1.8 1.6 2h-3.2'],
    star: ['M12 3l2.4 5.6 6 .5-4.6 4 1.4 5.9L12 15.9l-5.2 3.1 1.4-5.9-4.6-4 6-.5z', 1],
    trophy: ['M8 4h8v5a4 4 0 0 1-8 0zM8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M9 20h6M10 17h4'],
    wow: [FACE + 'M12 14.2a1.4 1.8 0 1 0 .01 0'],
    sad: [FACE + 'M8.5 16.5c1-1.3 2-1.8 3.5-1.8s2.5.5 3.5 1.8'],
    meh: [FACE + 'M9 16.2l6-1'],
    flat: [FACE + 'M9 15.5h6'],
    smile: [FACE + 'M8.5 14.5c1 1.4 2 2 3.5 2s2.5-.6 3.5-2'],
    grin: [FACE + 'M8 14h8a4 4 0 0 1-8 0z'],
    group: ['M3 19c.5-3 2.7-4.5 5.5-4.5s5 1.5 5.5 4.5M6 8.5a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0-5 0M16 8.5a2.5 2.5 0 1 1 0 5M17 15c2 .3 3.2 1.7 3.5 4'],
    pulse: ['M2 12h4l2.5-6 4 12 2.5-6H22'],
    yoga: ['M10.5 5.5a1.5 1.5 0 1 0 3 0a1.5 1.5 0 1 0-3 0M12 8v5M7 11.5c2 1 3.5 1.5 5 1.5s3-.5 5-1.5M5.5 18c2.2-2 4.2-2.5 6.5-2.5s4.3.5 6.5 2.5'],
    kettle: ['M9 8a3 3 0 0 1 6 0M12 8c-5 0-7.5 3-7.5 6.500S7 20.5 12 20.500s7.5-2.5 7.5-6S17 8 12 8z'],
    ball: [C + 'M12 8l3.5 2.5-1.3 4H9.800l-1.3-4zM12 3v5M15.5 10.500L20 9M14.2 14.500L17 18.500M9.8 14.500L7 18.500M8.5 10.500L4 9'],
    clip: ['M8 5H6v15h12V5h-2M9 3h6v4H9zM9 12h6M9 16h6'],
    trend: ['M3 17l6-6 4 4 8-8M15 7h6v6'],
    target: [C + 'M7 12a5 5 0 1 0 10 0a5 5 0 1 0-10 0M11 12a1 1 0 1 0 2 0a1 1 0 1 0-2 0'],
    ask: ['M9 9a3 3 0 1 1 4.5 2.600c-1 .6-1.5 1.2-1.5 2.400M12 18v.1'],
    sprout: ['M12 21v-9M12 12c0-4-3-6-7-6 0 4 3 6 7 6zM12 14c0-3 2.5-5 6-5 0 3-2.5 5-6 5z'],
    hand: ['M7 12V6.500a1.5 1.5 0 0 1 3 0V11M10 11V4.500a1.5 1.5 0 0 1 3 0V11M13 11V5.500a1.5 1.5 0 0 1 3 0V13M16 9a1.5 1.5 0 0 1 3 0v4c0 4-2.5 7-6.5 7S7 18 6 15l-2-3a1.5 1.5 0 0 1 2.5-1.500L7 12'],
    gym: ['M3 20V9l9-5 9 5v11zM8 20v-6h8v6M9 10.500h6'],
    pin: ['M12 21s-6-5.5-6-11a6 6 0 1 1 12 0c0 5.5-6 11-6 11zM10 10a2 2 0 1 0 4 0a2 2 0 1 0-4 0'],
    checkC: [C + 'M8 12.500l3 3 5-6'],
    check: ['M5 12.500l4.5 4.500L19 7'],
    bell: ['M6 17V11a6 6 0 1 1 12 0v6l1.5 2h-15zM10 21h4'],
    plus: ['M12 5v14M5 12h14'],
    x: ['M6 6l12 12M18 6L6 18'],
    cam: ['M4 8h3l1.5-2h7L17 8h3v11H4zM9 13.500a3 3 0 1 0 6 0a3 3 0 1 0-6 0'],
    globe: [C + 'M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18'],
    lock: ['M6 11h12v9H6zM8.5 11V8a3.5 3.5 0 0 1 7 0v3'],
    link: ['M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.700l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.700l1-1'],
    pencil: ['M4 20l1-4 11-11 3 3L8 19zM14 7l3 3'],
    spark: ['M12 3c.8 4.2 1.8 5.2 6 6-4.2.8-5.2 1.8-6 6-.8-4.2-1.8-5.2-6-6 4.2-.8 5.2-1.8 6-6zM18 15c.3 1.6.7 2 2.3 2.3-1.6.3-2 .7-2.3 2.3-.3-1.6-.7-2-2.3-2.3 1.6-.3 2-.7 2.3-2.300z'],
    search: ['M4 11a7 7 0 1 0 14 0a7 7 0 1 0-14 0M16 16l4.5 4.5'],
    trash: ['M5 7h14M9 7V4h6v3M7 7l1 13h8l1-13M10 11v5M14 11v5'],
    sliders: ['M4 7h9M17 7h3M4 17h3M11 17h9M13 7a2 2 0 1 0 4 0a2 2 0 1 0-4 0M7 17a2 2 0 1 0 4 0a2 2 0 1 0-4 0'],
    warn: ['M12 4l9 16H3zM12 10v4M12 17v.1'],
    video: ['M3 7h12v10H3zM15 11l6-3v8l-6-3'],
    cal: ['M4 6h16v14H4zM4 10h16M8 3v4M16 3v4'],
    disk: ['M5 4h11l3 3v13H5zM8 4v5h7V4M8 20v-6h8v6'],
    compass: [C + 'M15.5 8.500l-2 5-5 2 2-5z'],
    image: ['M4 5h16v14H4zM4 16l5-5 4 4 3-3 4 4M15 9.500a1 1 0 1 0 2 0a1 1 0 1 0-2 0'],
    mega: ['M4 10v4h3l8 4V6L7 10zM18 9a4 4 0 0 1 0 6'],
    ban: [C + 'M6 6l12 12'],
    eye: ['M2 12s4-6.5 10-6.500S22 12 22 12s-4 6.5-10 6.500S2 12 2 12zM9.5 12a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0-5 0'],
    palette: ['M12 3a9 9 0 1 0 0 18c1.5 0 2-1 1.5-2.2-.5-1.3.3-2.3 1.7-2.300H17a4 4 0 0 0 4-4C21 6.5 17 3 12 3zM7.5 11h.01M10 7.500h.01M14.5 7.500h.01']
  };
  // emoji → icono
  const MAP = {
    '❤': 'heart', '🤍': 'heartO', '💬': 'chat', '💪': 'dumbbell', '🏋': 'barbell', '🔥': 'flame', '🏅': 'medal', '🥇': 'medal', '🥈': 'medal2', '🥉': 'medal3',
    '👏': 'star', '⭐': 'star', '🙌': 'trophy', '😮': 'wow', '😞': 'sad', '😕': 'meh', '😐': 'flat', '🙂': 'smile', '😄': 'grin', '😀': 'smile', '😂': 'grin', '😅': 'smile',
    '👥': 'group', '🏃': 'pulse', '🧘': 'yoga', '🤸': 'kettle', '⚽': 'ball', '📋': 'clip', '📈': 'trend', '🎯': 'target', '❓': 'ask', '🌱': 'sprout', '👋': 'hand',
    '🏟': 'gym', '📍': 'pin', '✅': 'checkC', '✓': 'check', '🔔': 'bell', '➕': 'plus', '✕': 'x', '📷': 'cam', '📸': 'cam', '🌍': 'globe', '🔒': 'lock', '🤝': 'link',
    '✍': 'pencil', '📝': 'pencil', '🎉': 'spark', '✨': 'spark', '🔎': 'search', '🗑': 'trash', '⚙': 'sliders', '⚠': 'warn', '🎥': 'video', '📅': 'cal', '💾': 'disk',
    '🧭': 'compass', '🖼': 'image', '📣': 'mega', '🙅': 'ban', '👀': 'eye', '🎨': 'palette'
  };
  // colores propios (degradados) por icono
  const TINT = {
    heart: 'linear-gradient(135deg,#ff6b8f,#e0245e)', flame: 'linear-gradient(180deg,#ffd447,#ff8a3c 55%,#e0452f)', medal: 'linear-gradient(135deg,#ffe27a,#e8a812)',
    medal2: 'linear-gradient(135deg,#f4f7f8,#98a3a9)', medal3: 'linear-gradient(135deg,#f0b27a,#b8652b)', star: 'linear-gradient(135deg,#ffe27a,#f2b705)',
    trophy: 'linear-gradient(135deg,#ffe27a,#e8a812)', checkC: 'linear-gradient(135deg,var(--accent2,#3ee0a8),var(--accent,#0a8259))', spark: 'linear-gradient(135deg,#ffe27a,#8f7bff)',
    sprout: 'linear-gradient(135deg,#7be495,#17b983)', globe: 'linear-gradient(135deg,#5b95ff,#17b983)'
  };
  const svg = (d, fill) => `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='${fill ? '#000' : 'none'}' stroke='#000' stroke-width='2.1' stroke-linecap='round' stroke-linejoin='round'><path d='${d}'/></svg>`;
  let css = 'span.gi{position:relative;display:inline-block !important;width:1.15em;height:1.15em;vertical-align:-.2em;background:currentColor;-webkit-mask:var(--m) center/contain no-repeat;mask:var(--m) center/contain no-repeat;flex:none}' +
    'span.gi>i{position:absolute;width:1px;height:1px;overflow:hidden;opacity:0;font-style:normal}';
  Object.keys(P).forEach(k => {
    css += `.gi[data-g="${k}"]{--m:url("data:image/svg+xml,${encodeURIComponent(svg(P[k][0], P[k][1]))}");${TINT[k] ? 'background:' + TINT[k] + ';' : ''}}`;
  });
  const st = document.createElement('style'); st.id = 'gicons-css'; st.textContent = css; document.head.appendChild(st);

  const keys = Object.keys(MAP).sort((a, b) => b.length - a.length).map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const RX = new RegExp('(' + keys.join('|') + ')\\uFE0F?', 'gu');
  const SKIP = 'input,textarea,select,option,script,style,title,.gi,.pub-text,.bubble,[contenteditable],[data-raw]';
  function wrap(node) {
    const t = node.nodeValue;
    if (!t || !RX.test(t)) { RX.lastIndex = 0; return; }
    RX.lastIndex = 0;
    const par = node.parentElement;
    if (!par || par.closest(SKIP)) return;
    const f = document.createDocumentFragment();
    let last = 0, m;
    while ((m = RX.exec(t))) {
      if (m.index > last) f.appendChild(document.createTextNode(t.slice(last, m.index)));
      const s = document.createElement('span');
      s.className = 'gi'; s.dataset.g = MAP[m[1]]; s.setAttribute('aria-hidden', 'true');
      const i = document.createElement('i'); i.textContent = m[0]; s.appendChild(i);
      f.appendChild(s); last = m.index + m[0].length;
    }
    RX.lastIndex = 0;
    if (last < t.length) f.appendChild(document.createTextNode(t.slice(last)));
    node.replaceWith(f);
  }
  function walk(root) {
    if (root.nodeType === 3) { wrap(root); return; }
    if (root.nodeType !== 1 || root.closest(SKIP)) return;
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT), list = [];
    let n; while ((n = w.nextNode())) list.push(n);
    list.forEach(wrap);
  }
  let pend = [], raf = 0;
  const flush = () => { raf = 0; const p = pend; pend = []; p.forEach(n => { if (n.isConnected) walk(n); }); };
  new MutationObserver(ms => {
    for (const m of ms) {
      if (m.type === 'characterData') pend.push(m.target); else m.addedNodes.forEach(n => pend.push(n));
    }
    if (!raf) raf = requestAnimationFrame(flush);
  }).observe(document.body, { childList: true, subtree: true, characterData: true });
  walk(document.body);
  window.gIconize = walk;
})();
