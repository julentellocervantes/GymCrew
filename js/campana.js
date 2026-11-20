// CAMPAÑA «La ruta del casino» (datos en data/campana.js).
// Pantallas: mostrarCampana (la torre: un solo mapa continuo que se sube piso a piso) y escenas con el personaje de cada piso.
// Cada piso son niveles (los mismos del curso), cofres, un jefe final y una medalla.
// El progreso de los niveles es el de siempre (progreso.completadas); la campaña solo guarda qué escenas has visto
// (progreso.campana.vistos) y qué medallas has recogido (progreso.campana.fin).

// Icono propio del botón central: una montaña con una bandera
ICONOS.campana = S(`<ellipse cx="24" cy="44" rx="17" ry="3" fill="#0003"/><path d="M13 43 V17 H35 V43Z" fill="url(#gRojo)" stroke="#8a1c1c" stroke-width="2.2" stroke-linejoin="round"/><path d="M10 17 V10 H15 V13 H19 V10 H23 V13 H25 V10 H29 V13 H33 V10 H38 V17Z" fill="#f3b63f" stroke="#a86a00" stroke-width="2" stroke-linejoin="round"/><path d="M24 10 V2" stroke="#6b4a1e" stroke-width="2.2" stroke-linecap="round"/><path class="i-bota" d="M24.5 2.5 L35 5.5 L24.5 9Z" fill="#fff" stroke="#cfd7e6" stroke-width="1.4" stroke-linejoin="round"/><rect x="21" y="32" width="6" height="11" rx="3" fill="#3a1010"/><rect x="18.5" y="21" width="4" height="6" rx="2" fill="#ffe58a"/><rect x="25.5" y="21" width="4" height="6" rx="2" fill="#ffe58a"/>${BR}`);
EMOJI_A_ICONO['🗺'] = 'campana';
NOMBRE_ICONO.campana = 'la torre';

// ---------- estado ----------
const campEstado = () => progreso.campana || (progreso.campana = { fin: {}, vistos: {} });
const cursoDe = (cap) => CURSOS.find((c) => c.id === cap.curso);
const nivelesDe = (cap) => niveles(cursoDe(cap)).slice(0, cap.niveles);
const idJefe = (cap) => `camp-jefe-${cap.id}`;
const jefeHecho = (cap) => !!progreso.completadas[idJefe(cap)];
const capDesbloqueado = (i) => i === 0 || jefeHecho(CAMPANA[i - 1]);
const capHechos = (cap) => nivelesDe(cap).filter((l) => progreso.completadas[l.id]).length + (jefeHecho(cap) ? 1 : 0);
const capTotal = (cap) => cap.niveles + 1;
const capCompleto = (cap) => jefeHecho(cap);
const campHechos = () => CAMPANA.reduce((n, c) => n + capHechos(c), 0);
const campTotal = () => CAMPANA.reduce((n, c) => n + capTotal(c), 0);
const medallas = () => CAMPANA.filter((c) => campEstado().fin[c.id]).length;

// El curso «envuelto»: es el mismo curso pero marca que se juega desde la campaña (para volver al mapa de la campaña)
function cursoCampana(cap) {
  const base = cursoDe(cap);
  return Object.assign({}, base, { campana: cap.id, nombre: `La Torre · ${cap.titulo}`, color: cap.personaje.color });
}

// El jefe mezcla preguntas de todos los niveles del capítulo (se construye una vez por sesión)
function construirJefe(cap) {
  if (cap._jefe) return cap._jefe;
  const pool = nivelesDe(cap).flatMap((l) => {
    const e = l.ejercicios;
    return e.length > 1 ? [e[0], e[e.length - 1]] : e;
  });
  cap._jefe = {
    id: idJefe(cap),
    titulo: `Jefe: ${cap.titulo}`,
    icono: '⚔️',
    xp: 40,
    fichasExtra: 10,
    campanaJefe: true,
    intro: cap.jefe,
    get ejercicios() {
      if (!this._ej) this._ej = barajar(pool).slice(0, 10);
      return this._ej;
    },
  };
  return cap._jefe;
}

// Los nodos del capítulo, en orden: niveles, cofres tras algunos, el jefe y su cofre
function nodosDe(cap) {
  const lista = nivelesDe(cap);
  const nodos = [];
  lista.forEach((l, k) => {
    nodos.push({ tipo: 'nivel', leccion: l, frase: cap.frases[k], k });
    if (cap.cofres.includes(k + 1)) nodos.push({ tipo: 'cofre', id: `camp-${cap.id}-cofre-${k + 1}`, req: l.id, titulo: 'Cofre' });
  });
  nodos.push({ tipo: 'jefe', leccion: construirJefe(cap), frase: cap.jefe, req: lista[lista.length - 1].id });
  nodos.push({ tipo: 'cofre', id: `camp-${cap.id}-cofre-jefe`, req: idJefe(cap), titulo: 'Gran cofre', grande: true });
  return nodos;
}

// ---------- personajes: objetos del casino con cara (SVG) ----------
const CARA = (x, y, sep = 9, r = 2.6) => `<circle cx="${x - sep}" cy="${y}" r="${r}" fill="#1b1b1b"/><circle cx="${x + sep}" cy="${y}" r="${r}" fill="#1b1b1b"/><circle cx="${x - sep + .9}" cy="${y - .9}" r=".9" fill="#fff"/><circle cx="${x + sep + .9}" cy="${y - .9}" r=".9" fill="#fff"/>`;
const PERSONAJES_SVG = {
  // Fichón: una ficha roja con bigote
  ficha: () => `<ellipse cx="50" cy="88" rx="30" ry="5" fill="#0003"/>
<circle cx="50" cy="50" r="38" fill="#d93a2a" stroke="#8f1c0c" stroke-width="3"/>
<circle cx="50" cy="50" r="33" fill="none" stroke="#fff" stroke-width="7" stroke-dasharray="9.2 9.2" opacity=".95"/>
<circle cx="50" cy="50" r="25" fill="#f8ead0" stroke="#8f1c0c" stroke-width="2.5"/>
${CARA(50, 45)}
<path d="M33 55 Q41 49 50 54 Q59 49 67 55 Q59 62 50 58 Q41 62 33 55Z" fill="#8c8f94"/>
<path d="M43 63 Q50 68 57 63" fill="none" stroke="#7a2e2e" stroke-width="2" stroke-linecap="round"/>
<ellipse cx="36" cy="52" rx="3" ry="2" fill="#ff8a8a" fill-opacity=".4"/><ellipse cx="64" cy="52" rx="3" ry="2" fill="#ff8a8a" fill-opacity=".4"/>
<path d="M30 30 A28 28 0 0 1 46 22" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="3" stroke-linecap="round"/>`,
  // Valeria: la dama de corazones
  dama: () => `<g transform="rotate(-5 50 52)"><rect x="26" y="14" width="48" height="72" rx="6" fill="#fffdf5" stroke="#8c1d1d" stroke-width="3"/>
<text x="31" y="29" font-family="Georgia,serif" font-weight="700" font-size="14" fill="#c0392b">Q</text><text x="31" y="41" font-size="11" fill="#c0392b">♥</text>
<text x="69" y="80" text-anchor="end" font-family="Georgia,serif" font-weight="700" font-size="14" fill="#c0392b" transform="rotate(180 63 74)">Q</text>
<path d="M33 52 Q30 78 42 82 L58 82 Q70 78 67 52 Q50 22 33 52Z" fill="#3a2418"/>
<path d="M36 80 Q50 92 64 80 L64 86 L36 86Z" fill="#c0392b"/>
<ellipse cx="50" cy="55" rx="13" ry="15" fill="#f0c4a0"/>
<path d="M37 49 Q50 30 63 49 Q54 41 43 44Z" fill="#3a2418"/>
${CARA(50, 54, 5.6, 2)}
<path d="M44 61 Q50 66 56 61" fill="#d64545" stroke="#a82424" stroke-width="1.4" stroke-linecap="round"/>
<ellipse cx="41" cy="59" rx="2.4" ry="1.6" fill="#ff8a8a" fill-opacity=".45"/><ellipse cx="59" cy="59" rx="2.4" ry="1.6" fill="#ff8a8a" fill-opacity=".45"/>
<path d="M34 38 L38 24 L44 33 L50 20 L56 33 L62 24 L66 38Z" fill="#f3b63f" stroke="#a86a00" stroke-width="1.6" stroke-linejoin="round"/>
<circle cx="50" cy="22" r="2.4" fill="#d64545"/><circle cx="38" cy="26" r="1.8" fill="#d64545"/><circle cx="62" cy="26" r="1.8" fill="#d64545"/></g>`,
  // Iñaki: el rey de oros de la baraja española, con txapela
  rey: () => `<g transform="rotate(4 50 52)"><rect x="25" y="13" width="50" height="74" rx="6" fill="#f6e3a8" stroke="#7a4a12" stroke-width="3"/>
<circle cx="35" cy="26" r="7" fill="#f3b63f" stroke="#a86a00" stroke-width="1.8"/><circle cx="35" cy="26" r="3.6" fill="none" stroke="#a86a00" stroke-width="1.2"/>
<circle cx="65" cy="76" r="7" fill="#f3b63f" stroke="#a86a00" stroke-width="1.8"/><circle cx="65" cy="76" r="3.6" fill="none" stroke="#a86a00" stroke-width="1.2"/>
<path d="M34 82 Q50 68 66 82 L66 86 L34 86Z" fill="#b03a2e"/>
<ellipse cx="50" cy="52" rx="14" ry="16" fill="#e8b78a"/>
<ellipse cx="50" cy="31" rx="19" ry="7" fill="#1f2a5c"/><circle cx="50" cy="23" r="2.4" fill="#161d42"/>
<path d="M33 33 Q50 41 67 33" fill="none" stroke="#161d42" stroke-width="2"/>
${CARA(50, 50, 6, 2.2)}
<path d="M38 58 Q44 54 50 58 Q56 54 62 58 Q56 64 50 61 Q44 64 38 58Z" fill="#ececec"/>
<path d="M45 66 Q50 69 55 66" fill="none" stroke="#7a2e2e" stroke-width="1.6" stroke-linecap="round"/>
<ellipse cx="40" cy="55" rx="2.6" ry="1.7" fill="#ff8a8a" fill-opacity=".4"/><ellipse cx="60" cy="55" rx="2.6" ry="1.7" fill="#ff8a8a" fill-opacity=".4"/></g>`,
  // Lady Sofía: una copa de champán
  copa: () => `<ellipse cx="50" cy="90" rx="22" ry="4" fill="#0003"/>
<ellipse cx="50" cy="86" rx="20" ry="4.5" fill="#e9eef8" stroke="#aab4c8" stroke-width="1.5"/>
<rect x="47" y="58" width="6" height="28" fill="#e9eef8" stroke="#aab4c8" stroke-width="1.5"/>
<path d="M30 14 H70 Q72 40 58 56 Q50 62 42 56 Q28 40 30 14Z" fill="#ffe08a" fill-opacity=".92" stroke="#cdd6e6" stroke-width="2.5"/>
<path d="M31 14 H69 L68.4 21 H31.6Z" fill="#fff" fill-opacity=".7"/>
<g fill="#fff" fill-opacity=".8"><circle cx="40" cy="40" r="1.8"/><circle cx="60" cy="34" r="1.5"/><circle cx="56" cy="46" r="1.2"/><circle cx="44" cy="30" r="1.2"/><circle cx="62" cy="24" r="1.2"/><circle cx="38" cy="26" r="1"/></g>
<path d="M38 33 Q41.5 31 45 33 M55 33 Q58.5 31 62 33" fill="none" stroke="#1b1b1b" stroke-width="1.2" stroke-linecap="round"/>
${CARA(50, 36, 8.5, 2.5)}
<path d="M44 44 Q50 49 56 44" fill="#d64545" stroke="#a82424" stroke-width="1.4" stroke-linecap="round"/>
<ellipse cx="38" cy="41" rx="3" ry="2" fill="#ff8a8a" fill-opacity=".5"/><ellipse cx="62" cy="41" rx="3" ry="2" fill="#ff8a8a" fill-opacity=".5"/>
<path d="M30 14 L34 5 L40 11 L46 3 L52 11 L58 3 L62 11 L66 5 L70 14Z" fill="#f3b63f" stroke="#a86a00" stroke-width="1.5" stroke-linejoin="round" opacity="0"/>`,
  // Turbo: una tragaperras con la pantalla de cara
  maquina: () => `<ellipse cx="46" cy="90" rx="30" ry="4.5" fill="#0003"/>
<path d="M66 40 H80 Q86 40 86 46 V54" fill="none" stroke="#9aa3ad" stroke-width="4" stroke-linecap="round"/><circle cx="86" cy="52" r="5.5" fill="#e0402a" stroke="#8f1c0c" stroke-width="1.5"/>
<rect x="20" y="16" width="52" height="72" rx="8" fill="#c43a2a" stroke="#6d140a" stroke-width="3"/>
<path d="M20 28 Q20 16 32 16 H60 Q72 16 72 28Z" fill="#f3b63f" stroke="#a86a00" stroke-width="2"/>
<text x="46" y="27" text-anchor="middle" font-family="Georgia,serif" font-weight="900" font-size="10" fill="#7a1d0a">777</text>
<rect x="26" y="34" width="40" height="28" rx="5" fill="#0c1a26" stroke="#f3b63f" stroke-width="2.4"/>
<circle cx="37" cy="46" r="5.2" fill="#7dffb2"/><circle cx="55" cy="46" r="5.2" fill="#7dffb2"/><circle cx="38.4" cy="46.6" r="2.4" fill="#0c1a26"/><circle cx="56.4" cy="46.6" r="2.4" fill="#0c1a26"/>
<path d="M36 54 Q46 60 56 54" fill="none" stroke="#7dffb2" stroke-width="2.4" stroke-linecap="round"/>
<circle cx="31" cy="71" r="3" fill="#f3b63f"/><circle cx="41" cy="71" r="3" fill="#7dffb2"/><circle cx="51" cy="71" r="3" fill="#f3b63f"/><circle cx="61" cy="71" r="3" fill="#7dffb2"/>
<rect x="32" y="78" width="28" height="7" rx="2" fill="#2a1a14"/>`,
  // Don Ramiro: la ruleta, con monóculo y bigote
  ruleta: () => `<ellipse cx="50" cy="90" rx="32" ry="4.5" fill="#0003"/>
<circle cx="50" cy="50" r="40" fill="#5a3315" stroke="#2f1a08" stroke-width="3"/>
<circle cx="50" cy="50" r="33" fill="none" stroke="#c0392b" stroke-width="12" stroke-dasharray="5.6 5.6"/>
<circle cx="50" cy="50" r="33" fill="none" stroke="#1b1b1b" stroke-width="12" stroke-dasharray="5.6 5.6" stroke-dashoffset="5.6"/>
<circle cx="50" cy="50" r="39" fill="none" stroke="#f3b63f" stroke-width="2"/>
<circle cx="50" cy="50" r="24" fill="#f3b63f" stroke="#a86a00" stroke-width="2.5"/>
<circle cx="50" cy="50" r="19" fill="#f2d2ac"/>
${CARA(50, 46, 7, 2.2)}
<circle cx="57" cy="46" r="6.5" fill="#cfe9ff" fill-opacity=".35" stroke="#a86a00" stroke-width="1.8"/><path d="M62 51 Q68 58 64 68" fill="none" stroke="#a86a00" stroke-width="1.3"/>
<path d="M40 56 Q45 52 50 56 Q55 52 60 56 Q55 61 50 58.5 Q45 61 40 56Z" fill="#f2f2f2" stroke="#c9c9c9" stroke-width=".6"/>
<path d="M45 63 Q50 66 55 63" fill="none" stroke="#7a2e2e" stroke-width="1.6" stroke-linecap="round"/>
<circle cx="50" cy="12" r="3.4" fill="#fff" stroke="#bbb" stroke-width=".8"/>`,
};

function avatarPersonaje(p, clase = '') {
  const dibujo = (PERSONAJES_SVG[p.tipo] || PERSONAJES_SVG.ficha)();
  const nodo = document.createElement('span');
  nodo.className = ('personaje ' + clase).trim();
  nodo.setAttribute('role', 'img');
  nodo.setAttribute('aria-label', `${p.nombre}, ${p.rol}`);
  nodo.innerHTML = `<svg viewBox="0 0 100 100" class="pj-svg" aria-hidden="true" focusable="false">${dibujo}</svg>`;
  return nodo;
}

// Un texto que va apareciendo palabra a palabra (el texto completo está siempre en el documento)
const palabrasAnimadas = (texto) => texto.split(' ').map((w, i) => el('span', { class: 'esc-pal', style: `--w:${i}` }, w + ' '));

// ---------- escena: el personaje habla ----------
function mostrarEscena(cap, lineas, alFinal, opciones = {}) {
  const p = cap.personaje;
  let i = 0;
  const avatar = avatarPersonaje(p, 'grande');
  const texto = el('p', { class: 'esc-texto', 'aria-live': 'polite' });
  const puntos = el('div', { class: 'esc-puntos', 'aria-hidden': 'true' }, lineas.map(() => el('span', {})));
  const boton = el('button', { class: 'boton', type: 'button', onclick: () => siguiente() }, '');
  const pintarLinea = () => {
    texto.replaceChildren(...palabrasAnimadas(lineas[i]));
    Array.from(puntos.children).forEach((s, k) => s.classList.toggle('on', k <= i));
    boton.textContent = i === lineas.length - 1 ? opciones.boton || '¡Vamos!' : 'Siguiente';
    avatar.classList.remove('habla');
    void avatar.offsetWidth;
    avatar.classList.add('habla');
    if (i > 0) sonido('toque');
  };
  const siguiente = () => {
    if (i < lineas.length - 1) { i++; pintarLinea(); } else alFinal();
  };
  alTeclear = (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); siguiente(); }
  };
  pintar(
    'adelante',
    el('header', { class: 'cabecera-leccion' }, el('button', { class: 'cerrar', type: 'button', 'aria-label': 'Saltar la escena', onclick: () => alFinal() }, '✕')),
    el(
      'main',
      { class: 'contenido centro escena ' + ZONAS[cap.id].clase, style: `--acento:${p.color}` },
      el('div', { class: 'esc-cartel' }, el('span', { class: 'esc-cartel-num' }, String(CAMPANA.indexOf(cap) + 1)), el('span', { class: 'esc-cartel-txt' }, el('small', {}, 'Piso'), el('strong', {}, cap.titulo))),
      avatar,
      el('div', { class: 'esc-placa' }, el('strong', {}, p.nombre), el('span', {}, p.rol)),
      el('div', { class: 'esc-globo' }, texto),
      puntos
    ),
    el('div', { class: 'pie' }, boton)
  );
  pintarLinea();
}

// Volver «al mapa» desde un nivel o un cofre: la torre, enfocando el piso indicado
const mostrarCapitulo = (id, entrada = 'atras', recientes = []) => mostrarCampana(entrada, recientes, id);

const barraProgreso = (a, b) =>
  el('div', { class: 'camp-barra', role: 'progressbar', 'aria-valuemin': '0', 'aria-valuemax': String(b), 'aria-valuenow': String(a), 'aria-label': `${a} de ${b}` }, el('span', { style: `width:${Math.round((a / b) * 100)}%` }), el('em', {}, `${a}/${b}`));

// ---------- medalla al terminar un capítulo ----------
function mostrarMedalla(cap) {
  const est = campEstado();
  const primera = !est.fin[cap.id];
  const idx = CAMPANA.indexOf(cap);
  const ultima = idx === CAMPANA.length - 1;
  const fichas = primera ? (ultima ? 40 : 15) * multVip() : 0;
  if (primera) {
    est.fin[cap.id] = true;
    progreso.fichas += fichas;
    guardarProgreso();
  }
  const sig = CAMPANA[idx + 1];
  alTeclear = (e) => { if (e.key === 'Enter') { e.preventDefault(); mostrarCampana('atras'); } };
  pintar(
    'adelante',
    el(
      'main',
      { class: 'contenido centro medalla-pantalla', style: `--acento:${cap.personaje.color}` },
      el('p', { class: 'esc-lugar' }, ultima ? '¡Has llegado a la cima!' : `Piso ${idx + 1} superado`),
      el('div', { class: 'medalla-grande', 'aria-hidden': 'true' }, el('span', { class: 'medalla-rayos' }), icono('medalla')),
      el('h1', {}, cap.medalla),
      avatarPersonaje(cap.personaje, 'mini'),
      fichas ? el('p', { class: 'resultado-dato' }, `+${fichas} fichas`) : null,
      primera ? el('p', { class: 'rango-nuevo' }, `Nuevo rango: ${rangoTorre().nombre}`) : null,
      el('p', { class: 'resultado-nuevo' }, ultima ? 'Eres el Campeón del Tapete. Todo lo que has aprendido, a tu servicio.' : `Ya puedes subir al piso ${idx + 2}: «${sig.titulo}» con ${sig.personaje.nombre}.`)
    ),
    el('div', { class: 'pie' }, el('button', { class: 'boton', type: 'button', onclick: () => mostrarCampana('atras') }, 'Continuar')),
    confeti(ultima ? 110 : 60)
  );
  sonido('nivel');
  sonido('logro', 500);
  if (fichas) sonido('monedas', 1000);
  if (ultima) sonido('perfecto', 700);
}

// ---------- rangos de la Torre: suben con cada medalla ----------
const RANGOS_TORRE = [
  { n: 0, nombre: 'Aprendiz de tapete', lema: 'Todo gran crupier empezó sin saber barajar.' },
  { n: 1, nombre: 'Repartidor', lema: 'Ya sabes por dónde se coge la baraja.' },
  { n: 2, nombre: 'Crupier', lema: 'La mesa empieza a respetarte.' },
  { n: 3, nombre: 'Jefe de sala', lema: 'Los novatos te piden consejo.' },
  { n: 4, nombre: 'Pit boss', lema: 'Nada se te escapa en el casino.' },
  { n: 5, nombre: 'Director del casino', lema: 'Solo queda un piso entre tú y la gloria.' },
  { n: 6, nombre: 'Campeón del Tapete', lema: 'Has subido toda la Torre. Leyenda.' },
];
const rangoTorre = () => RANGOS_TORRE[Math.min(medallas(), RANGOS_TORRE.length - 1)];
const cofresTorre = () => Object.keys(progreso.cofres || {}).filter((k) => k.startsWith('camp-') && progreso.cofres[k]).length;

// Mi carrera: rango, vitrina de medallas y cifras de la Torre
function mostrarCarrera(volver) {
  alTeclear = (e) => { if (e.key === 'Escape') volver(); };
  const m = medallas();
  const r = rangoTorre();
  const sig = RANGOS_TORRE[m + 1];
  const total = CAMPANA.length;
  const vitrina = el('ul', { class: 'vitrina' }, CAMPANA.map((c, i) => {
    const tengo = !!campEstado().fin[c.id];
    return el('li', { class: 'vitrina-hueco' + (tengo ? ' tengo' : ''), style: `--acento:${c.personaje.color}`, 'aria-label': `${c.medalla}${tengo ? '' : ' (por conseguir)'}` },
      el('span', { class: 'vitrina-medalla' }, tengo ? icono('medalla') : el('span', { class: 'vitrina-candado' }, '🔒')),
      avatarPersonaje(c.personaje, 'mini' + (tengo ? '' : ' oculto')),
      el('strong', {}, tengo ? c.medalla : `Piso ${i + 1}`),
      el('small', {}, tengo ? c.personaje.nombre : 'Por conseguir'));
  }));
  const dato = (valor, texto) => el('li', {}, el('strong', {}, valor), el('span', {}, texto));
  pintar(
    'adelante',
    el('header', { class: 'cabecera' }, el('button', { class: 'volver', type: 'button', 'aria-label': 'Volver a la Torre', onclick: volver }, '←'), marcador()),
    el('main', { class: 'contenido carrera' },
      el('section', { class: 'carrera-hero' + (m === total ? ' campeon' : '') },
        el('span', { class: 'carrera-rango-pre' }, 'Tu rango en la Torre'),
        el('h1', {}, r.nombre),
        el('p', {}, r.lema),
        sig ? el('p', { class: 'carrera-sig' }, `Siguiente: ${sig.nombre}, con tu próxima medalla.`) : el('p', { class: 'carrera-sig' }, 'Has conseguido el rango máximo.'),
        barraProgreso(m, total)),
      el('h2', {}, 'Vitrina de medallas'),
      vitrina,
      el('h2', {}, 'Tu ascenso'),
      el('ul', { class: 'carrera-datos' },
        dato(`${campHechos()}/${campTotal()}`, 'pasos hechos'),
        dato(`${CAMPANA.filter(jefeHecho).length}/${total}`, 'jefes vencidos'),
        dato(String(cofresTorre()), 'cofres abiertos'),
        dato(String(m), m === 1 ? 'medalla' : 'medallas')),
      m === total ? el('div', { class: 'diploma' }, el('strong', {}, 'Diploma de la Torre'), el('span', {}, 'Has vencido a los seis jefes del casino. Campeón del Tapete.')) : null),
    el('div', { class: 'pie' }, el('button', { class: 'boton', type: 'button', onclick: volver }, 'Volver a la Torre'))
  );
}

// ---------- zonas: cada piso es un ambiente distinto del casino ----------
const SV = (v, cuerpo) => `<svg viewBox="${v || '0 0 60 60'}" aria-hidden="true" focusable="false">${cuerpo}</svg>`;
const DECOR = {
  pila: (a, b, c) => SV('', [c, b, a].map((col, i) => `<ellipse cx="30" cy="${46 - i * 10}" rx="20" ry="7.5" fill="${col}" stroke="#0004" stroke-width="1.5"/><path d="M12 ${46 - i * 10} v-4 a20 7.5 0 0 1 36 0 v4" fill="${col}"/><ellipse cx="30" cy="${42 - i * 10}" rx="20" ry="7.5" fill="${col}" stroke="#0004" stroke-width="1.5"/><ellipse cx="30" cy="${42 - i * 10}" rx="13" ry="4.5" fill="none" stroke="#fff" stroke-width="2" stroke-dasharray="4 3" opacity=".85"/>`).join('')),
  dado: () => SV('', `<g transform="rotate(14 30 30)"><rect x="9" y="9" width="42" height="42" rx="9" fill="#fffdf5" stroke="#8a8a80" stroke-width="2.5"/><g fill="#1b1b1b"><circle cx="21" cy="21" r="4"/><circle cx="39" cy="21" r="4"/><circle cx="30" cy="30" r="4"/><circle cx="21" cy="39" r="4"/><circle cx="39" cy="39" r="4"/></g></g>`),
  abanico: () => SV('', `<g transform="rotate(-24 30 54)"><rect x="14" y="8" width="30" height="44" rx="4" fill="#fffdf5" stroke="#555" stroke-width="2"/><text x="19" y="22" font-size="13" font-weight="700" fill="#c0392b">K</text><text x="19" y="35" font-size="11" fill="#c0392b">♥</text></g><g transform="rotate(0 30 54)"><rect x="15" y="6" width="30" height="44" rx="4" fill="#fffdf5" stroke="#555" stroke-width="2"/><text x="20" y="20" font-size="13" font-weight="700" fill="#1b1b1b">A</text><text x="20" y="33" font-size="11" fill="#1b1b1b">♠</text></g><g transform="rotate(24 30 54)"><rect x="16" y="8" width="30" height="44" rx="4" fill="#fffdf5" stroke="#555" stroke-width="2"/><text x="21" y="22" font-size="13" font-weight="700" fill="#c0392b">Q</text><text x="21" y="35" font-size="11" fill="#c0392b">♦</text></g>`),
  foco: () => SV('0 0 60 90', `<path d="M24 0 h12 l-3 10 h-6z" fill="#333"/><path d="M26 10 h8 l22 80 h-52z" fill="#fff3c4" fill-opacity=".18"/><ellipse cx="30" cy="12" rx="8" ry="4" fill="#fff3c4"/>`),
  barril: () => SV('', `<path d="M14 8 Q4 30 14 52 H46 Q56 30 46 8Z" fill="#8a5a2b" stroke="#3b2210" stroke-width="2.5"/><path d="M11 18 H49 M8 30 H52 M11 42 H49" stroke="#3b2210" stroke-width="3.5" opacity=".75"/><path d="M22 8 Q16 30 22 52 M38 8 Q44 30 38 52" fill="none" stroke="#3b2210" stroke-width="1.4" opacity=".6"/>`),
  oros: () => SV('', `<circle cx="30" cy="30" r="24" fill="#f3b63f" stroke="#a86a00" stroke-width="3"/><circle cx="30" cy="30" r="16" fill="none" stroke="#a86a00" stroke-width="2"/><text x="30" y="37" text-anchor="middle" font-size="20" font-weight="700" font-family="Georgia,serif" fill="#a86a00">1</text>`),
  copas: () => SV('', `<path d="M14 8 H46 Q48 30 34 36 V46 H42 V52 H18 V46 H26 V36 Q12 30 14 8Z" fill="#c0392b" stroke="#6d140a" stroke-width="2.5" stroke-linejoin="round"/><path d="M18 14 H42" stroke="#fff" stroke-opacity=".5" stroke-width="3" stroke-linecap="round"/>`),
  lampara: () => SV('0 0 60 70', `<path d="M30 0 V20" stroke="#222" stroke-width="2"/><path d="M12 42 Q14 22 30 20 Q46 22 48 42Z" fill="#2c3e2c" stroke="#111" stroke-width="2"/><ellipse cx="30" cy="42" rx="18" ry="4" fill="#ffd57a"/><path d="M14 46 L2 70 H58 L46 46Z" fill="#ffd57a" fill-opacity=".22"/>`),
  arana: () => SV('0 0 80 80', `<path d="M40 0 V14" stroke="#c9a14a" stroke-width="2.5"/><path d="M8 44 Q14 24 40 18 Q66 24 72 44" fill="none" stroke="#f3b63f" stroke-width="3.5" stroke-linecap="round"/><path d="M40 18 V54" stroke="#f3b63f" stroke-width="3"/><g fill="#fff8d6"><path d="M8 44 v6 l-3 6 6 0z"/><path d="M26 34 v8 l-3 8 6 0z"/><path d="M40 54 v6 l-4 8 8 0z"/><path d="M54 34 v8 l-3 8 6 0z"/><path d="M72 44 v6 l-3 6 6 0z"/></g><g fill="#ffe08a"><circle cx="8" cy="40" r="3"/><circle cx="26" cy="29" r="3"/><circle cx="40" cy="14" r="3"/><circle cx="54" cy="29" r="3"/><circle cx="72" cy="40" r="3"/></g>`),
  flauta: () => SV('0 0 40 70', `<path d="M10 2 H30 Q31 24 24 32 Q20 36 20 40 V58 H28 V64 H12 V58 H20 V40 Q20 36 16 32 Q9 24 10 2Z" fill="#ffe08a" fill-opacity=".9" stroke="#e6ecf8" stroke-width="2.2" stroke-linejoin="round"/><g fill="#fff"><circle cx="17" cy="20" r="1.6"/><circle cx="23" cy="13" r="1.3"/><circle cx="21" cy="26" r="1.1"/></g>`),
  neonEstrella: () => SV('', `<path d="M30 6 L36 23 L54 24 L40 35 L45 53 L30 43 L15 53 L20 35 L6 24 L24 23Z" fill="none" stroke="#ff4fd8" stroke-width="3.5" stroke-linejoin="round"/>`),
  neonRayo: () => SV('', `<path d="M34 4 L14 34 H28 L22 56 L46 24 H31Z" fill="none" stroke="#3df5ff" stroke-width="3.5" stroke-linejoin="round"/>`),
  neon777: () => SV('0 0 80 44', `<rect x="3" y="3" width="74" height="38" rx="9" fill="none" stroke="#ff4fd8" stroke-width="3"/><text x="40" y="33" text-anchor="middle" font-size="27" font-weight="900" font-family="Georgia,serif" fill="none" stroke="#ffe14d" stroke-width="2.4">777</text>`),
  moneda: () => SV('', `<circle cx="30" cy="30" r="22" fill="#ffd54a" stroke="#a86a00" stroke-width="3"/><circle cx="30" cy="30" r="15" fill="none" stroke="#a86a00" stroke-width="2" stroke-dasharray="3 3"/><path d="M30 20 V40 M25 24 Q30 19 35 24 Q35 29 30 30 Q25 31 25 36 Q30 41 35 36" fill="none" stroke="#a86a00" stroke-width="2.4" stroke-linecap="round"/>`),
  bola: () => SV('', `<circle cx="30" cy="30" r="9" fill="#fff" stroke="#bbb" stroke-width="2"/><circle cx="27" cy="27" r="3" fill="#fff" opacity=".9"/>`),
};

// Cada zona: ambiente (clase de CSS), adornos a los lados (x en %, y en % de la altura del piso, lado) y la escalera que lleva a ella
const ZONAS = {
  c1: { clase: 'zona-tapete', puerta: 'Entrada del casino', adornos: [['pila', ['#d93a2a', '#2c5fa8', '#1f7a4d'], 'izq', 12, 18], ['dado', [], 'der', 6, 38], ['pila', ['#f3b63f', '#d93a2a', '#222'], 'der', 10, 62], ['dado', [], 'izq', 4, 84]] },
  c2: { clase: 'zona-terciopelo', puerta: 'Cortinas de la sala roja', adornos: [['foco', [], 'izq', 14, 6], ['abanico', [], 'der', 8, 30], ['foco', [], 'der', 18, 52], ['abanico', [], 'izq', 6, 74]] },
  c3: { clase: 'zona-sociedad', puerta: 'Puerta de la sociedad', adornos: [['lampara', [], 'izq', 14, 4], ['barril', [], 'der', 8, 34], ['oros', [], 'izq', 6, 58], ['copas', [], 'der', 10, 80], ['lampara', [], 'der', 20, 8]] },
  c4: { clase: 'zona-salon', puerta: 'Salón privado', adornos: [['arana', [], 'izq', 22, 2], ['flauta', [], 'der', 10, 34], ['arana', [], 'der', 26, 50], ['flauta', [], 'izq', 8, 78]] },
  c5: { clase: 'zona-neon', puerta: 'Pasillo de neones', adornos: [['neonEstrella', [], 'izq', 10, 10], ['neon777', [], 'der', 6, 34], ['neonRayo', [], 'izq', 8, 60], ['neonEstrella', [], 'der', 8, 82]] },
  c6: { clase: 'zona-rueda', puerta: 'Gran salón', adornos: [['moneda', [], 'izq', 10, 14], ['bola', [], 'der', 20, 34], ['moneda', [], 'der', 8, 58], ['moneda', [], 'izq', 6, 84]] },
};

function adornosDe(cap) {
  const z = ZONAS[cap.id];
  const caja = el('div', { class: 'adornos', 'aria-hidden': 'true' });
  z.adornos.forEach(([tipo, args, lado, x, y], k) => {
    const a = document.createElement('span');
    a.className = 'adorno adorno-' + tipo;
    a.style.cssText = `${lado === 'izq' ? 'left' : 'right'}:${x}px;top:${y}%;--k:${k}`;
    a.innerHTML = DECOR[tipo](...args);
    caja.append(a);
  });
  return caja;
}

// La escalera que une dos zonas: se nota que cambias de ambiente
function umbralDe(cap, i, libre) {
  const z = ZONAS[cap.id];
  return el(
    'div',
    { class: 'umbral' + (libre ? '' : ' cerrado'), 'aria-hidden': 'true' },
    el('span', { class: 'umbral-escalera' }),
    el('span', { class: 'umbral-texto' }, libre ? (i === 0 ? z.puerta : `Subes al piso ${i + 1}`) : `Puerta cerrada · piso ${i + 1}`),
    el('span', { class: 'umbral-flechas' }, '▲ ▲ ▲')
  );
}

// ---------- un aviso corto arriba (reemplaza al globo del personaje) ----------
function avisarCampana(texto) {
  document.querySelectorAll('.camp-aviso').forEach((n) => n.remove());
  const a = el('div', { class: 'camp-aviso', role: 'status' }, texto);
  document.body.append(a);
  setTimeout(() => a.remove(), 2800);
}

// El rótulo de arriba cambia al nombre de la zona que tienes en pantalla mientras subes o bajas
let quitarSeguirZona = null;
function seguirZona(info) {
  if (quitarSeguirZona) quitarSeguirZona();
  const rotulo = info.querySelector('.torre-zona');
  let esperando = false, ultima = null;
  const mirar = () => {
    esperando = false;
    if (!rotulo.isConnected) return quitarSeguirZona && quitarSeguirZona();
    const mitad = window.innerHeight * 0.45;
    let zona = null;
    for (const pz of document.querySelectorAll('.torre .piso')) { const r = pz.getBoundingClientRect(); if (r.top <= mitad && r.bottom >= mitad) { zona = pz; break; } }
    const cima = document.querySelector('.torre .cima');
    const nombre = zona ? zona.dataset.nombre : cima && cima.getBoundingClientRect().top <= mitad ? 'La cima' : null;
    if (!nombre || nombre === ultima) return;
    ultima = nombre;
    rotulo.textContent = nombre;
    info.style.setProperty('--zona', zona ? getComputedStyle(zona).getPropertyValue('--acento') : '#f3b63f');
    rotulo.classList.remove('cambia'); void rotulo.offsetWidth; rotulo.classList.add('cambia');
  };
  const alScroll = () => { if (!esperando) { esperando = true; requestAnimationFrame(mirar); } };
  window.addEventListener('scroll', alScroll, { passive: true });
  quitarSeguirZona = () => { window.removeEventListener('scroll', alScroll); quitarSeguirZona = null; };
  mirar();
}

// ---------- la torre: un único mapa que se sube de abajo (piso 1) a la cima ----------
function mostrarCampana(entrada = 'fundido', recientes = [], enfocar = null) {
  alTeclear = null;
  document.querySelectorAll('.camp-aviso').forEach((n) => n.remove());
  const est = campEstado();

  // 1) un jefe vencido: escena final del piso y medalla
  const pendiente = CAMPANA.find((c) => jefeHecho(c) && !est.fin[c.id]);
  if (pendiente) return mostrarEscena(pendiente, pendiente.final, () => mostrarMedalla(pendiente), { boton: 'Recoger medalla' });

  // 2) piso nuevo: el personaje se presenta la primera vez
  const idxActual = CAMPANA.findIndex((c, i) => capDesbloqueado(i) && !capCompleto(c));
  const completa = idxActual < 0;
  const capActual = CAMPANA[completa ? CAMPANA.length - 1 : idxActual];
  if (!completa && !est.vistos[capActual.id] && !(typeof tourActivo !== 'undefined' && tourActivo)) {
    est.vistos[capActual.id] = true;
    guardarProgreso();
    return mostrarEscena(capActual, capActual.presentacion, () => mostrarCampana('adelante', [], capActual.id), { boton: '¡A subir!' });
  }

  let hoja = null;
  const cerrarHoja = () => { if (hoja) { hoja.remove(); hoja = null; } };
  const abrirHoja = (cap, curso, n) => {
    cerrarHoja();
    const esJefe = n.tipo === 'jefe';
    hoja = el(
      'div',
      { class: 'camp-hoja', role: 'dialog', 'aria-label': n.leccion.titulo, style: `--acento:${cap.personaje.color}` },
      avatarPersonaje(cap.personaje, 'mini'),
      el('div', { class: 'camp-hoja-txt' }, el('strong', {}, n.leccion.titulo), el('span', {}, `${cap.personaje.nombre}: «${n.frase}»`), el('small', {}, `${n.leccion.ejercicios.length} ejercicios · ${n.leccion.xp} XP${esJefe ? ' · +10 fichas' : ''}`)),
      el('div', { class: 'camp-hoja-acc' },
        el('button', { class: 'boton oro', type: 'button', 'data-accion': 'jugar', onclick: () => { cerrarHoja(); mostrarIntro(curso, n.leccion); } }, esJefe ? '¡A por el jefe!' : 'Jugar'),
        el('button', { class: 'boton secundario', type: 'button', onclick: cerrarHoja }, 'Ahora no'))
    );
    document.querySelector('main.contenido').append(hoja);
    hoja.querySelector('button').focus({ preventScroll: true });
  };
  const sacudir = (b) => { b.classList.remove('sacudir'); void b.offsetWidth; b.classList.add('sacudir'); setTimeout(() => b.classList.remove('sacudir'), 500); };

  let numero = 0;
  const crearPiso = (cap, i) => {
    const p = cap.personaje;
    const libre = capDesbloqueado(i);
    const hecho = capCompleto(cap);
    const curso = cursoCampana(cap);
    const lista = nivelesDe(cap);
    const hechoNivel = (l) => !!progreso.completadas[l.id];
    const nodos = nodosDe(cap);
    const siguiente = libre ? nodos.find((n) => (n.tipo === 'nivel' || n.tipo === 'jefe') && !hechoNivel(n.leccion)) : null;
    const desbloqueado = (n) => {
      if (!libre) return false;
      if (n.tipo === 'nivel') return n.k === 0 || hechoNivel(lista[n.k - 1]);
      return !!progreso.completadas[n.req];
    };
    const crearNodo = (n, j) => {
      const desp = DESPLAZAMIENTOS[numero % DESPLAZAMIENTOS.length];
      const estilo = `transform:translateX(${desp}px);--i:${numero++}`;
      if (n.tipo === 'cofre') {
        const abierto = !!progreso.cofres[n.id];
        const listo = !abierto && desbloqueado(n);
        const b = el('button', {
          class: 'nodo cofre' + (n.grande ? ' grande' : '') + (abierto ? ' abierto' : listo ? ' listo' : ' bloqueado'), type: 'button',
          'aria-label': (n.grande ? 'Gran cofre' : 'Cofre') + (abierto ? ' abierto' : listo ? ' listo para abrir' : ' bloqueado'),
          onclick: () => {
            if (listo) return mostrarCofre(curso, n.id, () => mostrarCampana('atras', [], cap.id));
            avisarCampana(abierto ? 'Ese cofre ya lo has abierto.' : 'Ese cofre se abre al terminar lo que hay justo antes.');
            sacudir(b);
          },
        }, abierto ? '📭' : listo ? '🎁' : '🔒');
        return el('div', { class: 'nodo-envoltorio cofre-envoltorio', style: estilo }, listo ? el('span', { class: 'empezar' }, '¡ABRIR!') : null, el('div', { class: 'nodo-fila' }, b), el('span', { class: 'nodo-titulo' }, n.titulo));
      }
      const l = n.leccion;
      const hecha = hechoNivel(l);
      const esActual = n === siguiente;
      const bloqueado = !hecha && !desbloqueado(n);
      const b = el('button', {
        class: 'nodo' + (n.tipo === 'jefe' ? ' jefe' : '') + (hecha ? ' hecho' : '') + (esActual && !bloqueado ? ' actual' : '') + (bloqueado ? ' bloqueado' : ''), type: 'button', 'data-nodo': n.tipo === 'jefe' ? 'jefe' : String(n.k + 1),
        'aria-label': l.titulo + (bloqueado ? ' (bloqueado)' : hecha ? ' (completado)' : ''),
        onclick: () => {
          if (bloqueado) {
            avisarCampana(!libre ? `Primero tienes que vencer al jefe del piso ${i}.` : n.tipo === 'jefe' ? 'Primero tienes que terminar todos los niveles del piso.' : 'Termina primero el nivel anterior y se abre este.');
            return sacudir(b);
          }
          abrirHoja(cap, curso, n);
        },
      }, hecha ? '✓' : bloqueado ? '🔒' : n.tipo === 'jefe' ? '⚔️' : l.icono);
      const aqui = esActual && !bloqueado;
      return el('div', { class: 'nodo-envoltorio' + (recientes.includes(l.id) ? ' recien' : '') + (aqui ? ' con-nai' : ''), style: estilo }, aqui ? el('div', { class: 'nai-compana ' + (desp > 0 ? 'izq' : 'der') }, mascota('feliz')) : null, esActual && !bloqueado ? el('span', { class: 'empezar' }, n.tipo === 'jefe' ? 'JEFE' : 'EMPEZAR') : null, el('div', { class: 'nodo-fila' }, b), el('span', { class: 'nodo-titulo' }, n.tipo === 'jefe' ? 'Jefe del piso' : l.titulo));
    };

    const h = capHechos(cap);
    const frase = !libre ? `Vence al jefe del piso ${i} para subir hasta aquí.` : siguiente ? siguiente.frase : cap.final[0];
    const banner = el(
      'div',
      { class: 'piso-entrada' },
      el('span', { class: 'piso-numero', 'aria-hidden': 'true' }, String(i + 1)),
      el('button', { class: 'camp-presenta', type: 'button', 'aria-label': `Ver la presentación de ${p.nombre}`, disabled: !libre || null, onclick: () => mostrarEscena(cap, cap.presentacion, () => mostrarCampana('atras', [], cap.id), { boton: 'Volver a la torre' }) }, avatarPersonaje(p, 'mediano' + (libre ? '' : ' oculto'))),
      el('div', { class: 'piso-texto' },
        el('span', { class: 'piso-cinta' }, cap.lugar),
        el('h2', {}, cap.titulo),
        el('p', { class: 'piso-quien' }, libre ? `${p.nombre} · ${p.rol}` : 'Piso cerrado'),
        libre ? barraProgreso(h, capTotal(cap)) : null,
        el('p', { class: 'piso-frase' }, frase))
    );
    return el(
      'section',
      { class: 'piso ' + ZONAS[cap.id].clase + (libre ? '' : ' bloqueado') + (hecho ? ' completo' : '') + (i === idxActual ? ' actual' : ''), 'data-piso': cap.id, 'data-nombre': `Piso ${i + 1} · ${cap.titulo}`, style: `--acento:${p.color}`, 'aria-label': `${cap.lugar}: ${cap.titulo}` },
      umbralDe(cap, i, libre),
      banner,
      el('div', { class: 'camino' }, nodos.map(crearNodo)),
      adornosDe(cap)
    );
  };

  const pisos = CAMPANA.map(crearPiso);
  const cima = el(
    'div',
    { class: 'cima' + (completa ? ' lograda' : ''), 'data-cima': completa ? 'si' : 'no' },
    el('div', { class: 'cima-trofeo', 'aria-hidden': 'true' }, icono('trofeo')),
    el('strong', {}, 'La cima'),
    el('span', {}, completa ? '¡Campeón del Tapete!' : 'Vence a los seis jefes para llegar'),
    completa ? el('button', { class: 'boton oro', type: 'button', onclick: () => mostrarCarrera(() => mostrarCampana('atras')) }, 'Ver mi diploma') : null
  );

  const hechos = campHechos();
  const total = campTotal();
  const irAMiPosicion = () => {
    const destino = document.querySelector('.nodo.actual') || document.querySelector('.cima');
    if (destino) destino.scrollIntoView({ block: 'center', behavior: sinMovimiento() ? 'auto' : 'smooth' });
  };
  const info = el(
    'div',
    { class: 'torre-info' },
    el('button', { class: 'torre-datos', type: 'button', 'aria-label': 'Ver mi carrera', onclick: () => mostrarCarrera(() => mostrarCampana('atras')) }, el('strong', { class: 'torre-zona' }, completa ? 'En la cima' : `Piso ${idxActual + 1} · ${CAMPANA[idxActual].titulo}`), el('span', {}, `${rangoTorre().nombre} · ${hechos}/${total} pasos`)),
    el('button', { class: 'torre-pos', type: 'button', onclick: irAMiPosicion }, 'Mi posición')
  );

  pintar(
    entrada,
    el('header', { class: 'cabecera' }, logoMarca(), marcador()),
    el('main', { class: 'contenido torre-pantalla' }, info, el('div', { class: 'torre' }, el('div', { class: 'torre-cielo', 'aria-hidden': 'true' }), pisos, cima))
  );
  alTeclear = (e) => { if (e.key === 'Escape') cerrarHoja(); };
  seguirZona(info);
  // botón flotante «Continuar»: aparece cuando tu nivel queda fuera de la pantalla
  const actual = document.querySelector('.nodo.actual');
  if (actual) {
    const titulo = actual.closest('.nodo-envoltorio').querySelector('.nodo-titulo');
    const cta = el('button', { class: 'camp-continuar', type: 'button', onclick: () => { irAMiPosicion(); setTimeout(() => actual.click(), sinMovimiento() ? 0 : 450); } },
      el('span', { class: 'camp-continuar-ico', 'aria-hidden': 'true' }, '▶'),
      el('span', {}, el('small', {}, 'Continuar'), el('strong', {}, titulo ? titulo.textContent : 'Mi nivel')));
    document.querySelector('main.contenido').append(cta);
    if ('IntersectionObserver' in window) {
      const vigia = new IntersectionObserver(([en]) => cta.classList.toggle('visible', !en.isIntersecting), { threshold: 0.6 });
      vigia.observe(actual);
    } else cta.classList.add('visible');
  }
  // empiezas abajo y subes: la pantalla se coloca en tu posición actual
  setTimeout(() => {
    const dest = (enfocar && document.querySelector(`.piso[data-piso="${enfocar}"] .nodo.actual`)) || document.querySelector('.nodo.actual') || (completa ? document.querySelector('.cima') : null);
    if (dest && dest.isConnected) dest.scrollIntoView({ block: 'center', behavior: sinMovimiento() || entrada === 'fundido' ? 'auto' : 'smooth' });
  }, 120);
}
