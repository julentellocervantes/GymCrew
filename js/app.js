// Entrenador de cartas: lógica de la app (JavaScript sin dependencias).
//
// Pantallas:  inicio (elegir juego) -> mapa de niveles -> presentación de Nai -> lección -> resultado
// Los cursos están en data/*.js (variable CURSOS) y la mascota en js/mascota.js.
// Las animaciones están en css/estilos.css; aquí solo se indica QUÉ transición lleva cada pantalla.

const KEY = 'progreso-v2';
const raiz = document.getElementById('app');

// ---------- fechas y racha ----------
const pad = (n) => String(n).padStart(2, '0');
const fechaLocal = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const hoy = () => fechaLocal(new Date());
// Días de calendario entre dos fechas "AAAA-MM-DD" (a mediodía, para que el cambio de hora no cuente)
const diasEntre = (a, b) => Math.round((new Date(b + 'T12:00:00') - new Date(a + 'T12:00:00')) / 86400000);

// ---------- progreso guardado en el navegador (localStorage) ----------
// Los campos nuevos son opcionales: un progreso guardado con una versión anterior se completa con estos valores.
const progresoNuevo = () => ({
  xp: 0, racha: 0, ultimoDia: null, completadas: {}, logros: {}, repasos: 0, perfectos: 0,
  meta: 20,                       // XP que quieres ganar cada día
  xpHoy: { dia: null, xp: 0 },    // XP ganado en el día indicado
  congeladores: 0,                // protegen la racha si fallas un día (máx. 2)
  srs: {},                        // repetición espaciada: id del ejercicio -> { caja, prox, fallos }
  conteo: { sesiones: 0, mejor: 0 }, // entrenador de conteo
  ajustes: { letra: 'normal', calma: false },
});

// Comprueba que un progreso (guardado o importado) tiene la forma esperada y rellena lo que falte
function normalizarProgreso(datos) {
  if (!datos || typeof datos !== 'object' || Array.isArray(datos)) return null;
  const base = progresoNuevo();
  const p = Object.assign(base, datos);
  const num = (v, d) => (Number.isFinite(v) && v >= 0 ? Math.floor(v) : d);
  const obj = (v, d) => (v && typeof v === 'object' && !Array.isArray(v) ? v : d);
  p.xp = num(p.xp, 0);
  p.racha = num(p.racha, 0);
  p.repasos = num(p.repasos, 0);
  p.perfectos = num(p.perfectos, 0);
  p.meta = [10, 20, 30, 50].includes(p.meta) ? p.meta : 20;
  p.congeladores = Math.min(2, num(p.congeladores, 0));
  p.ultimoDia = typeof p.ultimoDia === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(p.ultimoDia) ? p.ultimoDia : null;
  p.completadas = obj(p.completadas, {});
  p.logros = obj(p.logros, {});
  p.srs = obj(p.srs, {});
  p.xpHoy = Object.assign({ dia: null, xp: 0 }, obj(p.xpHoy, {}));
  p.conteo = Object.assign({ sesiones: 0, mejor: 0 }, obj(p.conteo, {}));
  p.ajustes = Object.assign({ letra: 'normal', calma: false }, obj(p.ajustes, {}));
  return p;
}

let almacenamientoFallo = false; // true si el navegador no deja guardar (modo privado, almacenamiento lleno...)

function cargarProgreso() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const p = normalizarProgreso(JSON.parse(raw));
      if (p) return p;
    }
  } catch (e) {
    almacenamientoFallo = true; // si el navegador bloquea el almacenamiento, se sigue sin guardar
  }
  return progresoNuevo();
}

function guardarProgreso() {
  try {
    localStorage.setItem(KEY, JSON.stringify(progreso));
    almacenamientoFallo = false;
  } catch (e) {
    almacenamientoFallo = true;
  }
}

let progreso = cargarProgreso();

// La racha solo "vive" si la última lección fue hoy o ayer
// (o anteayer, si tienes un congelador de racha para cubrir el día que falló)
function rachaVigente() {
  if (!progreso.ultimoDia) return 0;
  const d = diasEntre(progreso.ultimoDia, hoy());
  return d <= 1 || (d === 2 && progreso.congeladores > 0) ? progreso.racha : 0;
}
const xpDeHoy = () => (progreso.xpHoy && progreso.xpHoy.dia === hoy() ? progreso.xpHoy.xp : 0);

// Apunta actividad del día: XP, racha, congeladores y meta diaria. Lo usan las lecciones y el entrenador de conteo.
function registrarActividad(xp) {
  const dia = hoy();
  const res = { metaCumplida: false, congeladorUsado: false, congeladorGanado: false };
  if (progreso.ultimoDia !== dia) {
    const d = progreso.ultimoDia ? diasEntre(progreso.ultimoDia, dia) : 99;
    if (d === 1) progreso.racha += 1;
    else if (d === 2 && progreso.congeladores > 0) {
      progreso.congeladores -= 1;
      progreso.racha += 1;
      res.congeladorUsado = true;
    } else progreso.racha = 1;
    if (progreso.racha % 7 === 0 && progreso.congeladores < 2) {
      progreso.congeladores += 1;
      res.congeladorGanado = true;
    }
  }
  progreso.ultimoDia = dia;
  const antes = xpDeHoy();
  progreso.xpHoy = { dia, xp: antes + xp };
  progreso.xp += xp;
  res.metaCumplida = antes < progreso.meta && antes + xp >= progreso.meta;
  return res;
}

// ---------- repetición espaciada (cajas de Leitner) ----------
// Cada ejercicio que respondes se apunta: si aciertas sube de caja y tarda más en volver; si fallas, vuelve hoy.
const INTERVALOS_DIAS = [0, 1, 2, 4, 8, 16];
function registrarRespuesta(id, acierto) {
  const s = progreso.srs[id] || { caja: 0, prox: hoy(), fallos: 0 };
  if (acierto) s.caja = Math.min(INTERVALOS_DIAS.length - 1, s.caja + 1);
  else {
    s.caja = 0;
    s.fallos += 1;
  }
  s.prox = fechaLocal(new Date(Date.now() + INTERVALOS_DIAS[s.caja] * 86400000));
  progreso.srs[id] = s;
}

// ---------- datos de los cursos ----------
const niveles = (curso) => curso.unidades.flatMap((u) => u.lecciones);
const hechosDe = (curso) => niveles(curso).filter((l) => progreso.completadas[l.id]).length;
const siguienteNivel = (curso) => niveles(curso).find((l) => !progreso.completadas[l.id]) || null;
// id de ejercicio -> el ejercicio y su curso (para armar repasos que mezclan juegos)
const INDICE_EJERCICIOS = {};
CURSOS.forEach((c) => niveles(c).forEach((l) => l.ejercicios.forEach((e) => (INDICE_EJERCICIOS[e.id] = { ejercicio: e, curso: c }))));
const listaSrs = (filtro) =>
  Object.keys(progreso.srs).filter((id) => INDICE_EJERCICIOS[id] && filtro(progreso.srs[id]));
const pendientesHoy = () => listaSrs((s) => s.prox <= hoy());
const misErrores = () => listaSrs((s) => s.fallos > 0 && s.caja <= 1);
const elegirAlAzar = (lista) => lista[Math.floor(Math.random() * lista.length)];
function barajar(lista) {
  const a = lista.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ---------- opciones mezcladas ----------
// Para que la respuesta correcta no esté siempre en el mismo sitio. Las jugadas de blackjack (tipo "accion")
// mantienen su orden, y las respuestas que son solo una cifra se ordenan (de menor a mayor o al revés).
const esCifra = (t) => /^[≈+\-−]?\s?\d[\d.,]*\s?%?$/.test(String(t).trim());
const valorCifra = (t) => parseFloat(String(t).replace(/\.(?=\d{3})/g, '').replace(',', '.').replace('−', '-').replace(/[^\d.+-]/g, ''));
function preparar(e) {
  if (e.tipo === 'ordenar') {
    // "mezcla" es el orden en que se muestran las fichas (nunca ya resuelto)
    let mezcla;
    do mezcla = barajar(e.elementos.map((_, i) => i));
    while (mezcla.every((v, i) => v === i));
    return Object.assign({}, e, { opciones: [], correcta: 0, mezcla });
  }
  if (e.tipo === 'accion' || e.opciones.length < 2) return e;
  const correcta = e.opciones[e.correcta];
  const opciones = e.opciones.every(esCifra)
    ? e.opciones.slice().sort((a, b) => (valorCifra(a) - valorCifra(b)) * (Math.random() < 0.5 ? 1 : -1))
    : barajar(e.opciones);
  return Object.assign({}, e, { opciones, correcta: opciones.indexOf(correcta) });
}

// ---------- rangos (según tu XP) ----------
const RANGOS = [
  { desde: 0, nombre: 'Novato', icono: '🌱' },
  { desde: 40, nombre: 'Aprendiz', icono: '📘' },
  { desde: 120, nombre: 'Jugador', icono: '🎴' },
  { desde: 250, nombre: 'Tahúr', icono: '🃏' },
  { desde: 450, nombre: 'Maestro', icono: '🏆' },
  { desde: 700, nombre: 'Leyenda', icono: '👑' },
];
function rangoDe(xp) {
  let indice = 0;
  RANGOS.forEach((r, n) => {
    if (xp >= r.desde) indice = n;
  });
  const actual = RANGOS[indice];
  const siguiente = RANGOS[indice + 1] || null;
  const pct = siguiente ? (xp - actual.desde) / (siguiente.desde - actual.desde) : 1;
  return { indice, actual, siguiente, pct };
}

// ---------- logros ----------
const LOGROS = [
  { id: 'primer-paso', icono: '👣', titulo: 'Primer paso', desc: 'Completa tu primer nivel', cumple: (p) => Object.keys(p.completadas).length >= 1 },
  { id: 'sin-fallos', icono: '💯', titulo: 'Sin fallos', desc: 'Termina un nivel con el 100 % de aciertos', cumple: (p) => (p.perfectos || 0) >= 1 },
  { id: 'constante', icono: '🔥', titulo: 'Constante', desc: 'Consigue una racha de 3 días', cumple: () => rachaVigente() >= 3 },
  { id: 'explorador', icono: '🧭', titulo: 'Explorador', desc: 'Completa un nivel de cada juego', cumple: (p) => CURSOS.every((c) => niveles(c).some((l) => p.completadas[l.id])) },
  { id: 'repasador', icono: '🔁', titulo: 'Repasador', desc: 'Haz tu primer repaso rápido', cumple: (p) => (p.repasos || 0) >= 1 },
  { id: 'contador', icono: '⏱️', titulo: 'Contador', desc: 'Acierta la cuenta en el entrenador de conteo', cumple: (p) => (p.conteo && p.conteo.mejor) > 0 },
  { id: 'cien-xp', icono: '⭐', titulo: '100 XP', desc: 'Llega a 100 puntos de experiencia', cumple: (p) => p.xp >= 100 },
].concat(
  CURSOS.map((c) => ({
    id: 'curso-' + c.id,
    icono: c.icono,
    titulo: 'Maestro de ' + c.nombre,
    desc: 'Completa todos los niveles de ' + c.nombre,
    cumple: (p) => niveles(c).every((l) => p.completadas[l.id]),
  }))
);

// Marca como conseguidos los logros nuevos y los devuelve
function calcularLogros() {
  const nuevos = [];
  for (const l of LOGROS) {
    if (!progreso.logros[l.id] && l.cumple(progreso)) {
      progreso.logros[l.id] = true;
      nuevos.push(l);
    }
  }
  return nuevos;
}

// ---------- utilidades de DOM ----------
function el(etiqueta, props = {}, ...hijos) {
  const nodo = document.createElement(etiqueta);
  for (const [clave, valor] of Object.entries(props)) {
    if (valor === undefined || valor === null) continue;
    if (clave === 'class') nodo.className = valor;
    else if (clave.startsWith('on')) nodo.addEventListener(clave.slice(2), valor);
    else nodo.setAttribute(clave, valor);
  }
  for (const hijo of hijos.flat(Infinity)) {
    if (hijo === null || hijo === undefined || hijo === false) continue;
    nodo.append(typeof hijo === 'number' ? String(hijo) : hijo);
  }
  return nodo;
}

// ---------- movimiento ----------
// Quien tiene activado "reducir movimiento" en su sistema no ve animaciones (el CSS también lo respeta)
const sinMovimiento = () =>
  !!(progreso.ajustes && progreso.ajustes.calma) ||
  (typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

// Espera a que el navegador haya pintado el estado inicial para que la transición se vea
const alSiguienteFotograma = (f) =>
  typeof requestAnimationFrame === 'function' ? requestAnimationFrame(() => requestAnimationFrame(f)) : f();

// Sube un número desde 0 hasta su valor final, frenando al llegar
function contar(nodo, hasta, formato, retraso = 0, ms = 900) {
  nodo.textContent = formato(hasta);
  if (sinMovimiento() || typeof requestAnimationFrame !== 'function') return;
  nodo.textContent = formato(0);
  const paso = (ahora, inicio) => {
    if (!nodo.isConnected) return;
    const k = Math.min(1, (ahora - inicio) / ms);
    nodo.textContent = formato(Math.round(hasta * (1 - Math.pow(1 - k, 3))));
    if (k < 1) requestAnimationFrame((t) => paso(t, inicio));
  };
  setTimeout(() => requestAnimationFrame((t) => paso(t, t)), retraso);
}

// Lluvia de confeti (solo transform y opacity, se retira sola)
function confeti(cantidad = 40) {
  if (sinMovimiento()) return null;
  const colores = ['#58cc02', '#ffd23f', '#ff5a7a', '#1cb0f6', '#a560ff', '#ff9600'];
  const azar = (a, b) => (a + Math.random() * (b - a)).toFixed(2);
  const piezas = [];
  for (let i = 0; i < cantidad; i++) {
    piezas.push(
      el('span', {
        class: i % 3 === 0 ? 'redondo' : '',
        style:
          `left:${azar(0, 100)}%;width:${azar(6, 11)}px;height:${azar(8, 15)}px;background:${elegirAlAzar(colores)};` +
          `--dx:${azar(-90, 90)}px;--giro:${azar(360, 1080)}deg;--dur:${azar(1.9, 3.2)}s;--ret:${azar(0, 0.7)}s`,
      })
    );
  }
  const capa = el('div', { class: 'confeti', 'aria-hidden': 'true' }, piezas);
  setTimeout(() => capa.remove(), 4300);
  return capa;
}

// Chispas que saltan desde un punto de la pantalla (x, y en píxeles de ventana)
function chispas(x, y, cantidad = 10) {
  if (sinMovimiento()) return;
  const colores = ['#ffd23f', '#58cc02', '#ff5a7a', '#1cb0f6', '#fff'];
  const piezas = [];
  for (let i = 0; i < cantidad; i++) {
    const ang = (Math.PI * 2 * i) / cantidad + Math.random() * 0.5;
    const dist = 38 + Math.random() * 46;
    piezas.push(
      el('span', {
        style:
          `--x:${x}px;--y:${y}px;--dx:${(Math.cos(ang) * dist).toFixed(1)}px;--dy:${(Math.sin(ang) * dist).toFixed(1)}px;` +
          `--giro:${Math.round(Math.random() * 360)}deg;color:${elegirAlAzar(colores)}`,
      }, '✦')
    );
  }
  const capa = el('div', { class: 'chispas', 'aria-hidden': 'true' }, piezas);
  document.body.append(capa);
  setTimeout(() => capa.remove(), 1100);
}

// Onda al tocar botones, opciones y tarjetas
document.addEventListener('pointerdown', (e) => {
  if (sinMovimiento() || !e.target.closest) return;
  const b = e.target.closest('.boton, .opcion, .juego, .rango, .repaso, .instalar, .ficha');
  if (!b) return;
  const r = b.getBoundingClientRect();
  const onda = el('span', { class: 'onda', style: `left:${e.clientX - r.left}px;top:${e.clientY - r.top}px` });
  b.append(onda);
  setTimeout(() => onda.remove(), 750);
});

// Tocar a Nai: salta y suelta chispas
raiz.addEventListener('click', (e) => {
  const nai = e.target.closest && e.target.closest('.nai');
  if (!nai) return;
  nai.classList.remove('toque');
  void nai.offsetWidth;
  nai.classList.add('toque');
  setTimeout(() => nai.classList.remove('toque'), 800);
  const r = nai.getBoundingClientRect();
  chispas(r.left + r.width / 2, r.top + r.height * 0.3, 8);
});

const momentoDelDia = () => {
  const h = new Date().getHours();
  return h < 6 ? '¡Buenas noches' : h < 13 ? '¡Buenos días' : h < 20 ? '¡Buenas tardes' : '¡Buenas noches';
};

// Dibuja una pantalla. "entrada" elige la transición:
//   'adelante' (entra desde la derecha) | 'atras' (desde la izquierda) | 'fundido'
//   'ejercicio' (solo cambia el contenido) | 'sin' (repintado dentro del mismo ejercicio: no se anima la pantalla)
function pintar(entrada, ...nodos) {
  const y = window.scrollY || 0;
  raiz.dataset.entrada = entrada;
  // Se descartan los null: replaceChildren los escribiría como el texto "null"
  raiz.replaceChildren(...nodos.filter(Boolean));
  if (typeof window.scrollTo === 'function') window.scrollTo(0, entrada === 'sin' ? y : 0);
  // Foco para teclado y lectores de pantalla: al responder pasa a "Continuar"; en una pantalla nueva, a su contenido
  const destino = entrada === 'sin' ? raiz.querySelector('.feedback .boton') : raiz.querySelector('main');
  if (destino && destino.focus) {
    if (destino.tagName === 'MAIN') destino.setAttribute('tabindex', '-1');
    destino.focus({ preventScroll: true });
  }
}

// Atajos de teclado de la pantalla actual (1-4 para elegir, Enter para continuar)
let alTeclear = null;
document.addEventListener('keydown', (e) => {
  if (alTeclear) alTeclear(e);
});

// ---------- Nai, la mascota ----------
// reaccion: true cuando Nai responde a lo que acabas de hacer (salta de alegría o se lamenta)
function mascota(estado, reaccion = false) {
  const nodo = el('div', { class: 'nai ' + estado + (reaccion ? ' reaccion' : ''), role: 'img', 'aria-label': 'Nai, la mascota' });
  nodo.innerHTML = mascotaSVG(estado); // texto fijo de js/mascota.js, sin datos de usuario
  return nodo;
}

// Nai con un globo de texto. tamano: '' | 'grande' | 'pequena'
function conPalabras(texto) {
  const salida = [];
  String(texto).split(' ').forEach((palabra, i) => {
    if (i > 0) salida.push(' ');
    salida.push(el('span', { class: 'w', style: `--w:${Math.min(i, 26)}` }, palabra));
  });
  return salida;
}

function naiFila(estado, texto, tamano = '', reaccion = false) {
  const animar = !reaccion && String(texto).length <= 260;
  const parrafo = el('p', {}, animar ? conPalabras(texto) : texto);
  const fila = el('div', { class: 'nai-fila ' + tamano }, mascota(estado, reaccion), el('div', { class: 'globo' }, parrafo));
  return { fila, parrafo };
}

// ---------- cartas ----------
// n: posición de la carta en la mesa, para repartirlas una a una
// "K♠" -> "rey de picas" (para lectores de pantalla)
const PALOS = { '♠': 'picas', '♥': 'corazones', '♦': 'diamantes', '♣': 'tréboles' };
const FIGURAS = { A: 'as', J: 'jota', Q: 'reina', K: 'rey' };
function nombreCarta(texto) {
  const m = /^(10|[2-9AJQK])([♠♥♦♣])$/.exec(texto);
  return m ? `${FIGURAS[m[1]] || m[1]} de ${PALOS[m[2]]}` : texto;
}
function carta(valor, n = 0) {
  const texto = String(valor);
  const roja = /[♥♦]/.test(texto);
  const larga = texto.length > 3;
  const nombre = nombreCarta(texto);
  return el('div', { class: 'carta' + (roja ? ' roja' : '') + (larga ? ' larga' : ''), style: `--c:${n}`, role: 'img', 'aria-label': nombre }, texto);
}

function situacion(ejercicio) {
  let filas = null;
  if (ejercicio.situacion && ejercicio.situacion.filas) {
    filas = ejercicio.situacion.filas;
  } else if (ejercicio.situacion) {
    filas = [
      { etiqueta: 'Crupier', cartas: [ejercicio.situacion.crupier] },
      { etiqueta: 'Tu mano', cartas: ejercicio.situacion.jugador },
    ];
  } else if (ejercicio.secuencia) {
    filas = [{ etiqueta: 'Cartas en orden de salida', cartas: ejercicio.secuencia }];
  }
  if (!filas) return null;

  let n = 0;
  return el(
    'div',
    { class: 'mesa' },
    filas.map((f, i) => [
      el('p', { class: 'mesa-etiqueta' + (i > 0 ? ' separada' : '') }, f.etiqueta),
      el('div', { class: 'fila' }, f.cartas.map((v) => carta(v, n++))),
    ])
  );
}

// ---------- cabecera con racha y XP ----------
let xpVisto = progreso.xp;
const marcador = () => {
  const subio = progreso.xp !== xpVisto;
  xpVisto = progreso.xp;
  return el(
    'span',
    { class: 'marcador' },
    el('span', { class: 'dato' }, el('span', { class: 'emo emo-llama' }, '🔥'), ` ${rachaVigente()}`),
    el('span', { class: 'dato' + (subio ? ' sube' : '') }, el('span', { class: 'emo emo-estrella' }, '⭐'), ` ${progreso.xp} XP`)
  );
};

// ---------- instalar como app (PWA) ----------
let eventoInstalar = null;
const yaInstalada = () => window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
const esIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent);
const puedeInstalar = () => !yaInstalada() && (eventoInstalar !== null || esIOS());

function crearBotonInstalar() {
  return el(
    'button',
    {
      class: 'instalar',
      type: 'button',
      onclick: () => {
        if (eventoInstalar) {
          eventoInstalar.prompt();
          eventoInstalar.userChoice.then(() => {
            eventoInstalar = null;
            raiz.querySelectorAll('.instalar').forEach((b) => b.remove());
          });
        } else {
          alert('Para instalarla en iPhone o iPad: pulsa el botón Compartir de Safari y elige «Añadir a pantalla de inicio».');
        }
      },
    },
    el('span', { class: 'instalar-icono' }, '📲'),
    el('span', { class: 'juego-texto' }, el('strong', {}, 'Instala la app'), el('span', { class: 'juego-desc' }, 'Ábrela desde tu pantalla de inicio, también sin conexión'))
  );
}

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault(); // guardamos el aviso para mostrarlo cuando el usuario quiera
  eventoInstalar = e;
  const aviso = raiz.querySelector('.aviso');
  if (aviso && !raiz.querySelector('.instalar')) aviso.before(crearBotonInstalar());
});
window.addEventListener('appinstalled', () => {
  eventoInstalar = null;
  raiz.querySelectorAll('.instalar').forEach((b) => b.remove());
});

// ============================================================
// PANTALLA 1: elegir juego
// ============================================================
function mostrarInicio(entrada = 'fundido') {
  alTeclear = null;

  const saludo =
    progreso.xp === 0
      ? `${momentoDelDia()}! Soy Nai, tu entrenador de cartas. Elige un juego y te enseño a jugarlo paso a paso, como en un videojuego.`
      : rachaVigente() > 1
      ? `¡Ya llevas ${rachaVigente()} días seguidos! ¿Qué juego practicamos hoy?`
      : `${momentoDelDia()}! Qué bien verte por aquí. ¿Qué juego practicamos hoy?`;
  const { fila } = naiFila('feliz', saludo, 'hero');

  const rg = rangoDe(progreso.xp);
  const tarjetaRango = el(
    'button',
    { class: 'rango', type: 'button', onclick: () => mostrarLogros() },
    el('span', { class: 'rango-icono' }, rg.actual.icono),
    el(
      'span',
      { class: 'juego-texto' },
      el('strong', {}, `Rango: ${rg.actual.nombre}`),
      el('span', { class: 'juego-barra' }, el('span', { class: 'juego-relleno', style: `width:${Math.round(rg.pct * 100)}%` })),
      el('span', { class: 'juego-niveles' }, rg.siguiente ? `${progreso.xp} / ${rg.siguiente.desde} XP para ser ${rg.siguiente.nombre}` : '¡Has llegado al rango máximo!')
    ),
    el('span', { class: 'rango-logros' }, '🏅', el('small', {}, `${LOGROS.filter((l) => progreso.logros[l.id]).length}/${LOGROS.length}`))
  );

  // Meta diaria: anillo con el XP de hoy, y congeladores de racha
  const hecho = xpDeHoy();
  const pctMeta = Math.min(1, hecho / progreso.meta);
  const cumplida = hecho >= progreso.meta;
  const tarjetaMeta = el(
    'div',
    { class: 'meta' + (cumplida ? ' cumplida' : '') },
    el(
      'div',
      { class: 'anillo', role: 'img', 'aria-label': `Meta diaria: ${hecho} de ${progreso.meta} XP`, style: `--p:${Math.round(pctMeta * 100)}` },
      el('span', {}, cumplida ? '✓' : '🎯')
    ),
    el(
      'span',
      { class: 'juego-texto' },
      el('strong', {}, cumplida ? '¡Meta de hoy cumplida!' : 'Meta de hoy'),
      el('span', { class: 'juego-niveles' }, `${Math.min(hecho, 9999)} / ${progreso.meta} XP` + (progreso.congeladores ? ` · 🧊 ×${progreso.congeladores}` : ''))
    ),
    el('button', { class: 'ajustes-btn', type: 'button', 'aria-label': 'Ajustes', onclick: () => mostrarAjustes() }, '⚙️')
  );

  // Repaso inteligente: lo que toca repasar hoy y tus fallos
  const nPend = pendientesHoy().length;
  const nErr = misErrores().length;
  const filaRepaso = (clase, icono, titulo, desc, alPulsar) =>
    el(
      'button',
      { class: 'repaso fijo ' + clase, type: 'button', style: '--acento:#7a5af8', onclick: alPulsar },
      el('span', { class: 'repaso-icono' }, icono),
      el('span', { class: 'juego-texto' }, el('strong', {}, titulo), el('span', { class: 'juego-desc' }, desc)),
      el('span', { class: 'flecha', 'aria-hidden': 'true' }, '›')
    );
  const repasos = [
    nPend ? filaRepaso('', '🧠', 'Repaso del día', `${nPend} ${nPend === 1 ? 'pregunta toca' : 'preguntas tocan'} repasarse hoy`, () => iniciarRepasoGlobal('pendientes')) : null,
    nErr ? filaRepaso('', '🩹', 'Mis errores', `${nErr} ${nErr === 1 ? 'pregunta' : 'preguntas'} que fallaste y aún no dominas`, () => iniciarRepasoGlobal('errores')) : null,
  ];

  const tarjetas = CURSOS.map((curso, i) => {
    const total = niveles(curso).length;
    const hechos = hechosDe(curso);
    return el(
      'button',
      { class: 'juego', type: 'button', style: `--acento:${curso.color};--i:${i}`, onclick: () => mostrarMapa(curso) },
      el('span', { class: 'juego-icono' }, curso.icono),
      el(
        'span',
        { class: 'juego-texto' },
        el('strong', {}, curso.nombre),
        el('span', { class: 'juego-desc' }, curso.descripcion),
        el('span', { class: 'juego-barra' }, el('span', { class: 'juego-relleno', style: `width:${(hechos / total) * 100}%` })),
        el('span', { class: 'juego-niveles' }, `${hechos} de ${total} niveles`)
      ),
      el('span', { class: 'flecha', 'aria-hidden': 'true' }, '›')
    );
  });

  pintar(
    entrada,
    el('header', { class: 'cabecera' }, el('span', { class: 'logo' }, el('span', { class: 'logo-palo' }, '♥'), 'Entrenador de cartas'), marcador()),
    el(
      'main',
      { class: 'contenido' },
      fila,
      almacenamientoFallo
        ? el('p', { class: 'alerta', role: 'alert' }, 'Tu navegador no deja guardar el progreso (¿modo privado?). Puedes seguir, pero al cerrar se perderá.')
        : null,
      tarjetaMeta,
      tarjetaRango,
      repasos,
      el('h1', {}, 'Elige un juego'),
      tarjetas,
      filaRepaso('conteo', '⏱️', 'Entrena el conteo', 'Cartas a toda velocidad con el sistema Hi-Lo', () => mostrarConteo()),
      puedeInstalar() ? crearBotonInstalar() : null,
      el('p', { class: 'aviso' }, 'Contenido educativo. Sin dinero real. Solo para mayores de 18 años. Si el juego te preocupa, mira «Ayuda» en Ajustes.'),
      el('button', { class: 'enlace', type: 'button', onclick: () => mostrarAjustes() }, 'Ajustes, copia de seguridad y ayuda')
    )
  );
}

// ============================================================
// PANTALLA 2: mapa de niveles del juego
// ============================================================
const DESPLAZAMIENTOS = [0, 44, 70, 44, 0, -44, -70, -44]; // zigzag del camino, en píxeles

// recientes: ids de los niveles que acabas de completar o desbloquear (se animan al volver al mapa)
function mostrarMapa(curso, entrada = 'adelante', recientes = []) {
  alTeclear = null;
  const lista = niveles(curso);
  const siguiente = siguienteNivel(curso);
  const hechos = hechosDe(curso);

  const mensaje = !siguiente
    ? `¡Has completado todo el curso de ${curso.nombre}! Puedes repetir cualquier nivel para afianzar.`
    : hechos === 0
    ? 'Cada círculo es un nivel. Empieza por el que late: yo te explico todo antes de cada ejercicio.'
    : `Sigue con «${siguiente.titulo}». ¡Llevas ${hechos} de ${lista.length} niveles!`;
  const { fila, parrafo } = naiFila('feliz', mensaje);

  const pool = lista.filter((l) => progreso.completadas[l.id]).flatMap((l) => l.ejercicios);
  const botonRepaso =
    pool.length > 0
      ? el(
          'button',
          { class: 'repaso', type: 'button', onclick: () => iniciarRepaso(curso) },
          el('span', { class: 'repaso-icono' }, '🔁'),
          el(
            'span',
            { class: 'juego-texto' },
            el('strong', {}, 'Repaso rápido'),
            el('span', { class: 'juego-desc' }, `${Math.min(8, pool.length)} preguntas al azar de los niveles que ya has hecho`)
          ),
          el('span', { class: 'flecha', 'aria-hidden': 'true' }, '›')
        )
      : null;

  let nodoActual = null;
  let numero = 0;

  const crearNodo = (leccion, i) => {
    const hecha = !!progreso.completadas[leccion.id];
    const esActual = leccion === siguiente;
    const bloqueada = !hecha && !esActual;
    const reciente = recientes.includes(leccion.id);

    const boton = el(
      'button',
      {
        class: 'nodo' + (hecha ? ' hecho' : '') + (esActual ? ' actual' : '') + (bloqueada ? ' bloqueado' : ''),
        type: 'button',
        'aria-label': leccion.titulo + (bloqueada ? ' (bloqueado)' : ''),
        onclick: () => {
          if (!bloqueada) return mostrarIntro(curso, leccion);
          parrafo.textContent = `«${leccion.titulo}» está bloqueado. Termina primero el nivel anterior y lo desbloqueas.`;
          boton.classList.remove('sacudir');
          void boton.offsetWidth; // reinicia la animación si se pulsa varias veces seguidas
          boton.classList.add('sacudir');
          setTimeout(() => boton.classList.remove('sacudir'), 500);
        },
      },
      hecha ? '✓' : bloqueada ? '🔒' : leccion.icono
    );

    const envoltorio = el(
      'div',
      {
        class: 'nodo-envoltorio' + (reciente ? ' recien' : ''),
        style: `transform:translateX(${DESPLAZAMIENTOS[i % DESPLAZAMIENTOS.length]}px);--i:${numero++}`,
      },
      esActual ? el('span', { class: 'empezar' }, 'EMPEZAR') : null,
      boton,
      el('span', { class: 'nodo-titulo' }, leccion.titulo)
    );
    if (esActual) nodoActual = envoltorio;
    return envoltorio;
  };

  const unidades = curso.unidades.map((u, ui) =>
    el(
      'section',
      { class: 'unidad' },
      el('div', { class: 'unidad-banner', style: `--u:${ui}` }, el('h2', {}, u.titulo), el('p', {}, u.descripcion)),
      el('div', { class: 'camino' }, u.lecciones.map(crearNodo))
    )
  );

  pintar(
    entrada,
    el(
      'header',
      { class: 'cabecera' },
      el('button', { class: 'volver', type: 'button', 'aria-label': 'Volver a los juegos', onclick: () => mostrarInicio('atras') }, '←'),
      marcador()
    ),
    el(
      'main',
      { class: 'contenido mapa', style: `--acento:${curso.color}` },
      el('h1', {}, `${curso.icono} ${curso.nombre}`),
      el('p', { class: 'reglas' }, `Reglas del curso: ${curso.reglas}`),
      fila,
      botonRepaso,
      unidades
    )
  );

  // Si ya has avanzado, el mapa se desliza suavemente hasta tu nivel actual
  if (hechos > 0 && nodoActual && nodoActual.scrollIntoView) {
    setTimeout(() => {
      if (nodoActual.isConnected) nodoActual.scrollIntoView({ block: 'center', behavior: sinMovimiento() ? 'auto' : 'smooth' });
    }, 350);
  }
}

// Repaso rápido: preguntas al azar de los niveles ya completados (da algo de XP pero no desbloquea nada)
function iniciarRepaso(curso) {
  const pool = niveles(curso).filter((l) => progreso.completadas[l.id]).flatMap((l) => l.ejercicios);
  if (!pool.length) return;
  mostrarLeccion(curso, {
    id: 'repaso-' + curso.id,
    titulo: 'Repaso rápido',
    icono: '🔁',
    xp: 10,
    repaso: true,
    ejercicios: barajar(pool).slice(0, 8),
  });
}

// ============================================================
// PANTALLA: rango y logros
// ============================================================
function mostrarLogros() {
  alTeclear = null;
  const conseguidos = LOGROS.filter((l) => progreso.logros[l.id]).length;
  const rg = rangoDe(progreso.xp);
  const { fila } = naiFila(
    conseguidos ? 'feliz' : 'pensando',
    conseguidos
      ? `¡Llevas ${conseguidos} de ${LOGROS.length} logros! Eres ${rg.actual.nombre}.`
      : 'Todavía no tienes logros. Completa tu primer nivel y llegará el primero.'
  );
  pintar(
    'adelante',
    el(
      'header',
      { class: 'cabecera' },
      el('button', { class: 'volver', type: 'button', 'aria-label': 'Volver a los juegos', onclick: () => mostrarInicio('atras') }, '←'),
      marcador()
    ),
    el(
      'main',
      { class: 'contenido' },
      el('h1', {}, 'Tus logros'),
      fila,
      el(
        'div',
        { class: 'rangos' },
        RANGOS.map((r, i) => el('span', { class: 'rango-chip' + (i <= rg.indice ? ' on' : ''), style: `--i:${i}` }, `${r.icono} ${r.nombre}`))
      ),
      el(
        'div',
        { class: 'logros' },
        LOGROS.map((l, i) => {
          const on = !!progreso.logros[l.id];
          return el(
            'div',
            { class: 'logro' + (on ? ' on' : ''), style: `--i:${i}` },
            el('span', { class: 'logro-icono' }, on ? l.icono : '🔒'),
            el('strong', {}, l.titulo),
            el('span', { class: 'logro-desc' }, l.desc)
          );
        })
      )
    )
  );
}

// ============================================================
// PANTALLA 3: Nai explica el nivel antes de empezar
// ============================================================
function mostrarIntro(curso, leccion) {
  const empezar = () => mostrarLeccion(curso, leccion);
  alTeclear = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      empezar();
    }
  };

  const { fila } = naiFila('feliz', leccion.intro, 'grande');

  pintar(
    'adelante',
    el(
      'header',
      { class: 'cabecera-leccion' },
      el('button', { class: 'cerrar', type: 'button', 'aria-label': 'Volver al mapa', onclick: () => mostrarMapa(curso, 'atras') }, '✕')
    ),
    el(
      'main',
      { class: 'contenido centro', style: `--acento:${curso.color}` },
      el('p', { class: 'etiqueta' }, curso.nombre),
      el('h1', {}, `${leccion.icono} ${leccion.titulo}`),
      fila,
      el('p', { class: 'aviso' }, `${leccion.ejercicios.length} ejercicios · ${leccion.xp} XP`)
    ),
    el('div', { class: 'pie' }, el('button', { class: 'boton', type: 'button', onclick: empezar }, '¡Vamos!'))
  );
}

// ============================================================
// PANTALLA 4: la lección (ejercicios)
// ============================================================
function mostrarLeccion(curso, leccion) {
  let cola = leccion.ejercicios.map(preparar);
  let idx = 0;
  let elegida = null;
  let anchoPrevio = 0; // para que la barra de progreso avance suave en vez de saltar
  const fallados = {};
  const vistos = {}; // para apuntar en la repetición espaciada solo el primer intento de cada ejercicio
  let orden = []; // ejercicios "ordenar": posiciones de las fichas ya colocadas
  const salir = () => (curso.global ? mostrarInicio('atras') : mostrarMapa(curso, 'atras'));

  function elegir(i) {
    if (elegida !== null) return;
    const ejercicio = cola[idx];
    elegida = i;
    if (i !== ejercicio.correcta) fallados[ejercicio.id] = true;
    if (!vistos[ejercicio.id]) {
      vistos[ejercicio.id] = true;
      registrarRespuesta(ejercicio.id, i === ejercicio.correcta);
      guardarProgreso();
    }
    dibujar('sin'); // misma pregunta: solo aparece la explicación, no se re-anima la pantalla
    if (i === ejercicio.correcta) {
      const tecla = raiz.querySelector('.opcion.bien .tecla');
      if (tecla) {
        const r = tecla.getBoundingClientRect();
        chispas(r.left + r.width / 2, r.top + r.height / 2, 12);
      }
    }
  }

  function continuar() {
    const ejercicio = cola[idx];
    // Si fallas, el ejercicio vuelve al final de la lección
    if (elegida !== ejercicio.correcta) cola = cola.concat([preparar(ejercicio)]);

    if (idx + 1 >= cola.length) {
      const total = leccion.ejercicios.length;
      const nFallados = Object.keys(fallados).length;
      finalizarLeccion(curso, leccion, Math.round(((total - nFallados) / total) * 100));
      return;
    }
    idx += 1;
    elegida = null;
    orden = [];
    dibujar('ejercicio');
  }

  function dibujar(entrada) {
    const ejercicio = cola[idx];
    const respondido = elegida !== null;
    const acierto = respondido && elegida === ejercicio.correcta;

    // Nai lee la pregunta y reacciona a tu respuesta
    const estadoNai = !respondido ? 'pensando' : acierto ? 'feliz' : 'triste';
    const { fila, parrafo } = naiFila(estadoNai, ejercicio.pregunta, 'pequena', respondido);
    parrafo.className = 'pregunta';

    // Ejercicio de ordenar: pulsa las fichas en orden; pulsa una colocada para quitarla
    let tablero = null;
    if (ejercicio.tipo === 'ordenar') {
      const n = ejercicio.elementos.length;
      const correcto = orden.length === n && orden.every((v, k) => v === k);
      const ficha = (pos, texto, colocada, k) =>
        el(
          'button',
          {
            class: 'ficha' + (colocada ? ' colocada' : '') + (respondido ? (correcto ? ' bien' : ' mal') : ''),
            type: 'button',
            disabled: respondido ? '' : null,
            'aria-label': colocada ? `Quitar ${texto}, puesto ${k + 1}` : `Colocar ${texto}`,
            onclick: () => {
              if (respondido) return;
              orden = colocada ? orden.filter((v) => v !== pos) : orden.concat([pos]);
              dibujar('sin');
              const f = raiz.querySelector('.ordenar .boton, .ordenar-banco .ficha, .ordenar-lista .ficha');
              if (f) f.focus({ preventScroll: true });
            },
          },
          colocada ? el('span', { class: 'ficha-n' }, String(k + 1)) : null,
          texto
        );
      const colocadas = orden.map((pos, k) => ficha(pos, ejercicio.elementos[pos], true, k));
      const banco = ejercicio.mezcla.filter((pos) => !orden.includes(pos)).map((pos) => ficha(pos, ejercicio.elementos[pos], false, 0));
      tablero = el(
        'div',
        { class: 'ordenar' },
        el('p', { class: 'ordenar-etiqueta' }, 'Tu orden'),
        el('div', { class: 'ordenar-lista' }, colocadas.length ? colocadas : el('span', { class: 'ordenar-vacio' }, 'Pulsa las fichas en el orden correcto')),
        banco.length ? el('p', { class: 'ordenar-etiqueta' }, 'Fichas') : null,
        el('div', { class: 'ordenar-banco' }, banco),
        !respondido && orden.length === n
          ? el('button', { class: 'boton', type: 'button', onclick: () => elegir(correcto ? 0 : -1) }, 'Comprobar')
          : null
      );
    }

    const opciones = ejercicio.opciones.map((texto, i) => {
      let clase = 'opcion';
      if (respondido && i === ejercicio.correcta) clase += ' bien';
      else if (respondido && i === elegida) clase += ' mal';
      return el(
        'button',
        { class: clase, type: 'button', style: `--i:${i}`, onclick: () => elegir(i) },
        el('span', { class: 'tecla' }, String(i + 1)),
        texto
      );
    });

    const feedback = respondido
      ? el(
          'div',
          { class: 'feedback ' + (acierto ? 'bien' : 'mal'), role: 'status', 'aria-live': 'polite' },
          el(
            'h3',
            {},
            acierto
              ? elegirAlAzar(['¡Genial!', '¡Eso es!', '¡Muy bien!', '¡Correcto!'])
              : elegirAlAzar(['¡Casi!', 'Ups, esa no era.', 'No pasa nada.'])
          ),
          acierto
            ? null
            : el('p', { class: 'correcta' }, `Respuesta correcta: ${ejercicio.tipo === 'ordenar' ? ejercicio.elementos.join(' → ') : ejercicio.opciones[ejercicio.correcta]}`),
          el('p', {}, ejercicio.explicacion),
          el('button', { class: 'boton', type: 'button', onclick: continuar }, 'Continuar')
        )
      : null;

    // La barra avanza en cuanto aciertas, y arranca desde donde estaba (no desde cero)
    const objetivo = (idx + (acierto ? 1 : 0)) / cola.length;
    const relleno = el('div', { class: 'barra-relleno', style: `transform:scaleX(${anchoPrevio})` });
    const cambiaBarra = objetivo !== anchoPrevio;
    anchoPrevio = objetivo;

    pintar(
      entrada,
      el(
        'header',
        { class: 'cabecera-leccion' },
        el('button', { class: 'cerrar', type: 'button', 'aria-label': 'Salir de la lección', onclick: salir }, '✕'),
        el(
          'div',
          { class: 'barra', style: `--acento:${curso.color}`, role: 'progressbar', 'aria-label': 'Progreso de la lección', 'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-valuenow': String(Math.round(objetivo * 100)) },
          relleno
        )
      ),
      el('main', { class: 'contenido' }, fila, situacion(ejercicio), tablero, opciones),
      feedback
    );

    if (cambiaBarra) alSiguienteFotograma(() => (relleno.style.transform = `scaleX(${objetivo})`));
    else relleno.style.transform = `scaleX(${objetivo})`;

    alTeclear = (e) => {
      if (!respondido && /^[1-9]$/.test(e.key) && Number(e.key) <= ejercicio.opciones.length) {
        elegir(Number(e.key) - 1);
      } else if (respondido && e.key === 'Enter') {
        e.preventDefault();
        continuar();
      } else if (!respondido && ejercicio.tipo === 'ordenar' && e.key === 'Enter' && orden.length === ejercicio.elementos.length) {
        e.preventDefault();
        elegir(orden.every((v, k) => v === k) ? 0 : -1);
      }
    };
  }

  dibujar('adelante');
}

// ============================================================
// PANTALLA 5: resultado del nivel
// ============================================================
function finalizarLeccion(curso, leccion, precision) {
  const rangoAntes = rangoDe(progreso.xp).indice;
  const yaHecha = !!progreso.completadas[leccion.id];

  // Un repaso da XP según tus aciertos y no marca niveles como hechos
  const xp = leccion.repaso ? Math.round((leccion.xp * precision) / 100) : leccion.xp;
  const actividad = registrarActividad(xp);
  if (leccion.repaso) progreso.repasos = (progreso.repasos || 0) + 1;
  else progreso.completadas[leccion.id] = true;
  if (precision === 100 && !leccion.repaso) progreso.perfectos = (progreso.perfectos || 0) + 1;
  const logros = calcularLogros();
  guardarProgreso();

  const nuevoRango = rangoDe(progreso.xp);
  const siguiente = siguienteNivel(curso);
  const nuevoNivel = !leccion.repaso && !yaHecha;
  mostrarResultado(curso, leccion, precision, {
    xp,
    desbloqueado: nuevoNivel ? siguiente : null,
    cursoCompleto: nuevoNivel && !siguiente,
    logros,
    actividad,
    rangoNuevo: nuevoRango.indice > rangoAntes ? nuevoRango.actual : null,
  });
}

function mostrarResultado(curso, leccion, precision, extra) {
  // Al volver al mapa se animan el nivel que acabas de completar y el que se desbloquea
  const volver = () =>
    curso.global ? mostrarInicio('atras') : mostrarMapa(curso, 'atras', leccion.repaso ? [] : [leccion.id].concat(extra.desbloqueado ? [extra.desbloqueado.id] : []));
  alTeclear = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      volver();
    }
  };

  const mensaje =
    leccion.repaso && precision === 100
      ? '¡Repaso perfecto! Se nota que lo tienes claro.'
      : precision === 100
      ? '¡Perfecto! Ni un solo fallo. Así se aprende.'
      : precision >= 67
      ? '¡Muy bien! Lo has hecho genial.'
      : 'Nivel completado. Los fallos también enseñan: repítelo cuando quieras para afianzar.';
  const nEstrellas = precision === 100 ? 3 : precision >= 67 ? 2 : 1;
  const { fila } = naiFila(precision >= 67 ? 'celebrando' : 'feliz', mensaje, 'grande');

  // Las líneas van apareciendo una tras otra (--i) y los números suben desde 0
  const linea = (i, clase, contenido) => el('p', { class: clase + ' aparece', style: `--i:${i}` }, contenido);
  const xp = linea(2, 'resultado-dato', '');
  const prec = linea(3, 'resultado-dato', '');
  let orden = 4;
  const notas = [];
  if (rachaVigente() > 0) notas.push(linea(orden++, 'resultado-dato', `🔥 Racha: ${rachaVigente()} ${rachaVigente() === 1 ? 'día' : 'días'}`));
  const act = extra.actividad || {};
  if (act.metaCumplida) notas.push(linea(orden++, 'resultado-nuevo', '🎯 ¡Meta diaria cumplida!'));
  if (act.congeladorUsado) notas.push(linea(orden++, 'resultado-dato', '🧊 Un congelador ha salvado tu racha'));
  if (act.congeladorGanado) notas.push(linea(orden++, 'resultado-nuevo', '🧊 ¡Has ganado un congelador de racha!'));
  if (extra.rangoNuevo) notas.push(linea(orden++, 'resultado-nuevo', `${extra.rangoNuevo.icono} ¡Nuevo rango: ${extra.rangoNuevo.nombre}!`));
  if (extra.desbloqueado) notas.push(linea(orden++, 'resultado-nuevo', `Has desbloqueado «${extra.desbloqueado.titulo}»`));
  if (extra.cursoCompleto) notas.push(linea(orden++, 'resultado-nuevo', `¡Has completado el curso de ${curso.nombre}!`));
  (extra.logros || []).forEach((l) => notas.push(linea(orden++, 'resultado-logro', `${l.icono} Logro: ${l.titulo}`)));

  pintar(
    'adelante',
    el(
      'main',
      { class: 'contenido centro', style: `--acento:${curso.color}` },
      el('h1', { class: 'resultado-titulo' }, leccion.repaso ? '¡Repaso terminado!' : '¡Nivel completado!'),
      el(
        'div',
        { class: 'estrellas', 'aria-hidden': 'true' },
        [0, 1, 2].map((n) => el('span', { class: 'estrella' + (n < nEstrellas ? ' on' : ''), style: `--i:${n}` }, '★'))
      ),
      fila,
      xp,
      prec,
      notas
    ),
    el('div', { class: 'pie' }, el('button', { class: 'boton', type: 'button', onclick: volver }, 'Continuar')),
    precision >= 67 || extra.cursoCompleto || extra.rangoNuevo ? confeti(extra.cursoCompleto || extra.rangoNuevo ? 80 : 40) : null
  );

  contar(xp, extra.xp, (v) => `+${v} XP`, 350);
  contar(prec, precision, (v) => `Precisión: ${v}%`, 550);
}

