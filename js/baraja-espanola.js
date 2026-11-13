// BARAJA ESPAÑOLA (la del mus): 40 cartas, cuatro palos y figuras dibujadas en SVG.
// El mus no distingue palos, así que a cada carta se le da un palo según su posición en la mesa (así se ven variados).
// Los colores salen de variables CSS (--es-*), que cambian con las barajas españolas de la tienda.
//
//   esCartaMus('Rey')                 -> true para As, 2 a 7, Sota, Caballo y Rey
//   cartaEspanola('Rey', n)           -> elemento <div class="carta-es"> con la carta dibujada
const PALOS_ES = ['oros', 'copas', 'espadas', 'bastos'];
const NUM_ES = { As: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7, Sota: 10, Caballo: 11, Rey: 12 };
const esCartaMus = (t) => Object.prototype.hasOwnProperty.call(NUM_ES, String(t));

// Dibujo de cada palo, centrado en (0,0) y de unos 26 de alto. `k` = clase de color (p0 oros ... p3 bastos)
const PALO_SVG = {
  oros: () => `<circle r="11" class="f0 s0"/><circle r="7.4" class="n s0d"/><circle r="3.4" class="f0h s0d"/><path d="M-8 -5 A10 10 0 0 1 -1 -10" class="n brillo"/>`,
  copas: () => `<path d="M-10 -11 H10 C10 0 5 6 0 6 C-5 6 -10 0 -10 -11Z" class="f1 s1"/><path d="M-10 -8 H10" class="n s1d"/><rect x="-1.8" y="6" width="3.6" height="6" class="f1 s1"/><path d="M-7 14 Q0 9.5 7 14Z" class="f1 s1"/><path d="M-6.5 -9 C-6.5 -3 -4 1 -1.5 3" class="n brillo"/>`,
  espadas: () => `<path d="M0 -15 L3.6 6 H-3.6Z" class="f2 s2"/><path d="M0 -12 V5" class="n brillo"/><rect x="-9" y="5.5" width="18" height="3.6" rx="1.8" class="f2d s2"/><rect x="-1.7" y="9" width="3.4" height="6" class="f2d s2"/><circle cy="16.5" r="2.3" class="f2d s2"/>`,
  bastos: () => `<path d="M-3 15 L-4.6 -7 C-10 -9 -8 -16 -1.5 -14.5 C3 -17 9 -12 5.5 -7 L3.2 15Z" class="f3 s3"/><circle cx="-4" cy="-3" r="2.2" class="f3h s3d"/><circle cx="3.6" cy="3" r="2.2" class="f3h s3d"/><circle cx="-3" cy="9" r="1.9" class="f3h s3d"/><path d="M-4 -10 C-3 -13 0 -14 2 -13" class="n brillo"/>`,
};
const pipES = (palo, x, y, e = 1) => `<g transform="translate(${x} ${y}) scale(${e})">${PALO_SVG[palo]()}</g>`;

const PIPS_ES = {
  2: [[35, 32], [35, 78]],
  3: [[35, 28], [35, 54], [35, 80]],
  4: [[22, 33], [48, 33], [22, 77], [48, 77]],
  5: [[22, 33], [48, 33], [35, 55], [22, 77], [48, 77]],
  6: [[22, 30], [48, 30], [22, 55], [48, 55], [22, 80], [48, 80]],
  7: [[22, 30], [48, 30], [35, 42], [22, 55], [48, 55], [22, 80], [48, 80]],
};
const PIEL = '#f2c49b';

// Figuras: Sota (10), Caballo (11) y Rey (12). El manto lleva el color del palo.
function figuraES(rango, palo, p) {
  const manto = `class="f${p}"`;
  const marco = `<rect x="11" y="21" width="48" height="66" rx="4" class="fondo-fig"/><rect x="11" y="21" width="48" height="66" rx="4" class="n marco-fig"/>`;
  if (rango === 'Rey') {
    return `${marco}
<path d="M17 87 L21 62 Q35 52 49 62 L53 87Z" ${manto}/><path d="M22 62 Q35 70 48 62 L47 58 Q35 66 23 58Z" class="armino"/>
<g class="armino-p"><circle cx="27" cy="62" r="1"/><circle cx="35" cy="66" r="1"/><circle cx="43" cy="62" r="1"/></g>
<path d="M35 76 V87 M30 82 H40" class="n cetro"/>
<path d="M27 46 Q27 62 35 66 Q43 62 43 46Z" class="barba"/><circle cx="35" cy="45" r="9" fill="${PIEL}" class="cara"/>
<path d="M29 47 Q35 58 41 47 Q35 52 29 47Z" class="barba"/><circle cx="31.7" cy="43.5" r="1.1" class="tinta-f"/><circle cx="38.3" cy="43.5" r="1.1" class="tinta-f"/>
<path d="M25 37 L25 26 L30 32 L35 23 L40 32 L45 26 L45 37Z" class="corona"/><rect x="25" y="35" width="20" height="3.6" class="corona-b"/><circle cx="35" cy="28" r="1.4" class="gema"/>
<g transform="translate(35 78) scale(.5)">${PALO_SVG[palo]()}</g>`;
  }
  if (rango === 'Caballo') {
    return `${marco}
<path d="M17 87 L19 66 C19 52 27 44 34 38 L36 28 L41 32 L45 30 L45 40 C52 48 54 62 52 87Z" ${manto}/>
<path d="M45 30 L45 40 C47 44 49 47 50 51 L46 52 C44 47 42 44 39 42 L36 28 L41 32Z" class="crin"/>
<path d="M36 28 C34 36 28 40 24 48" class="n crin-l"/><circle cx="41" cy="38" r="1.6" class="tinta-f"/><path d="M45 40 L49 44" class="n tinta-l"/>
<path d="M24 87 L24 76 L30 76 L30 87Z" class="armino"/>
<circle cx="25" cy="50" r="6.2" fill="${PIEL}" class="cara"/><path d="M19 49 A6.5 6.5 0 0 1 31 49Z" class="yelmo"/><path d="M25 42 C22 36 26 32 30 34" class="n pluma"/><circle cx="23" cy="51" r=".9" class="tinta-f"/>
<g transform="translate(38 70) scale(.55)">${PALO_SVG[palo]()}</g>`;
  }
  // Sota
  return `${marco}
<path d="M19 87 L22 60 Q35 52 48 60 L51 87Z" ${manto}/><path d="M26 87 L28 72 M44 87 L42 72" class="n tinta-l"/>
<path d="M22 60 L48 60" class="n cinto"/><circle cx="35" cy="60" r="2.2" class="hebilla"/>
<circle cx="35" cy="44" r="9" fill="${PIEL}" class="cara"/><path d="M26 42 Q27 32 35 32 Q43 32 44 42 Q38 38 26 42Z" class="pelo"/>
<circle cx="31.7" cy="45" r="1.1" class="tinta-f"/><circle cx="38.3" cy="45" r="1.1" class="tinta-f"/><path d="M32 49.5 Q35 51.5 38 49.5" class="n tinta-l"/>
<path d="M27 34 Q35 24 44 33 L41 35 Q35 29 29 36Z" ${manto}/><path d="M44 33 C50 26 54 28 55 22 C51 25 48 25 43 29Z" class="pluma-f"/>
<g transform="translate(51 78) scale(.52)">${PALO_SVG[palo]()}</g>`;
}

function svgCartaES(rango, palo) {
  const num = NUM_ES[rango], p = PALOS_ES.indexOf(palo);
  let centro;
  if (num === 1) centro = `<rect x="9" y="19" width="52" height="70" rx="6" class="n marco-as"/>${pipES(palo, 35, 54, 1.9)}`;
  else if (num <= 7) centro = PIPS_ES[num].map(([x, y]) => pipES(palo, x, y, num >= 6 ? 0.72 : num >= 4 ? 0.82 : 0.9)).join('');
  else centro = figuraES(rango, palo, p);
  const etiqueta = String(num);
  return `<svg viewBox="0 0 70 108" class="es-svg" aria-hidden="true" focusable="false">
<rect x="1.5" y="1.5" width="67" height="105" rx="8" class="es-papel"/><rect x="1.5" y="1.5" width="67" height="105" rx="8" class="n es-borde"/>
<rect x="5" y="5" width="60" height="98" rx="5" class="n es-filete"/>
<text x="9" y="17" class="es-num">${etiqueta}</text>
<text x="61" y="97" text-anchor="end" class="es-num">${etiqueta}</text>
${centro}
</svg>`;
}

// Un palo distinto para cada carta consecutiva de la mesa (en el mus el palo no cuenta, pero la baraja los tiene)
function cartaEspanola(valor, n = 0, grande = false) {
  const texto = String(valor);
  const palo = PALOS_ES[(n + Math.abs([...texto].reduce((a, ch) => a + ch.charCodeAt(0), 0))) % 4];
  const nombre = texto === 'As' ? 'As' : /^\d$/.test(texto) ? texto : texto;
  const nodo = document.createElement('div');
  nodo.className = 'carta-es' + (grande ? ' grande' : '');
  nodo.style.setProperty('--c', String(n));
  nodo.setAttribute('role', 'img');
  nodo.setAttribute('aria-label', `${nombre} de ${palo}`);
  nodo.dataset.palo = palo;
  nodo.innerHTML = svgCartaES(texto, palo);
  return nodo;
}
