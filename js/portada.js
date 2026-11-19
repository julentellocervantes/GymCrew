// PORTADA: pantalla de bienvenida que aparece al abrir la app. Hay que tocarla para entrar al menú.
// Se salta cuando vuelves de un enlace/pago, con ?sinportada, y en navegadores automatizados (las pruebas); ?portada la fuerza.
function mostrarPortada(alEntrar) {
  const fuerza = location.search.includes('portada') && !location.search.includes('sinportada');
  const saltar = !fuerza && (location.search.includes('sinportada') || navigator.webdriver);
  if (saltar) { alEntrar(); return; }

  const CARTAS = [['A', '♠'], ['K', '♥'], ['Q', '♣'], ['J', '♦'], ['10', '♠']];
  const cartas = CARTAS.map(([r, p], i) =>
    el('span', { class: 'por-carta' + (p === '♥' || p === '♦' ? ' roja' : ''), style: `--i:${i};--a:${(i - 2) * 13}deg` },
      el('b', {}, r), el('i', {}, p), el('em', {}, p))
  );
  const palabras = Array.from('Tapete').map((c, k) => el('span', { class: 'por-letra', style: `--k:${k}` }, c));
  let hecho = false;
  const portada = el(
    'div',
    { id: 'portada', class: 'portada', role: 'button', tabindex: '0', 'aria-label': 'Tapete, entrenador de cartas. Toca la pantalla para entrar.' },
    el('div', { class: 'por-luz', 'aria-hidden': 'true' }),
    el('div', { class: 'por-palos', 'aria-hidden': 'true' }, ['♠', '♥', '♣', '♦', '♠', '♥'].map((p, i) => el('span', { class: i % 2 ? 'r' : '', style: `--i:${i}` }, p))),
    el('div', { class: 'por-centro' },
      el('div', { class: 'por-abanico', 'aria-hidden': 'true' }, cartas),
      el('h1', { class: 'por-titulo', 'aria-hidden': 'true' }, palabras),
      el('p', { class: 'por-sub' }, 'Entrenador de cartas'),
    ),
    el('p', { class: 'por-toca' }, el('span', { class: 'por-anillo', 'aria-hidden': 'true' }), 'Toca para entrar'),
    el('p', { class: 'por-nota' }, 'Solo mayores de 18 años · Sin dinero real')
  );

  const entrar = (e) => {
    if (hecho) return;
    if (e && e.type === 'keydown' && e.key !== 'Enter' && e.key !== ' ') return;
    if (e && e.preventDefault) e.preventDefault();
    hecho = true;
    sonido('reparto');
    // el menú se pinta debajo y la portada se disuelve encima, así se ve su entrada
    alEntrar();
    portada.classList.add('saliendo');
    portada.setAttribute('aria-hidden', 'true');
    portada.style.pointerEvents = 'none';
    const quitar = () => portada.remove();
    portada.addEventListener('transitionend', (ev) => { if (ev.target === portada && ev.propertyName === 'opacity') quitar(); });
    setTimeout(quitar, 1500); // por si no hay transición (menos movimiento)
  };
  portada.addEventListener('click', entrar);
  portada.addEventListener('keydown', entrar);
  document.body.append(portada);
  portada.focus({ preventScroll: true });
}
