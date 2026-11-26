// MARCA: Ases. Todo lo que define la identidad (nombre, logo, hero de inicio) vive aquí.
// Esencia: una baraja impresa de toda la vida. Tinta marino, papel crema, rojo de naipe y ocre.
const MARCA = { nombre: 'Ases', descriptor: 'Escuela de cartas', lema: 'Aprende la baraja. Juega con cabeza.' };

// Logo: dos naipes cruzados con el As
const LOGO_FICHA = '<svg viewBox="0 0 32 32" width="30" height="30" aria-hidden="true" focusable="false"><rect x="6" y="2.5" width="20" height="27" rx="3.2" fill="#f7edd3" stroke="#e3a82d" stroke-width="1.6" transform="rotate(-8 16 16)"/><rect x="6" y="2.5" width="20" height="27" rx="3.2" fill="#f7edd3" stroke="#131b30" stroke-width="1.8" transform="rotate(6 16 16)"/><text x="16.6" y="17.5" text-anchor="middle" font-size="14" fill="#c8372d" font-family="Georgia,serif" font-weight="700" transform="rotate(6 16 16)">A</text><text x="16.6" y="26" text-anchor="middle" font-size="9.5" fill="#131b30" font-family="Georgia,serif" transform="rotate(6 16 16)">♠</text></svg>';

function logoMarca() {
  const marca = el('span', { class: 'logo-ficha' });
  marca.innerHTML = LOGO_FICHA;
  return el('span', { class: 'logo' }, marca, el('span', { class: 'logo-nombre' }, MARCA.nombre));
}

// Pantalla principal: el hero. Dice dónde te quedaste y te deja seguir con un toque.
function heroInicio() {
  const curso = (progreso.ultimoCurso && CURSOS.find((c) => c.id === progreso.ultimoCurso)) || null;
  const nuevo = !curso && progreso.xp === 0;
  const base = curso || CURSOS[0];
  const siguiente = nuevo ? niveles(base)[0] : siguienteNivel(base);
  let titulo, detalle, boton, alPulsar;
  if (nuevo) {
    titulo = 'Tu primera mano';
    detalle = `Empieza en la mesa de ${base.nombre}: cinco minutos y ya sabes jugar.`;
    boton = 'Empezar';
    alPulsar = () => mostrarIntro(base, siguiente);
  } else if (siguiente) {
    titulo = `Sigue en ${base.nombre}`;
    detalle = `Nivel ${hechosDe(base) + 1} de ${niveles(base).length}: ${siguiente.titulo}`;
    boton = 'Seguir jugando';
    alPulsar = () => mostrarIntro(base, siguiente);
  } else {
    titulo = `${base.nombre}: mesa completada`;
    detalle = 'Repite los niveles que quieras o prueba otra mesa.';
    boton = 'Ver el mapa';
    alPulsar = () => mostrarMapa(base);
  }
  const lineas = el('div', { class: 'hero-lineas', 'aria-hidden': 'true' });
  lineas.innerHTML = '<svg viewBox="0 0 360 200" preserveAspectRatio="xMidYMid slice" focusable="false"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M-10 170 Q180 40 370 170"/><path d="M-10 200 Q180 80 370 200" stroke-dasharray="2 9"/><circle cx="300" cy="46" r="22"/><circle cx="300" cy="46" r="34" stroke-dasharray="3 8"/></g></svg>';
  return el('section', { class: 'hero-tapete', 'aria-label': 'Continuar' },
    lineas,
    el('div', { class: 'hero-texto' },
      el('h1', { class: 'hero-titulo' }, titulo),
      el('p', { class: 'hero-detalle' }, detalle),
      el('button', { class: 'boton hero-boton', type: 'button', 'data-accion': 'seguir', onclick: alPulsar }, boton)),
    el('div', { class: 'hero-nai', 'aria-hidden': 'true' }, mascota('feliz')));
}

// FONDO ANIMADO: cada fondo (el de la marca y los de la tienda) es una escena de juegos de azar con movimiento propio.
//   clasico     Tapete: cartas, fichas, dados y palos suben despacio, con un aro de tiza que gira
//   mesa        Mesa de casino (blackjack): se reparten cartas de un lado a otro y las fichas cabecean abajo
//   medianoche  Noche de póker: cartas que caen como nieve y palos que centellean
//   atardecer   Ruleta al atardecer: una ruleta gigante gira con su bola y suben fichas
//   neon        Tragaperras neón: carretes con 7, BAR, cerezas y diamantes, y dados que ruedan
//   dorado      Salón dorado: llueven fichas y monedas de oro con destellos
// Todo es CSS (transform y opacity). Se apaga con el modo calma y con «reducir movimiento» del sistema.
const FONDO_SVG = {
  carta: (palo, rojo, letra = 'A') => `<svg viewBox="0 0 40 56" focusable="false"><rect x="1.5" y="1.5" width="37" height="53" rx="5" fill="#fffdf5" stroke="#0a262d" stroke-width="2"/><text x="6.5" y="15" font-size="12" font-family="Georgia,serif" font-weight="700" fill="${rojo ? '#c4311d' : '#0a262d'}">${letra}</text><text x="20" y="42" text-anchor="middle" font-size="26" fill="${rojo ? '#c4311d' : '#0a262d'}">${palo}</text></svg>`,
  dorso: () => '<svg viewBox="0 0 40 56" focusable="false"><rect x="1.5" y="1.5" width="37" height="53" rx="5" fill="#0c3a44" stroke="#f3b63f" stroke-width="2"/><rect x="6" y="6" width="28" height="44" rx="3" fill="none" stroke="#eef1e6" stroke-opacity=".6" stroke-width="1.4" stroke-dasharray="2 3"/><text x="20" y="35" text-anchor="middle" font-size="20" fill="#f3b63f">♠</text></svg>',
  ficha: (c = '#e0402a') => `<svg viewBox="0 0 32 32" focusable="false"><circle cx="16" cy="16" r="15" fill="${c}"/><circle cx="16" cy="16" r="12.4" fill="none" stroke="#fff6df" stroke-width="3" stroke-dasharray="4.1 4.1"/><circle cx="16" cy="16" r="8" fill="${c}" stroke="#fff6df" stroke-width="1.2"/><circle cx="16" cy="16" r="15" fill="none" stroke="#000" stroke-opacity=".25"/></svg>`,
  dado: (n = 5) => {
    const P = { 1: [[16, 16]], 2: [[9, 9], [23, 23]], 3: [[9, 9], [16, 16], [23, 23]], 4: [[9, 9], [23, 9], [9, 23], [23, 23]], 5: [[9, 9], [23, 9], [16, 16], [9, 23], [23, 23]], 6: [[9, 8], [23, 8], [9, 16], [23, 16], [9, 24], [23, 24]] }[n];
    return `<svg viewBox="0 0 32 32" focusable="false"><rect x="2" y="2" width="28" height="28" rx="6" fill="#fffdf5" stroke="#0a262d" stroke-width="2"/>${P.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.8" fill="${n === 1 ? '#c4311d' : '#0a262d'}"/>`).join('')}</svg>`;
  },
  cereza: () => '<svg viewBox="0 0 40 40" focusable="false"><path d="M20 6 Q22 18 11 28 M20 6 Q24 16 29 27" fill="none" stroke="#2f8f3a" stroke-width="2.6" stroke-linecap="round"/><circle cx="11" cy="29" r="7.5" fill="#e0402a"/><circle cx="29" cy="28" r="7.5" fill="#e0402a"/><circle cx="8.5" cy="26.5" r="2" fill="#fff" fill-opacity=".6"/><circle cx="26.5" cy="25.5" r="2" fill="#fff" fill-opacity=".6"/></svg>',
  siete: () => '<svg viewBox="0 0 40 40" focusable="false"><text x="20" y="33" text-anchor="middle" font-size="36" font-weight="900" font-family="Georgia,serif" fill="#e0402a" stroke="#fff6df" stroke-width="1.4">7</text></svg>',
  bar: () => '<svg viewBox="0 0 60 30" focusable="false"><rect x="2" y="3" width="56" height="24" rx="5" fill="#0c3a44" stroke="#f3b63f" stroke-width="2.4"/><text x="30" y="22" text-anchor="middle" font-size="17" font-weight="900" font-family="Arial Black,Arial,sans-serif" fill="#f3b63f" letter-spacing="1.5">BAR</text></svg>',
  diamante: () => '<svg viewBox="0 0 40 40" focusable="false"><path d="M20 4 L35 16 L20 36 L5 16 Z" fill="#17d3ff" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/><path d="M5 16 H35 M13 16 L20 4 L27 16 L20 36 L13 16" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="1.2"/></svg>',
  estrella: () => '<svg viewBox="0 0 40 40" focusable="false"><path d="M20 3 L25 15 L38 16 L28 25 L31 38 L20 31 L9 38 L12 25 L2 16 L15 15 Z" fill="#ffd23f" stroke="#fff6df" stroke-width="1.4" stroke-linejoin="round"/></svg>',
  moneda: () => '<svg viewBox="0 0 32 32" focusable="false"><circle cx="16" cy="16" r="15" fill="#e0a100"/><circle cx="16" cy="16" r="12" fill="#ffd23f" stroke="#b87900" stroke-width="1.6"/><text x="16" y="21.5" text-anchor="middle" font-size="15" font-weight="900" font-family="Georgia,serif" fill="#b87900">$</text></svg>',
};
const FONDO_PALOS = [['♠', 0], ['♥', 1], ['♣', 0], ['♦', 1]];

function montarFondo() {
  const fondo = document.querySelector('.decor');
  if (!fondo) return;
  const escena = document.documentElement.dataset.fondo || 'clasico';
  if (fondo.dataset.escena === escena && fondo.childElementCount) return;
  fondo.dataset.escena = escena;
  fondo.textContent = '';
  const pieza = (html, anim, xp, yp, t, d, r, extra = '') => {
    const p = el('span', { class: 'pz ' + anim, style: `--xp:${xp}vw;--yp:${yp}vh;--t:${t}px;--d:${d}s;--r:${r}s;--rot:${((xp * 7 + yp * 3) % 50) - 25}deg;${extra}` });
    const dentro = el('span', { class: 'pz-in', style: `--s:${5 + ((xp + yp) % 5) * 2}s` });
    dentro.innerHTML = html;
    p.append(dentro);
    fondo.append(p);
  };
  const mezcla = (i) => {
    const k = i % 7;
    if (k === 0) return FONDO_SVG.carta(...FONDO_PALOS[i % 4]);
    if (k === 1) return FONDO_SVG.ficha(['#e0402a', '#0c6a78', '#f3b63f'][i % 3]);
    if (k === 2) return FONDO_SVG.dado(1 + (i % 6));
    if (k === 3) return `<span class="glifo ${FONDO_PALOS[i % 4][1] ? 'r' : ''}">${FONDO_PALOS[i % 4][0]}</span>`;
    if (k === 4) return FONDO_SVG.dorso();
    if (k === 5) return FONDO_SVG.siete();
    return FONDO_SVG.ficha('#0c3a44');
  };
  if (escena === 'clasico') {
    const aro = el('div', { class: 'fondo-aro' });
    aro.innerHTML = '<svg viewBox="0 0 200 200" focusable="false"><circle cx="100" cy="100" r="96" fill="none" stroke="currentColor" stroke-width="1.4" stroke-dasharray="1.5 7" stroke-linecap="round"/><circle cx="100" cy="100" r="74" fill="none" stroke="currentColor" stroke-width="1" stroke-dasharray="10 9"/><circle cx="100" cy="100" r="50" fill="none" stroke="currentColor" stroke-width="1.2"/></svg>';
    fondo.append(aro);
    for (let i = 0; i < 16; i++) pieza(mezcla(i), 'sube', 4 + ((i * 37) % 88), 8 + ((i * 29) % 80), 26 + ((i * 11) % 22), 44 + ((i * 7) % 30), -((i * 13) % 55));
  } else if (escena === 'mesa') {
    const mesa = el('div', { class: 'mesa-borde' });
    fondo.append(mesa);
    for (let i = 0; i < 9; i++) pieza(i % 3 === 2 ? FONDO_SVG.dorso() : FONDO_SVG.carta(...FONDO_PALOS[i % 4], ['A', 'K', 'Q', 'J', '10', '9', '8', '7', '5'][i]), 'reparte', 10 + ((i * 11) % 80), 6 + ((i * 17) % 70), 38 + ((i * 5) % 14), 16 + ((i * 3) % 8), -(i * 2.3));
    for (let i = 0; i < 6; i++) pieza(FONDO_SVG.ficha(['#e0402a', '#1b6bd1', '#f3b63f', '#0c3a44', '#7a2cff', '#e0402a'][i]), 'cabecea', 8 + i * 16, 86, 34 + (i % 3) * 6, 3.4 + (i % 3) * 0.7, -(i * 0.6));
  } else if (escena === 'medianoche') {
    for (let i = 0; i < 12; i++) pieza(i % 2 ? FONDO_SVG.carta(...FONDO_PALOS[i % 4], 'A') : FONDO_SVG.dorso(), 'cae', 4 + ((i * 41) % 90), 10 + ((i * 23) % 70), 30 + ((i * 9) % 20), 34 + ((i * 7) % 26), -((i * 9) % 50));
    for (let i = 0; i < 16; i++) pieza(`<span class="glifo ${FONDO_PALOS[i % 4][1] ? 'r' : ''}">${FONDO_PALOS[i % 4][0]}</span>`, 'centellea', 3 + ((i * 53) % 94), 4 + ((i * 31) % 90), 12 + (i % 4) * 5, 3 + (i % 5), -(i * 0.7));
  } else if (escena === 'atardecer') {
    const rueda = el('div', { class: 'ruleta' }, el('div', { class: 'ruleta-rueda' }), el('div', { class: 'ruleta-bola-pista' }, el('span', { class: 'ruleta-bola' })), el('div', { class: 'ruleta-centro' }));
    fondo.append(rueda);
    for (let i = 0; i < 9; i++) pieza(i % 3 ? FONDO_SVG.ficha(['#e0402a', '#f3b63f', '#7a2cff'][i % 3]) : FONDO_SVG.dado(1 + i % 6), 'sube', 5 + ((i * 43) % 88), 10 + ((i * 29) % 60), 24 + ((i * 7) % 18), 40 + ((i * 6) % 28), -((i * 11) % 50));
  } else if (escena === 'neon') {
    const SIMB = [FONDO_SVG.siete(), FONDO_SVG.bar(), FONDO_SVG.cereza(), FONDO_SVG.diamante(), FONDO_SVG.estrella(), FONDO_SVG.siete(), FONDO_SVG.cereza(), FONDO_SVG.diamante()];
    const carretes = el('div', { class: 'carretes' });
    for (let c = 0; c < 4; c++) {
      const lista = SIMB.map((_, i) => SIMB[(i + c * 3) % SIMB.length]);
      const tira = el('div', { class: 'carrete-tira', style: `--d:${15 + c * 5}s;--sentido:${c % 2 ? 'reverse' : 'normal'}` });
      tira.innerHTML = lista.concat(lista).map((s) => `<span class="carrete-simbolo">${s}</span>`).join('');
      carretes.append(el('div', { class: 'carrete' }, tira));
    }
    fondo.append(carretes);
    for (let i = 0; i < 5; i++) pieza(FONDO_SVG.dado(1 + ((i * 2) % 6)), 'rueda', 6 + i * 21, 20 + ((i * 23) % 60), 30 + (i % 3) * 6, 18 + i * 3, -(i * 4));
  } else if (escena === 'dorado') {
    for (let i = 0; i < 14; i++) pieza(i % 3 === 0 ? FONDO_SVG.moneda() : i % 3 === 1 ? FONDO_SVG.ficha('#e0a100') : `<span class="glifo oro">${['♦', '♠', '♥', '♣'][i % 4]}</span>`, 'cae', 3 + ((i * 47) % 92), 8 + ((i * 31) % 70), 24 + ((i * 11) % 24), 22 + ((i * 5) % 20), -((i * 7) % 34));
    for (let i = 0; i < 10; i++) pieza('<span class="destello">✦</span>', 'centellea', 4 + ((i * 59) % 92), 6 + ((i * 37) % 86), 14 + (i % 4) * 6, 2.4 + (i % 4), -(i * 0.5));
    fondo.append(el('div', { class: 'brillo-barrido' }));
  }
}
document.addEventListener('DOMContentLoaded', () => {
  montarFondo();
  new MutationObserver(montarFondo).observe(document.documentElement, { attributes: true, attributeFilter: ['data-fondo'] });
});
