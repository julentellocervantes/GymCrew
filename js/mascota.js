// Nai, la mascota: un naipe simpático con cara, brazos y pajarita.
// mascotaSVG(estado) devuelve el dibujo según su estado de ánimo:
//   'normal' | 'feliz' | 'pensando' | 'triste' | 'celebrando'

function mascotaSVG(estado, piel) {
  if (!piel) piel = typeof progreso !== 'undefined' && progreso.tienda ? progreso.tienda.equipado.nai : 'clasico';
  const oro = piel === 'oro';
  const TRAZO = 'fill="none" stroke="#14181f" stroke-width="3.5" stroke-linecap="round"';
  const BRAZO = 'fill="none" stroke="#2e3a4d" stroke-width="5" stroke-linecap="round"';
  const mano = (x, y) =>
    `<circle cx="${x}" cy="${y}" r="6" fill="#fffbea" stroke="#2e3a4d" stroke-width="3"/>`;

  // Cada brazo va en su propio grupo para poder animarlo (saludar, celebrar, pensar)
  const brazo = (clase, d, x, y) => `<g class="${clase}"><path d="${d}" ${BRAZO}/>${mano(x, y)}</g>`;
  const BRAZOS = {
    abajo:
      brazo('brazo-i', 'M22 74 Q9 84 12 98', 12, 98) + brazo('brazo-d', 'M98 74 Q111 84 108 98', 108, 98),
    arriba:
      brazo('brazo-i', 'M22 70 Q8 56 14 40', 14, 40) + brazo('brazo-d', 'M98 70 Q112 56 106 40', 106, 40),
    pensando:
      brazo('brazo-i', 'M22 74 Q9 84 12 98', 12, 98) + brazo('brazo-d', 'M98 72 Q112 62 104 48', 104, 48),
  };

  const ESTADOS = {
    normal: {
      boca: `<path d="M51 87 Q60 92 69 87" ${TRAZO}/>`,
      cejas: '',
      brazos: 'abajo',
      pupila: [0, 0],
      extra: '',
    },
    feliz: {
      boca: `<path d="M48 84 Q60 98 72 84" ${TRAZO}/>`,
      cejas: `<path d="M37 47 Q46 42 55 47" ${TRAZO}/><path d="M65 47 Q74 42 83 47" ${TRAZO}/>`,
      brazos: 'abajo',
      pupila: [0, 0],
      extra: '',
    },
    celebrando: {
      boca:
        `<path d="M46 82 Q60 106 74 82 Z" fill="#7a1f2b" stroke="#14181f" stroke-width="3.5" stroke-linejoin="round"/>` +
        `<path d="M53 94 Q60 89 67 94 Q60 99 53 94 Z" fill="#ff7a8a"/>`,
      cejas: `<path d="M37 45 Q46 38 55 45" ${TRAZO}/><path d="M65 45 Q74 38 83 45" ${TRAZO}/>`,
      brazos: 'arriba',
      pupila: [0, -1],
      extra: '',
    },
    pensando: {
      boca: `<path d="M52 90 Q60 87 68 91" ${TRAZO}/>`,
      cejas: `<path d="M37 46 Q46 39 55 46" ${TRAZO}/><path d="M65 49 L83 47" ${TRAZO}/>`,
      brazos: 'pensando',
      pupila: [3, -3],
      extra: '',
    },
    triste: {
      boca: `<path d="M50 95 Q60 84 70 95" ${TRAZO}/>`,
      cejas: `<path d="M37 49 L55 43" ${TRAZO}/><path d="M65 43 L83 49" ${TRAZO}/>`,
      brazos: 'abajo',
      pupila: [0, 2],
      extra: `<path class="nai-lagrima" d="M38 74 Q35 80 38 83 Q41 80 38 74 Z" fill="#6ec6ff"/>`,
    },
  };

  const e = ESTADOS[estado] || ESTADOS.feliz;
  const [px, py] = e.pupila;

  const ojo = (cx) =>
    `<ellipse cx="${cx}" cy="62" rx="9" ry="11" fill="#fff" stroke="#14181f" stroke-width="2.5"/>` +
    `<circle cx="${cx + px}" cy="${64 + py}" r="5" fill="#14181f"/>` +
    `<circle cx="${cx + px + 2}" cy="${61 + py}" r="1.8" fill="#fff"/>`;

  return (
    `<svg viewBox="0 0 120 140" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">` +
    BRAZOS[e.brazos] +
    // pies
    `<ellipse cx="46" cy="124" rx="12" ry="6" fill="#2e3a4d"/><ellipse cx="74" cy="124" rx="12" ry="6" fill="#2e3a4d"/>` +
    // cuerpo (el naipe)
    `<rect x="22" y="8" width="76" height="108" rx="14" fill="${oro ? '#ffe58a' : '#fffbea'}" stroke="${oro ? '#a86a00' : '#2e3a4d'}" stroke-width="4"/>` +
    // esquinas del naipe
    `<text x="30" y="28" font-size="15" font-weight="800" fill="#14181f" font-family="Georgia,serif">A</text>` +
    `<text x="30" y="42" font-size="14" fill="#14181f">♠</text>` +
    `<text x="90" y="110" font-size="14" fill="#e03b3b" text-anchor="middle">♥</text>` +
    // ojos, cejas, mejillas y boca
    `<g class="nai-ojos">${ojo(46)}${ojo(74)}</g>` +
    e.cejas +
    `<ellipse cx="36" cy="82" rx="6" ry="4" fill="#ffb3c1" opacity=".8"/>` +
    `<ellipse cx="84" cy="82" rx="6" ry="4" fill="#ffb3c1" opacity=".8"/>` +
    e.boca +
    // pajarita
    `<path d="M52 104 L60 108 L52 112 Z M68 104 L60 108 L68 112 Z" fill="${oro ? '#d62839' : '#58cc02'}"/>` +
    `<circle cx="60" cy="108" r="2.5" fill="${oro ? '#a31b2a' : '#46a302'}"/>` +
    e.extra +
    // accesorios de la tienda
    (piel === 'gafas' ? `<rect x="33" y="52" width="26" height="17" rx="7" fill="#14181f"/><rect x="61" y="52" width="26" height="17" rx="7" fill="#14181f"/><path d="M59 58 H61" stroke="#14181f" stroke-width="3"/><path d="M37 56 L44 56" stroke="#7a8aa5" stroke-width="2.5" stroke-linecap="round"/><path d="M65 56 L72 56" stroke="#7a8aa5" stroke-width="2.5" stroke-linecap="round"/>` : '') +
    (piel === 'copa' ? `<rect x="46" y="0" width="28" height="11" rx="2" fill="#14181f"/><rect x="46" y="6" width="28" height="3" fill="#d62839"/><ellipse cx="60" cy="11" rx="24" ry="4.5" fill="#14181f"/>` : '') +
    (piel === 'corona' ? `<path d="M42 13 L45 2 L53 9 L60 0 L67 9 L75 2 L78 13 Z" fill="#ffd23f" stroke="#a86a00" stroke-width="2.5" stroke-linejoin="round"/>` : '') +
    (SKINS_NAI[piel] || '') +
    `</svg>`
  );
}

// Accesorios nuevos de la tienda (dibujados sobre el naipe; ojos en y=62)
const SKINS_NAI = {
  vaquero: `<path d="M30 14 Q60 22 90 14 Q96 8 100 2 Q84 14 60 14 Q36 14 20 2 Q24 8 30 14Z" fill="#a8672a" stroke="#5a3210" stroke-width="2.5" stroke-linejoin="round"/><path d="M42 14 Q42 -2 60 -2 Q78 -2 78 14Z" fill="#c07a34" stroke="#5a3210" stroke-width="2.5" stroke-linejoin="round"/><path d="M42 10 H78" stroke="#5a3210" stroke-width="3"/><circle cx="60" cy="10" r="2.6" fill="#ffd23f"/>`,
  mago: `<path d="M34 16 L60 -18 L86 16Z" fill="#3b2a8a" stroke="#1d1450" stroke-width="2.5" stroke-linejoin="round"/><ellipse cx="60" cy="16" rx="34" ry="5" fill="#3b2a8a" stroke="#1d1450" stroke-width="2.5"/><path d="M49 10 H71" stroke="#ffd23f" stroke-width="3"/><circle cx="58" cy="-2" r="2.4" fill="#ffd23f"/><circle cx="66" cy="6" r="1.8" fill="#fff"/><circle cx="53" cy="4" r="1.4" fill="#ffd23f"/>`,
  pirata: `<path d="M24 38 Q60 24 96 38" stroke="#14181f" stroke-width="3" fill="none"/><ellipse cx="46" cy="62" rx="13" ry="14" fill="#14181f"/><path d="M33 54 L24 38 M59 54 L96 40" stroke="#14181f" stroke-width="2.5"/><path d="M40 10 L60 2 L80 10 L76 20 L44 20Z" fill="#c1121f" stroke="#7a0a12" stroke-width="2.5" stroke-linejoin="round"/><circle cx="60" cy="12" r="3" fill="#fff"/>`,
  detective: `<ellipse cx="60" cy="14" rx="30" ry="5" fill="#6b4a2a" stroke="#3a2410" stroke-width="2.5"/><path d="M42 14 Q42 -2 60 -2 Q78 -2 78 14Z" fill="#8a5e34" stroke="#3a2410" stroke-width="2.5" stroke-linejoin="round"/><path d="M42 10 H78" stroke="#1d1d1d" stroke-width="3.5"/><circle cx="74" cy="64" r="13" fill="rgba(180,220,255,.25)" stroke="#a86a00" stroke-width="3"/><path d="M84 74 L94 90" stroke="#a86a00" stroke-width="3" stroke-linecap="round"/>`,
  cascos: `<path d="M26 54 Q26 18 60 18 Q94 18 94 54" stroke="#2e3a4d" stroke-width="5" fill="none" stroke-linecap="round"/><rect x="14" y="48" width="14" height="26" rx="6" fill="#58cc02" stroke="#2e3a4d" stroke-width="3"/><rect x="92" y="48" width="14" height="26" rx="6" fill="#58cc02" stroke="#2e3a4d" stroke-width="3"/>`,
  antifaz: `<path fill-rule="evenodd" d="M26 52 Q60 42 94 52 L96 68 Q82 78 70 66 Q60 62 50 66 Q38 78 24 68Z M37 62 a9 11 0 1 0 18 0 a9 11 0 1 0 -18 0Z M65 62 a9 11 0 1 0 18 0 a9 11 0 1 0 -18 0Z" fill="#5a1a8a" stroke="#ffd23f" stroke-width="2.5" stroke-linejoin="round"/><path d="M30 50 L22 38 M90 50 L98 38" stroke="#ffd23f" stroke-width="3" stroke-linecap="round"/><circle cx="60" cy="50" r="2.4" fill="#ffd23f"/>`,
  bigote: `<path d="M60 78 Q52 70 44 76 Q36 82 42 86 Q46 82 52 82 Q58 82 60 80 Q62 82 68 82 Q74 82 78 86 Q84 82 76 76 Q68 70 60 78Z" fill="#2a1a10" stroke="#14181f" stroke-width="1.5" stroke-linejoin="round"/>`,
  laurel: `<g fill="#58a02a" stroke="#2e6a14" stroke-width="1.6"><path d="M30 20 Q24 12 28 6 Q36 10 34 18Z"/><path d="M36 14 Q32 6 38 0 Q44 6 40 12Z"/><path d="M46 10 Q44 2 52 -2 Q56 4 52 10Z"/><path d="M90 20 Q96 12 92 6 Q84 10 86 18Z"/><path d="M84 14 Q88 6 82 0 Q76 6 80 12Z"/><path d="M74 10 Q76 2 68 -2 Q64 4 68 10Z"/></g><path d="M28 22 Q60 6 92 22" stroke="#2e6a14" stroke-width="2.5" fill="none"/>`,
};
