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
    `</svg>`
  );
}
