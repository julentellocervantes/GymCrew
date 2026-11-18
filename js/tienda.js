// TIENDA: energía, fichas, cofres y cosméticos (fondo, baraja y aspecto de Nai).
//
// - Energía: cada nivel (normal u Oro) gasta 1 ⚡. Empiezas cada día con 2 ⚡ y, si bajas de 2, se recupera 1 cada 30 minutos.
//   Se puede comprar más con fichas. El VIP tiene energía ilimitada. Repasos y el entrenador de conteo no gastan.
// - Fichas 🪙: se ganan al completar niveles por primera vez, al cumplir la meta diaria y en los cofres del mapa.
// - Cofres 🎁: uno cada 6 niveles de cada juego; dan fichas y un premio extra (XP, energía o congelador).
// - Cosméticos: solo estéticos. Los precios y el catálogo están aquí abajo.

const ENERGIA = { max: 2, tope: 6, recargaMs: 30 * 60 * 1000 };
const COMPRAS_ENERGIA = [{ n: 1, fichas: 10 }, { n: 3, fichas: 25 }];
const CADA_COFRE = 6;

// ---------- energía ----------
// Aplica el reinicio diario y la recarga por tiempo. Se llama siempre antes de leer la energía.
function actualizarEnergia() {
  const e = progreso.energia;
  let cambio = false;
  if (e.dia !== hoy()) {
    e.dia = hoy();
    if (e.n < ENERGIA.max) e.n = ENERGIA.max;
    e.t = 0;
    cambio = true;
  }
  if (e.n < ENERGIA.max && e.t > 0) {
    const k = Math.floor((Date.now() - e.t) / ENERGIA.recargaMs);
    if (k > 0) {
      e.n = Math.min(ENERGIA.max, e.n + k);
      e.t = e.n >= ENERGIA.max ? 0 : e.t + k * ENERGIA.recargaMs;
      cambio = true;
    }
  } else if (e.n < ENERGIA.max && !e.t) {
    e.t = Date.now();
    cambio = true;
  }
  if (cambio) guardarProgreso();
  return e;
}
const energiaActual = () => actualizarEnergia().n;
const tieneEnergia = () => esVip() || energiaActual() >= 1;
function gastarEnergia() {
  if (esVip()) return;
  const e = actualizarEnergia();
  e.n = Math.max(0, e.n - 1);
  if (e.n < ENERGIA.max && !e.t) e.t = Date.now();
  guardarProgreso();
}
function ganarEnergia(n) {
  const e = actualizarEnergia();
  e.n = Math.min(ENERGIA.tope, e.n + n);
  if (e.n >= ENERGIA.max) e.t = 0;
  guardarProgreso();
}
// segundos que faltan para la próxima unidad de energía (0 si ya está llena)
function segundosParaEnergia() {
  const e = actualizarEnergia();
  if (e.n >= ENERGIA.max || !e.t) return 0;
  return Math.max(1, Math.ceil((e.t + ENERGIA.recargaMs - Date.now()) / 1000));
}
const reloj = (s) => `${Math.floor(s / 60)}:${pad(s % 60)}`;
function comprarEnergia(oferta) {
  if (progreso.fichas < oferta.fichas) return 'No tienes fichas suficientes.';
  if (energiaActual() >= ENERGIA.tope) return 'Ya tienes la energía al máximo.';
  progreso.fichas -= oferta.fichas;
  ganarEnergia(oferta.n);
  return '';
}

// Un reloj que se repite cada segundo mientras la función devuelva true (se para solo al cambiar de pantalla)
let temporizadorTienda = null;
function vigilar(fn) {
  clearInterval(temporizadorTienda);
  temporizadorTienda = setInterval(() => {
    if (!fn()) clearInterval(temporizadorTienda);
  }, 1000);
}

// ---------- catálogo de cosméticos ----------
const CATALOGO = {
  fondo: [
    { id: 'clasico', nombre: 'Clásico', precio: 0, vista: 'linear-gradient(135deg,#fff6e9,#ffd9c0)' },
    { id: 'mesa', nombre: 'Mesa de casino', precio: 40, vista: 'linear-gradient(135deg,#1b8052,#0f3d2b)' },
    { id: 'medianoche', nombre: 'Noche de póker', precio: 50, vista: 'linear-gradient(135deg,#1b2a5c,#0b1030)' },
    { id: 'atardecer', nombre: 'Ruleta al atardecer', precio: 60, vista: 'linear-gradient(135deg,#ffb88a,#ff7a9c)' },
    { id: 'neon', nombre: 'Tragaperras neón', precio: 90, vista: 'linear-gradient(135deg,#7a2cff,#17d3ff)' },
    { id: 'dorado', nombre: 'Salón dorado', precio: 120, vista: 'linear-gradient(135deg,#ffe58a,#e0a100)' },
  ],
  baraja: [
    { id: 'clasica', nombre: 'Clásica', precio: 0 },
    { id: 'rosa', nombre: 'Rosa', precio: 40 },
    { id: 'oscura', nombre: 'Oscura', precio: 50 },
    { id: 'retro', nombre: 'Retro', precio: 70 },
    { id: 'dorada', nombre: 'Dorada', precio: 60 },
    { id: 'neon', nombre: 'Neón', precio: 90 },
  ],
  espanola: [
    { id: 'clasica', nombre: 'Clásica', precio: 0 },
    { id: 'taberna', nombre: 'Taberna', precio: 40 },
    { id: 'pergamino', nombre: 'Pergamino', precio: 50 },
    { id: 'dorada', nombre: 'Dorada', precio: 60 },
    { id: 'nocturna', nombre: 'Nocturna', precio: 70 },
    { id: 'neon', nombre: 'Neón', precio: 90 },
  ],
  nai: [
    { id: 'clasico', nombre: 'Nai clásica', precio: 0 },
    { id: 'gafas', nombre: 'Gafas de sol', precio: 40 },
    { id: 'copa', nombre: 'Sombrero de copa', precio: 60 },
    { id: 'corona', nombre: 'Corona', precio: 100 },
    { id: 'oro', nombre: 'Nai de oro', precio: 150 },
  ],
};
let pestanaTienda = 'fondo';
const SECCIONES_TIENDA = [
  { tipo: 'fondo', titulo: 'Fondos', icono: '🖼' },
  { tipo: 'baraja', titulo: 'Barajas', icono: '🃏' },
  { tipo: 'espanola', titulo: 'Baraja española', icono: '🎴' },
  { tipo: 'nai', titulo: 'Aspecto de Nai', icono: '🎩' },
];
const articuloDe = (tipo, id) => CATALOGO[tipo].find((a) => a.id === id);
const esGratis = (a) => a.precio === 0;
const loTengo = (tipo, id) => { const a = articuloDe(tipo, id); return !!a && (esGratis(a) || progreso.tienda.comprados.includes(tipo + ':' + id)); };
const equipado = (tipo) => { const id = progreso.tienda.equipado[tipo]; return articuloDe(tipo, id) && loTengo(tipo, id) ? id : CATALOGO[tipo][0].id; };

// Pone el fondo y la baraja elegidos en la página (Nai lo lee de progreso al dibujarse)
function aplicarCosmeticos() {
  const raiz = document.documentElement;
  const fondo = equipado('fondo'), baraja = equipado('baraja'), espanola = equipado('espanola');
  if (espanola === 'clasica') raiz.removeAttribute('data-espanola'); else raiz.setAttribute('data-espanola', espanola);
  if (fondo === 'clasico') raiz.removeAttribute('data-fondo'); else raiz.setAttribute('data-fondo', fondo);
  if (baraja === 'clasica') raiz.removeAttribute('data-baraja'); else raiz.setAttribute('data-baraja', baraja);
}
function comprarArticulo(tipo, id) {
  const a = articuloDe(tipo, id);
  if (!a || loTengo(tipo, id)) return '';
  if (progreso.fichas < a.precio) return `Te faltan ${a.precio - progreso.fichas} fichas para «${a.nombre}».`;
  progreso.fichas -= a.precio;
  progreso.tienda.comprados.push(tipo + ':' + id);
  progreso.tienda.equipado[tipo] = id;
  guardarProgreso();
  aplicarCosmeticos();
  return '';
}
function equiparArticulo(tipo, id) {
  if (!loTengo(tipo, id)) return;
  progreso.tienda.equipado[tipo] = id;
  guardarProgreso();
  aplicarCosmeticos();
}

// ---------- cofres ----------
const idCofre = (curso, k) => `${curso.id}-cofre-${k}`;
// Premios: siempre fichas, más un premio extra al azar
function abrirCofre(id) {
  if (progreso.cofres[id]) return [];
  const premios = [];
  const m = multVip();
  const fichas = (8 + Math.floor(Math.random() * 13)) * m;
  const suerte = Math.random();
  let extra = null;
  if (suerte < 0.1) extra = { icono: '🪙', texto: `¡Bote! +${40 * m} fichas`, fichas: 40 * m };
  else if (suerte < 0.2) extra = { icono: '⚡', texto: '+2 de energía', energia: 2 };
  else if (suerte < 0.45) extra = { icono: '⚡', texto: '+1 de energía', energia: 1 };
  else if (suerte < 0.55 && progreso.congeladores < 2) extra = { icono: '🧊', texto: 'Un congelador de racha', congelador: 1 };
  else { const xp = 20 + Math.floor(Math.random() * 6) * 5; extra = { icono: '⭐', texto: `+${xp * m} XP`, xp: xp * m }; }
  progreso.cofres[id] = true;
  progreso.fichas += fichas + (extra.fichas || 0);
  premios.push({ icono: '🪙', texto: `+${fichas} fichas${m > 1 ? ' (VIP ×2)' : ''}` });
  if (extra.energia) ganarEnergia(extra.energia);
  if (extra.congelador) progreso.congeladores = Math.min(2, progreso.congeladores + 1);
  if (extra.xp) progreso.xp += extra.xp;
  premios.push({ icono: extra.icono, texto: extra.texto });
  guardarProgreso();
  return premios;
}

// Cofre animado: se sacude, la tapa se abre con un haz de luz, saltan las monedas y aparecen los premios uno a uno
const SVG_COFRE = `<svg viewBox="0 0 200 170" class="cofre-svg" focusable="false" aria-hidden="true">
<defs>
<linearGradient id="cfM" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e9ad6c"/><stop offset=".55" stop-color="#b4692c"/><stop offset="1" stop-color="#6e3b14"/></linearGradient>
<linearGradient id="cfO" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff3a8"/><stop offset=".45" stop-color="#ffc928"/><stop offset="1" stop-color="#d98200"/></linearGradient>
<radialGradient id="cfL" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff8c8"/><stop offset=".5" stop-color="#ffd54a"/><stop offset="1" stop-color="#ffd54a" stop-opacity="0"/></radialGradient>
</defs>
<ellipse cx="100" cy="158" rx="78" ry="9" fill="#0003"/>
<ellipse class="cf-luz" cx="100" cy="92" rx="62" ry="22" fill="url(#cfL)"/>
<g class="cf-monedas">
<circle class="cf-m m1" cx="78" cy="96" r="11" fill="url(#cfO)" stroke="#a86a00" stroke-width="2.5"/>
<circle class="cf-m m2" cx="102" cy="94" r="12" fill="url(#cfO)" stroke="#a86a00" stroke-width="2.5"/>
<circle class="cf-m m3" cx="124" cy="97" r="10" fill="url(#cfO)" stroke="#a86a00" stroke-width="2.5"/>
<circle class="cf-m m4" cx="90" cy="98" r="9" fill="url(#cfO)" stroke="#a86a00" stroke-width="2.5"/>
<circle class="cf-m m5" cx="114" cy="99" r="9" fill="url(#cfO)" stroke="#a86a00" stroke-width="2.5"/>
</g>
<path d="M32 90 H168 V150 Q168 156 162 156 H38 Q32 156 32 150Z" fill="url(#cfM)" stroke="#4a2608" stroke-width="4" stroke-linejoin="round"/>
<path d="M32 108 H168 M32 134 H168" stroke="#5a3010" stroke-opacity=".45" stroke-width="2"/>
<rect x="30" y="112" width="140" height="12" fill="url(#cfO)" stroke="#8a5a00" stroke-width="2.5"/>
<rect x="44" y="90" width="12" height="66" fill="url(#cfO)" stroke="#8a5a00" stroke-width="2.5"/>
<rect x="144" y="90" width="12" height="66" fill="url(#cfO)" stroke="#8a5a00" stroke-width="2.5"/>
<g class="cf-tapa">
<path d="M32 90 V70 Q32 38 100 38 Q168 38 168 70 V90Z" fill="url(#cfM)" stroke="#4a2608" stroke-width="4" stroke-linejoin="round"/>
<rect x="30" y="76" width="140" height="12" fill="url(#cfO)" stroke="#8a5a00" stroke-width="2.5"/>
<rect x="44" y="45" width="12" height="45" fill="url(#cfO)" stroke="#8a5a00" stroke-width="2.5"/>
<rect x="144" y="45" width="12" height="45" fill="url(#cfO)" stroke="#8a5a00" stroke-width="2.5"/>
<path d="M62 62 Q80 48 104 46" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="5" stroke-linecap="round"/>
</g>
<g class="cf-cerradura"><rect x="86" y="92" width="28" height="30" rx="7" fill="url(#cfO)" stroke="#8a5a00" stroke-width="3"/><circle cx="100" cy="104" r="4.5" fill="#6b3d00"/><rect x="98" y="104" width="4" height="10" rx="2" fill="#6b3d00"/></g>
</svg>`;

function mostrarCofre(curso, id, volver) {
  alTeclear = null;
  let premios = null;
  const { fila, parrafo } = naiFila('feliz', '¡Un cofre! A ver qué hay dentro…', 'grande');
  const cofre = el('div', { class: 'cofre-grande', 'aria-hidden': 'true' });
  cofre.innerHTML = SVG_COFRE;
  const escena = el('div', { class: 'cofre-escena' }, el('div', { class: 'cofre-rayos' }), cofre);
  const lista = el('ul', { class: 'cofre-premios', 'aria-live': 'polite' });
  const boton = el('button', { class: 'boton oro', type: 'button' }, 'Abrir cofre');
  boton.onclick = () => {
    if (premios) return volver();
    premios = abrirCofre(id);
    escena.classList.add('abierto');
    cofre.classList.add('abierto');
    parrafo.textContent = '¡Aquí tienes tu premio!';
    lista.replaceChildren(...premios.map((p, i) => el('li', { class: 'cofre-premio aparece', style: `--i:${i}` }, el('span', { class: 'cofre-premio-icono', 'aria-hidden': 'true' }, p.icono), p.texto)));
    boton.textContent = 'Continuar';
    sonido('cofreSacude');
    sonido('cofreAbre', 700);
    sonido('monedas', 1150);
    premios.forEach((_, i) => sonido('ficha', 1500 + i * 220));
    setTimeout(() => { const c = document.querySelector('.contenido'); if (c && cofre.isConnected) c.append(confeti(70)); }, 800);
  };
  pintar(
    'adelante',
    el('header', { class: 'cabecera-leccion' }, el('button', { class: 'cerrar', type: 'button', 'aria-label': 'Volver al mapa', onclick: () => volver() }, '✕')),
    el('main', { class: 'contenido centro', style: `--acento:${curso.color}` }, el('h1', {}, 'Cofre del camino'), escena, fila, lista),
    el('div', { class: 'pie' }, boton)
  );
}

// ---------- pantalla sin energía ----------
function mostrarSinEnergia(reintentar, atras) {
  alTeclear = null;
  const { fila } = naiFila('triste', 'Te has quedado sin energía. Cada nivel gasta 1 ⚡; se recupera con el tiempo, en la tienda o con VIP.', 'grande');
  const tiempo = el('p', { class: 'energia-espera', role: 'timer' });
  const mensaje = el('p', { class: 'ajuste-mensaje', role: 'status', 'aria-live': 'polite' });
  const acciones = el('div', { class: 'energia-acciones' });
  const pintarAcciones = () => {
    const lista = [];
    if (tieneEnergia()) {
      lista.push(el('button', { class: 'boton', type: 'button', onclick: reintentar }, '¡Ya tienes energía! Jugar'));
    } else {
      const oferta = COMPRAS_ENERGIA[0];
      lista.push(el('button', { class: 'boton', type: 'button', disabled: progreso.fichas < oferta.fichas ? '' : null, onclick: () => {
        const error = comprarEnergia(oferta);
        if (error) { mensaje.textContent = error; return; }
        reintentar();
      } }, `Comprar ${oferta.n} ⚡ por ${oferta.fichas} 🪙 (tienes ${progreso.fichas})`));
      lista.push(el('button', { class: 'boton secundario', type: 'button', onclick: () => mostrarTienda('adelante') }, 'Ir a la tienda'));
    }
    acciones.replaceChildren(...lista);
  };
  const tic = () => {
    if (!tiempo.isConnected) return false;
    if (tieneEnergia()) { tiempo.textContent = '⚡ ¡Energía recuperada!'; pintarAcciones(); return false; }
    tiempo.textContent = `Próxima ⚡ en ${reloj(segundosParaEnergia())}`;
    return true;
  };
  pintar(
    'adelante',
    el('header', { class: 'cabecera-leccion' }, el('button', { class: 'cerrar', type: 'button', 'aria-label': 'Volver al mapa', onclick: () => atras() }, '✕')),
    el('main', { class: 'contenido centro' }, el('h1', {}, '⚡ Sin energía'), fila, tiempo, mensaje),
    el('div', { class: 'pie' }, acciones)
  );
  pintarAcciones();
  tic();
  vigilar(tic);
}

// ---------- la tienda ----------
function mostrarTienda(entrada = 'fundido') {
  alTeclear = null;
  if (progreso.pasos && !progreso.pasos.tienda) { progreso.pasos.tienda = true; guardarProgreso(); }
  const vip = esVip();
  const { fila } = naiFila('feliz', 'Bienvenido a la tienda. Gana fichas con los niveles y los cofres, y gástalas en energía o en estilo.');
  const mensaje = el('p', { class: 'ajuste-mensaje', role: 'status', 'aria-live': 'polite' });
  const recargar = () => mostrarTienda('sin');

  // Energía
  const pilas = el('span', { class: 'energia-pilas', 'aria-hidden': 'true' });
  const texto = el('strong', {});
  const espera = el('span', { class: 'juego-niveles', id: 'energia-espera' });
  const pintarEnergia = () => {
    const n = energiaActual();
    pilas.replaceChildren(...Array.from({ length: Math.max(ENERGIA.max, n) }, (_, i) => el('span', { class: 'pila' + (vip || i < n ? ' llena' : '') }, '⚡')));
    texto.textContent = vip ? 'Energía ilimitada (VIP)' : `Energía: ${n} / ${ENERGIA.max}`;
    const s = segundosParaEnergia();
    espera.textContent = vip ? 'Juega todos los niveles que quieras.' : s > 0 ? `Próxima ⚡ en ${reloj(s)} · cada día empiezas con ${ENERGIA.max} ⚡` : `Cada nivel gasta 1 ⚡ · cada día empiezas con ${ENERGIA.max} ⚡`;
    return espera.isConnected;
  };
  const botonesEnergia = vip
    ? null
    : el('div', { class: 'tienda-compras' }, COMPRAS_ENERGIA.map((o) =>
        el('button', { class: 'boton secundario compra', type: 'button', disabled: progreso.fichas < o.fichas || energiaActual() >= ENERGIA.tope ? '' : null, onclick: () => {
          const error = comprarEnergia(o);
          if (error) { mensaje.textContent = error; return; }
          sonido('toque');
          recargar();
        } }, `+${o.n} ⚡ · ${o.fichas} 🪙`)
      ));
  const tarjetaEnergia = el('div', { class: 'tienda-tarjeta energia' }, el('div', { class: 'tienda-fila' }, pilas, el('span', { class: 'juego-texto' }, texto, espera)), botonesEnergia);

  // VIP
  const tarjetaVip = el('button', { class: 'banner-oro' + (vip ? ' activo' : ''), type: 'button', onclick: () => mostrarPremium(() => mostrarTienda('atras')) },
    el('span', { class: 'banner-oro-icono', 'aria-hidden': 'true' }, '👑'),
    el('span', { class: 'juego-texto' }, el('strong', {}, vip ? 'Tu pase VIP está activo' : 'Pase VIP'), el('span', { class: 'juego-desc' }, vip ? `Hasta el ${fechaVip(progreso.vip.hasta)}: XP y fichas ×2, energía ilimitada y ruta dorada.` : 'Doble de XP y de fichas, energía ilimitada y ruta dorada con niveles Oro. ¡5 días gratis!')),
    el('span', { class: 'flecha', 'aria-hidden': 'true' }, '›'));

  // Cosméticos
  const vistaArticulo = (tipo, a) => {
    if (tipo === 'fondo') return el('span', { class: 'vista vista-fondo', 'data-glifo': ({ clasico: '♠', mesa: '♣', medianoche: '♥', atardecer: '◉', neon: '7', dorado: '♦' })[a.id] || '♠', style: `background:${a.vista}` });
    if (tipo === 'baraja') return el('span', { class: 'vista vista-baraja', 'data-baraja': a.id }, el('span', { class: 'carta' }, 'A♠'), el('span', { class: 'carta roja' }, 'K♥'));
    if (tipo === 'espanola') return el('span', { class: 'vista vista-es', 'data-espanola': a.id }, cartaEspanola('Rey', 0), cartaEspanola('As', 2));
    const caja = el('span', { class: 'vista vista-nai' });
    caja.innerHTML = mascotaSVG('feliz', a.id);
    return caja;
  };
  const articulo = (tipo, a) => {
    const mio = loTengo(tipo, a.id), puesto = equipado(tipo) === a.id;
    const boton = el('button', { class: 'boton ' + (puesto ? 'secundario' : mio ? '' : 'oro') + ' mini-boton', type: 'button', disabled: puesto ? '' : null, onclick: () => {
      if (mio) { equiparArticulo(tipo, a.id); sonido('toque'); return recargar(); }
      const error = comprarArticulo(tipo, a.id);
      if (error) { mensaje.textContent = error; return; }
      sonido('ficha');
      recargar();
    } }, puesto ? 'Equipado' : mio ? 'Equipar' : `${a.precio} 🪙`);
    return el('div', { class: 'articulo' + (puesto ? ' puesto' : ''), 'data-articulo': tipo + ':' + a.id }, puesto ? el('span', { class: 'sello-puesto' }, 'Puesto') : null, vistaArticulo(tipo, a), el('strong', {}, a.nombre), boton);
  };
  if (!SECCIONES_TIENDA.some((x) => x.tipo === pestanaTienda)) pestanaTienda = 'fondo';
  const panel = el('div', { class: 'articulos', role: 'tabpanel', id: 'panel-tienda', 'aria-labelledby': 'tab-tienda-' + pestanaTienda }, CATALOGO[pestanaTienda].map((a) => articulo(pestanaTienda, a)));
  const pestanas = el('div', { class: 'pestanas-tienda', role: 'tablist', 'aria-label': 'Categorías de la tienda' }, SECCIONES_TIENDA.map((x) =>
    el('button', { class: 'pestana-tienda' + (x.tipo === pestanaTienda ? ' activa' : ''), type: 'button', role: 'tab', id: 'tab-tienda-' + x.tipo, 'aria-selected': x.tipo === pestanaTienda ? 'true' : 'false', 'aria-controls': 'panel-tienda', 'data-pestana': x.tipo, onclick: () => { pestanaTienda = x.tipo; sonido('toque'); recargar(); } }, x.icono, ' ' + x.titulo)));
  const secciones = el('section', { class: 'tienda-seccion' }, pestanas, panel);

  pintar(
    entrada,
    el('header', { class: 'cabecera' }, el('span', { class: 'logo' }, '🛍️ Tienda'), marcador()),
    el('main', { class: 'contenido tienda' },
      fila,
      el('section', { class: 'cartera', 'aria-label': 'Tu cartera' },
        el('div', { class: 'tienda-fichas' }, el('span', { class: 'ficha-grande', 'aria-hidden': 'true' }, '🪙'), el('span', { class: 'juego-texto' }, el('strong', {}, `${progreso.fichas} fichas`), el('span', { class: 'juego-desc' }, '3 por nivel nuevo (6 en los Oro), 5 por la meta diaria y más en los cofres.'))),
        tarjetaEnergia),
      mensaje,
      tarjetaVip,
      secciones,
      el('p', { class: 'aviso' }, 'Las fichas no se compran con dinero ni valen nada fuera de la app: solo sirven para personalizarla. Contenido educativo, sin dinero real.')
    )
  );
  pintarEnergia();
  vigilar(pintarEnergia);
}
