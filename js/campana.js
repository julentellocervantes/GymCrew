// CAMPAÑA «La ruta del casino» (datos en data/campana.js).
// Pantallas: mostrarCampana (lista de capítulos) -> mostrarCapitulo (mapa de niveles) -> escenas con el personaje,
// niveles (los mismos del curso), cofres, un jefe final y una medalla al terminar el capítulo.
// El progreso de los niveles es el de siempre (progreso.completadas); la campaña solo guarda qué escenas has visto
// (progreso.campana.vistos) y qué medallas has recogido (progreso.campana.fin).

// Icono propio del botón central: una montaña con una bandera
ICONOS.campana = S(`<ellipse cx="24" cy="43" rx="18" ry="3" fill="#0003"/><path d="M2 42 L19 14 L28 28 L34 20 L46 42Z" fill="url(#gVerde)" stroke="#1e6b1c" stroke-width="2.2" stroke-linejoin="round"/><path d="M14 22 L19 14 L24 22 L21 20 L19 23 L17 20Z" fill="#fff" stroke="#cfd7e6" stroke-width="1"/><path d="M19 14 V3" stroke="#6b4a1e" stroke-width="2.4" stroke-linecap="round"/><path class="i-bota" d="M19.5 3.5 L31 7 L19.5 11Z" fill="url(#gRojo)" stroke="#a02020" stroke-width="1.6" stroke-linejoin="round"/>${BR}`);
EMOJI_A_ICONO['🗺'] = 'campana';
NOMBRE_ICONO.campana = 'campaña';

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
  return Object.assign({}, base, { campana: cap.id, nombre: `Campaña · ${cap.titulo}`, color: cap.personaje.color });
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

// ---------- personajes (SVG) ----------
function avatarPersonaje(p, clase = '') {
  const sombra = 'rgba(0,0,0,.18)';
  const ropas = {
    chaleco: `<path d="M10 100 C12 76 28 68 50 68 C72 68 88 76 90 100Z" fill="#fdfdf8"/><path d="M10 100 C12 78 26 69 40 68 L50 92 L60 68 C74 69 88 78 90 100Z" fill="#1d5a3a"/><path d="M42 69 L50 88 L58 69Z" fill="#fdfdf8"/><path d="M43 68 l7 4 l7 -4 l-3 6 l-4 -2 l-4 2z" fill="#c0392b"/>`,
    americana: `<path d="M8 100 C10 76 28 68 50 68 C72 68 90 76 92 100Z" fill="#2b2b3a"/><path d="M38 68 L50 94 L62 68Z" fill="#f4f4f0"/><path d="M38 68 L47 100 L30 100Z M62 68 L53 100 L70 100Z" fill="#1d1d28"/>`,
    jersey: `<path d="M8 100 C10 76 28 68 50 68 C72 68 90 76 92 100Z" fill="#b03a2e"/><path d="M38 68 Q50 80 62 68" fill="none" stroke="#8a2b21" stroke-width="5" stroke-linecap="round"/><path d="M16 88 H84" stroke="#e8d9b0" stroke-width="3" stroke-dasharray="6 4" opacity=".8"/>`,
    vestido: `<path d="M8 100 C10 76 28 68 50 68 C72 68 90 76 92 100Z" fill="#6c2c91"/><path d="M34 69 Q50 88 66 69 Q50 76 34 69Z" fill="${p.piel}"/><g fill="#fff8e1"><circle cx="38" cy="73" r="1.8"/><circle cx="43" cy="77" r="1.8"/><circle cx="50" cy="79" r="1.8"/><circle cx="57" cy="77" r="1.8"/><circle cx="62" cy="73" r="1.8"/></g>`,
    mono: `<path d="M8 100 C10 76 28 68 50 68 C72 68 90 76 92 100Z" fill="#e8e8e0"/><path d="M30 100 V82 H70 V100Z M32 82 L36 68 H42 L40 82Z M68 82 L64 68 H58 L60 82Z" fill="#00828a"/><circle cx="38" cy="82" r="2.2" fill="#f3b63f"/><circle cx="62" cy="82" r="2.2" fill="#f3b63f"/>`,
    traje: `<path d="M8 100 C10 76 28 68 50 68 C72 68 90 76 92 100Z" fill="#f4f1e6"/><path d="M38 68 L50 92 L62 68Z" fill="#fff"/><path d="M38 68 L47 100 L28 100Z M62 68 L53 100 L72 100Z" fill="#e2dccb"/><path d="M42 68 l8 4 l8 -4 l0 8 l-8 -4 l-8 4z" fill="#1c1a24"/>`,
  };
  const detras = p.id === 'valeria' ? `<path d="M27 42 Q24 78 34 86 L66 86 Q76 78 73 42 Q50 12 27 42Z" fill="${p.pelo}"/>` : '';
  const cabello = {
    rufino: `<path d="M31 42 Q29 24 50 22 Q71 24 69 42 Q66 33 50 32 Q34 33 31 42Z" fill="${p.pelo}"/>`,
    valeria: `<path d="M30 42 Q28 22 50 21 Q72 22 70 42 Q60 28 44 30 Q36 32 30 42Z" fill="${p.pelo}"/>`,
    inaki: `<path d="M31 44 Q30 36 34 33 L36 44Z M69 44 Q70 36 66 33 L64 44Z" fill="${p.pelo}"/>`,
    sofia: `<path d="M30 44 Q27 21 50 20 Q73 21 70 44 Q64 30 52 29 Q40 28 30 44Z" fill="${p.pelo}"/><circle cx="50" cy="17" r="7" fill="${p.pelo}"/>`,
    turbo: `<path d="M31 40 Q31 24 50 24 Q69 24 69 40Z" fill="${p.pelo}"/>`,
    ramiro: `<path d="M31 42 Q30 25 50 24 Q70 25 69 42 Q64 34 50 34 Q36 34 31 42Z" fill="${p.pelo}"/>`,
  }[p.id] || '';
  const rasgos = {
    bigote: `<path d="M38 55 Q44 51 50 54.5 Q56 51 62 55 Q56 60 50 56.5 Q44 60 38 55Z" fill="${p.pelo}"/>`,
    gafas: `<rect x="34" y="40" width="14" height="10" rx="4" fill="#1b2a3a" fill-opacity=".85" stroke="#111" stroke-width="2"/><rect x="52" y="40" width="14" height="10" rx="4" fill="#1b2a3a" fill-opacity=".85" stroke="#111" stroke-width="2"/><path d="M48 44 H52" stroke="#111" stroke-width="2"/><path d="M36 42 l5 0" stroke="#fff" stroke-opacity=".5" stroke-width="1.6" stroke-linecap="round"/>`,
    txapela: `<ellipse cx="50" cy="29" rx="26" ry="10" fill="#1f2a5c"/><path d="M26 30 Q50 38 74 30" fill="none" stroke="#161d42" stroke-width="2.5"/><circle cx="50" cy="19" r="2.6" fill="#161d42"/>`,
    pendientes: `<circle cx="31" cy="54" r="3" fill="#f3b63f" stroke="#a86a00" stroke-width="1"/><circle cx="69" cy="54" r="3" fill="#f3b63f" stroke="#a86a00" stroke-width="1"/>`,
    gorra: `<path d="M30 38 Q30 18 50 18 Q70 18 70 38Z" fill="#e67e22"/><path d="M28 38 Q54 33 78 40 L76 45 Q52 40 28 43Z" fill="#c4691a"/><circle cx="50" cy="19" r="2" fill="#c4691a"/>`,
    monoculo: `<circle cx="58" cy="45" r="7" fill="#cfe9ff" fill-opacity=".35" stroke="#f3b63f" stroke-width="2"/><path d="M63 50 Q70 58 66 72" fill="none" stroke="#f3b63f" stroke-width="1.5"/><path d="M38 55 Q44 52 50 55 Q56 52 62 55 Q56 59 50 57 Q44 59 38 55Z" fill="${p.pelo}"/>`,
  };
  const svg = `<svg viewBox="0 0 100 100" class="pj-svg" aria-hidden="true" focusable="false"><defs><radialGradient id="pg-${p.id}" cx=".5" cy=".3" r=".85"><stop offset="0" stop-color="#fff" stop-opacity=".35"/><stop offset="1" stop-color="#000" stop-opacity=".25"/></radialGradient><clipPath id="pc-${p.id}"><circle cx="50" cy="50" r="48"/></clipPath></defs>
<circle cx="50" cy="50" r="48" fill="${p.color}"/><circle cx="50" cy="50" r="48" fill="url(#pg-${p.id})"/>
<g clip-path="url(#pc-${p.id})">${detras}${ropas[p.ropa] || ''}
<rect x="44" y="56" width="12" height="16" fill="${p.piel}"/><rect x="44" y="62" width="12" height="6" fill="${sombra}"/>
<circle cx="31" cy="47" r="4.5" fill="${p.piel}"/><circle cx="69" cy="47" r="4.5" fill="${p.piel}"/>
<ellipse cx="50" cy="44" rx="19" ry="21" fill="${p.piel}"/>
${cabello}
<circle cx="42" cy="45" r="2.4" fill="#1b1b1b"/><circle cx="58" cy="45" r="2.4" fill="#1b1b1b"/><circle cx="42.8" cy="44.2" r=".8" fill="#fff"/><circle cx="58.8" cy="44.2" r=".8" fill="#fff"/>
<path d="M38 39 Q42 37 46 39 M54 39 Q58 37 62 39" fill="none" stroke="${p.pelo}" stroke-width="1.8" stroke-linecap="round"/>
<path d="M50 46 Q53 52 49 53" fill="none" stroke="${sombra}" stroke-width="1.6" stroke-linecap="round"/>
<path d="M43 57 Q50 63 57 57" fill="none" stroke="#7a2e2e" stroke-width="2" stroke-linecap="round"/>
<ellipse cx="38" cy="53" rx="3" ry="2" fill="#ff8a8a" fill-opacity=".3"/><ellipse cx="62" cy="53" rx="3" ry="2" fill="#ff8a8a" fill-opacity=".3"/>
${rasgos[p.rasgo] || ''}</g><circle cx="50" cy="50" r="47" fill="none" stroke="#f3b63f" stroke-width="2.5"/></svg>`;
  const nodo = document.createElement('span');
  nodo.className = ('personaje ' + clase).trim();
  nodo.setAttribute('role', 'img');
  nodo.setAttribute('aria-label', `${p.nombre}, ${p.rol}`);
  nodo.innerHTML = svg;
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
      { class: 'contenido centro escena', style: `--acento:${p.color}` },
      el('p', { class: 'esc-lugar' }, cap.lugar),
      avatar,
      el('div', { class: 'esc-placa' }, el('strong', {}, p.nombre), el('span', {}, p.rol)),
      el('div', { class: 'esc-globo' }, texto),
      puntos
    ),
    el('div', { class: 'pie' }, boton)
  );
  pintarLinea();
}

// ---------- el mapa del capítulo ----------
function mostrarCapitulo(id, entrada = 'adelante', recientes = []) {
  alTeclear = null;
  const cap = CAMPANA.find((c) => c.id === id);
  const idx = CAMPANA.indexOf(cap);
  if (!cap || !capDesbloqueado(idx)) return mostrarCampana('atras');
  const est = campEstado();
  // la primera vez, el personaje se presenta
  if (!est.vistos[cap.id]) {
    est.vistos[cap.id] = true;
    guardarProgreso();
    return mostrarEscena(cap, cap.presentacion, () => mostrarCapitulo(cap.id, 'adelante'), { boton: '¡A la mesa!' });
  }
  // al terminar el jefe, escena final y medalla
  if (jefeHecho(cap) && !est.fin[cap.id]) return mostrarEscena(cap, cap.final, () => mostrarMedalla(cap), { boton: 'Recoger medalla' });

  const p = cap.personaje;
  const curso = cursoCampana(cap);
  const nodos = nodosDe(cap);
  const hechoNivel = (l) => !!progreso.completadas[l.id];
  const desbloqueado = (n) => {
    if (n.tipo === 'nivel') return n.k === 0 || hechoNivel(nivelesDe(cap)[n.k - 1]);
    return !!progreso.completadas[n.req];
  };
  const siguiente = nodos.find((n) => (n.tipo === 'nivel' || n.tipo === 'jefe') && !hechoNivel(n.leccion));

  const avatar = avatarPersonaje(p, 'mediano');
  const burbuja = el('p', { class: 'camp-burbuja-txt', 'aria-live': 'polite' }, siguiente ? siguiente.frase : cap.final[0]);
  const cabecera = el(
    'div',
    { class: 'camp-banner' },
    el('button', { class: 'camp-presenta', type: 'button', 'aria-label': `Ver la presentación de ${p.nombre}`, onclick: () => mostrarEscena(cap, cap.presentacion, () => mostrarCapitulo(cap.id, 'atras'), { boton: 'Volver al mapa' }) }, avatar),
    el('div', { class: 'camp-banner-txt' }, el('h1', {}, cap.titulo), el('p', { class: 'camp-lugar' }, cap.lugar), barraProgreso(capHechos(cap), capTotal(cap))),
  );
  const globo = el('div', { class: 'camp-burbuja' }, el('strong', {}, p.nombre), burbuja);

  const sacudir = (b) => { b.classList.remove('sacudir'); void b.offsetWidth; b.classList.add('sacudir'); setTimeout(() => b.classList.remove('sacudir'), 500); };
  let hoja = null;
  const cerrarHoja = () => { if (hoja) { hoja.remove(); hoja = null; } };
  const abrirHoja = (n) => {
    cerrarHoja();
    const esJefe = n.tipo === 'jefe';
    hoja = el(
      'div',
      { class: 'camp-hoja', role: 'dialog', 'aria-label': n.leccion.titulo },
      avatarPersonaje(p, 'mini'),
      el('div', { class: 'camp-hoja-txt' }, el('strong', {}, n.leccion.titulo), el('span', {}, `«${n.frase}»`), el('small', {}, `${n.leccion.ejercicios.length} ejercicios · ${n.leccion.xp} XP${esJefe ? ' · +10 fichas' : ''}`)),
      el('div', { class: 'camp-hoja-acc' },
        el('button', { class: 'boton oro', type: 'button', 'data-accion': 'jugar', onclick: () => { cerrarHoja(); mostrarIntro(curso, n.leccion); } }, esJefe ? '¡A por el jefe!' : 'Jugar'),
        el('button', { class: 'boton secundario', type: 'button', onclick: cerrarHoja }, 'Ahora no'))
    );
    document.querySelector('main.contenido').append(hoja);
    hoja.querySelector('button').focus({ preventScroll: true });
  };

  let numero = 0;
  const crearNodo = (n, i) => {
    const desp = DESPLAZAMIENTOS[i % DESPLAZAMIENTOS.length];
    const estilo = `transform:translateX(${desp}px);--i:${numero++}`;
    if (n.tipo === 'cofre') {
      const abierto = !!progreso.cofres[n.id];
      const listo = !abierto && desbloqueado(n);
      const b = el('button', {
        class: 'nodo cofre' + (n.grande ? ' grande' : '') + (abierto ? ' abierto' : listo ? ' listo' : ' bloqueado'), type: 'button',
        'aria-label': (n.grande ? 'Gran cofre' : 'Cofre') + (abierto ? ' abierto' : listo ? ' listo para abrir' : ' bloqueado'),
        onclick: () => {
          if (listo) return mostrarCofre(curso, n.id, () => mostrarCapitulo(cap.id, 'atras'));
          burbuja.textContent = abierto ? 'Ese cofre ya lo has abierto.' : 'Ese cofre se abre al terminar lo que hay justo antes.';
          sacudir(b);
        },
      }, abierto ? '📭' : listo ? '🎁' : '🔒');
      return el('div', { class: 'nodo-envoltorio cofre-envoltorio', style: estilo }, listo ? el('span', { class: 'empezar' }, '¡ABRIR!') : null, el('div', { class: 'nodo-fila' }, b), el('span', { class: 'nodo-titulo' }, n.titulo));
    }
    const l = n.leccion;
    const hecha = hechoNivel(l);
    const esActual = n === siguiente;
    const libre = hecha || desbloqueado(n);
    const bloqueado = !hecha && !libre;
    const b = el('button', {
      class: 'nodo' + (n.tipo === 'jefe' ? ' jefe' : '') + (hecha ? ' hecho' : '') + (esActual && !bloqueado ? ' actual' : '') + (bloqueado ? ' bloqueado' : ''), type: 'button', 'data-nodo': n.tipo === 'jefe' ? 'jefe' : String(n.k + 1),
      'aria-label': l.titulo + (bloqueado ? ' (bloqueado)' : hecha ? ' (completado)' : ''),
      onclick: () => {
        if (bloqueado) { burbuja.textContent = n.tipo === 'jefe' ? 'Primero tienes que terminar todos los niveles del capítulo.' : 'Termina primero el nivel anterior y se abre este.'; return sacudir(b); }
        burbuja.textContent = n.frase;
        abrirHoja(n);
      },
    }, hecha ? '✓' : bloqueado ? '🔒' : n.tipo === 'jefe' ? '⚔️' : l.icono);
    return el('div', { class: 'nodo-envoltorio' + (recientes.includes(l.id) ? ' recien' : ''), style: estilo }, esActual && !bloqueado ? el('span', { class: 'empezar' }, n.tipo === 'jefe' ? 'JEFE' : 'EMPEZAR') : null, el('div', { class: 'nodo-fila' }, b), el('span', { class: 'nodo-titulo' }, n.tipo === 'jefe' ? 'Jefe del capítulo' : l.titulo));
  };

  pintar(
    entrada,
    el('header', { class: 'cabecera' }, el('button', { class: 'volver', type: 'button', 'aria-label': 'Volver a la campaña', onclick: () => mostrarCampana('atras') }, '←'), marcador()),
    el('main', { class: 'contenido mapa camp-mapa', style: `--acento:${p.color}` }, cabecera, globo, el('section', { class: 'unidad' }, el('div', { class: 'camino' }, nodos.map(crearNodo))))
  );
  alTeclear = (e) => { if (e.key === 'Escape') cerrarHoja(); };
  if (siguiente) {
    setTimeout(() => {
      const el0 = document.querySelector('.nodo.actual');
      if (el0 && el0.isConnected && capHechos(cap) > 0) el0.scrollIntoView({ block: 'center', behavior: sinMovimiento() ? 'auto' : 'smooth' });
    }, 350);
  }
}

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
      el('p', { class: 'esc-lugar' }, ultima ? '¡Has completado la campaña!' : `Capítulo ${idx + 1} completado`),
      el('div', { class: 'medalla-grande', 'aria-hidden': 'true' }, el('span', { class: 'medalla-rayos' }), icono('medalla')),
      el('h1', {}, cap.medalla),
      avatarPersonaje(cap.personaje, 'mini'),
      fichas ? el('p', { class: 'resultado-dato' }, `+${fichas} fichas`) : null,
      el('p', { class: 'resultado-nuevo' }, ultima ? 'Eres el Campeón del Tapete. Todo lo que has aprendido, a tu servicio.' : `Nuevo capítulo: «${sig.titulo}» con ${sig.personaje.nombre}.`)
    ),
    el('div', { class: 'pie' }, el('button', { class: 'boton', type: 'button', onclick: () => mostrarCampana('atras') }, 'Continuar')),
    confeti(ultima ? 110 : 60)
  );
  sonido('nivel');
  sonido('logro', 500);
  if (fichas) sonido('monedas', 1000);
  if (ultima) sonido('perfecto', 700);
}

// ---------- la campaña: lista de capítulos ----------
function mostrarCampana(entrada = 'fundido') {
  alTeclear = null;
  const est = campEstado();
  const hechos = campHechos();
  const total = campTotal();
  const actual = CAMPANA.findIndex((c, i) => capDesbloqueado(i) && !capCompleto(c));
  const completa = CAMPANA.every(capCompleto);
  const { fila, parrafo } = naiFila(completa ? 'celebrando' : 'feliz', completa
    ? '¡Eres el Campeón del Tapete! Has completado toda la ruta del casino.'
    : hechos === 0 ? 'Una ruta por seis mesas del casino. En cada una te espera un personaje que te enseña el juego. ¡Elige la primera!' : `Sigue con «${CAMPANA[Math.max(actual, 0)].titulo}». Llevas ${hechos} de ${total} pasos de la ruta.`);

  const tarjeta = (cap, i) => {
    const libre = capDesbloqueado(i);
    const hecho = capCompleto(cap);
    const h = capHechos(cap);
    const b = el('button', {
      class: 'camp-cap' + (hecho ? ' completo' : '') + (libre ? '' : ' bloqueado') + (i === actual ? ' actual' : ''), type: 'button', 'data-cap': cap.id, style: `--acento:${cap.personaje.color};--i:${i}`,
      'aria-label': `Capítulo ${i + 1}: ${cap.titulo}. ${hecho ? 'Completado' : libre ? `${h} de ${capTotal(cap)}` : 'Bloqueado'}`,
      onclick: () => {
        if (libre) return mostrarCapitulo(cap.id);
        parrafo.textContent = `Termina el jefe de «${CAMPANA[i - 1].titulo}» para entrar aquí.`;
        b.classList.remove('sacudir'); void b.offsetWidth; b.classList.add('sacudir');
      },
    },
    el('span', { class: 'camp-num', 'aria-hidden': 'true' }, String(i + 1)),
    avatarPersonaje(cap.personaje, 'mediano' + (libre ? '' : ' oculto')),
    el('span', { class: 'juego-texto' }, el('strong', {}, cap.titulo), el('span', { class: 'juego-desc' }, libre ? `${cap.personaje.nombre} · ${cap.personaje.rol}` : 'Bloqueado'), libre ? barraProgreso(h, capTotal(cap)) : null),
    el('span', { class: 'camp-estado', 'aria-hidden': 'true' }, hecho ? icono('medalla') : libre ? el('span', { class: 'flecha' }, '›') : icono('candado')));
    return b;
  };

  const galeria = el('ul', { class: 'camp-galeria' }, CAMPANA.map((cap, i) => {
    const vista = !!est.vistos[cap.id];
    return el('li', { style: `--i:${i}` }, vista
      ? el('button', { type: 'button', class: 'camp-gal', 'aria-label': `${cap.personaje.nombre}, ${cap.personaje.rol}`, onclick: () => mostrarEscena(cap, cap.presentacion, () => mostrarCampana('atras'), { boton: 'Volver' }) }, avatarPersonaje(cap.personaje, 'mini'), el('span', {}, cap.personaje.nombre))
      : el('div', { class: 'camp-gal oculto', 'aria-label': 'Personaje sin conocer' }, el('span', { class: 'personaje mini sombra' }, '?'), el('span', {}, '???')));
  }));

  pintar(
    entrada,
    el('header', { class: 'cabecera' }, logoMarca(), marcador()),
    el('main', { class: 'contenido camp-hub' },
      el('div', { class: 'camp-hero' },
        el('p', { class: 'camp-hero-sup' }, 'Campaña'),
        el('h1', {}, 'La ruta del casino'),
        barraProgreso(hechos, total),
        el('p', { class: 'camp-medallas' }, `${medallas()} de ${CAMPANA.length} medallas`)),
      fila,
      el('ol', { class: 'camp-caps' }, CAMPANA.map((c, i) => el('li', {}, tarjeta(c, i)))),
      el('h2', { class: 'camp-sub' }, 'Personajes'),
      galeria
    )
  );
}
