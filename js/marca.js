// MARCA: Tapete. Todo lo que define la identidad (nombre, logo, hero de inicio) vive aquí.
// Esencia: el tapete verde donde se aprende a jugar. Paño, tiza, ficha roja y latón.
const MARCA = { nombre: 'Tapete', descriptor: 'Entrenador de cartas', lema: 'Aprende en el tapete. Juega sin miedo.' };

// Logo: ficha roja con borde de puntos sobre el paño
const LOGO_FICHA = '<svg viewBox="0 0 32 32" width="30" height="30" aria-hidden="true" focusable="false"><circle cx="16" cy="16" r="15" fill="#0c3a44" stroke="#f3b63f" stroke-width="1.6"/><circle cx="16" cy="16" r="11.5" fill="#f0472b"/><circle cx="16" cy="16" r="10.4" fill="none" stroke="#fff6df" stroke-width="2.6" stroke-dasharray="3.6 3.6"/><circle cx="16" cy="16" r="7" fill="#d93a20" stroke="#fff6df" stroke-width="1"/><text x="16" y="20.4" text-anchor="middle" font-size="11.5" fill="#fff6df" font-family="Georgia,serif" font-weight="700">♠</text></svg>';

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
