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
  stats: { u: {}, t: {}, d: {}, s: {} }, // estadísticas: aciertos y fallos por tema, tipo de pregunta y día ([aciertos, fallos])
  srs: {},                        // repetición espaciada: id del ejercicio -> { caja, prox, fallos }
  conteo: { sesiones: 0, mejor: 0 }, // entrenador de conteo
  rapida: { partidas: 0, mejor: 0 }, // partida rápida de 60 segundos
  ajustes: { letra: 'normal', calma: false, sonido: true, vibracion: true },
  bienvenida: false,              // true cuando ya has visto la pantalla de bienvenida
  vip: { hasta: 0 },              // membresía VIP: instante (ms) hasta el que está activa
  fichas: 20,                     // moneda de la tienda
  energia: { n: 2, t: 0, dia: null }, // niveles que puedes empezar; t = cuándo empezó a recargarse
  cofres: {},                     // cofres del mapa ya abiertos
  reto: null,                     // reto semanal: { semana, id, n, dias, cobrado }
  retosHechos: 0,                 // retos semanales cobrados
  semanaXp: { semana: null, xp: 0 }, // XP de la semana en curso (ranking con amigos)
  social: { alias: '', amigos: 0 }, // nombre en el ranking y cuántos amigos tienes
  tienda: { comprados: [], equipado: { fondo: 'clasico', baraja: 'clasica', espanola: 'clasica', nai: 'clasico' } }, // cosméticos
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
  p.ultimoCurso = typeof p.ultimoCurso === 'string' ? p.ultimoCurso.slice(0, 40) : null;
  p.completadas = obj(p.completadas, {});
  p.logros = obj(p.logros, {});
  p.srs = obj(p.srs, {});
  const st = obj(p.stats, {});
  const pares = (o, max) => { const r = {}; for (const k of Object.keys(obj(o, {})).slice(-max)) { const a = o[k]; if (Array.isArray(a) && a.length === 2 && a.every((x) => Number.isFinite(x) && x >= 0)) r[String(k).slice(0, 40)] = [Math.floor(a[0]), Math.floor(a[1])]; } return r; };
  p.stats = { u: pares(st.u, 80), t: pares(st.t, 20), d: pares(st.d, 31), s: pares(st.s, 40) };
  p.xpHoy = Object.assign({ dia: null, xp: 0 }, obj(p.xpHoy, {}));
  p.conteo = Object.assign({ sesiones: 0, mejor: 0 }, obj(p.conteo, {}));
  p.rapida = Object.assign({ partidas: 0, mejor: 0 }, obj(p.rapida, {}));
  p.rapida.partidas = num(p.rapida.partidas, 0);
  p.rapida.mejor = num(p.rapida.mejor, 0);
  p.ajustes = Object.assign({ letra: 'normal', calma: false, sonido: true, vibracion: true }, obj(p.ajustes, {}));
  p.vip = { hasta: p.vip && Number.isFinite(p.vip.hasta) && p.vip.hasta > 0 ? Math.floor(p.vip.hasta) : 0 };
  p.fichas = num(p.fichas, 20);
  const en = obj(p.energia, {});
  p.energia = { n: Math.min(6, num(en.n, 2)), t: num(en.t, 0), dia: typeof en.dia === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(en.dia) ? en.dia : null };
  p.cofres = obj(p.cofres, {});
  const rt = obj(p.reto, null);
  p.reto = rt && typeof rt.semana === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(rt.semana) && typeof rt.id === 'string' ? { semana: rt.semana, id: rt.id.slice(0, 20), n: num(rt.n, 0), dias: Array.isArray(rt.dias) ? rt.dias.filter((d) => typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d)).slice(0, 7) : [], cobrado: !!rt.cobrado } : null;
  p.retosHechos = num(p.retosHechos, 0);
  const sx = obj(p.semanaXp, {});
  p.semanaXp = { semana: typeof sx.semana === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(sx.semana) ? sx.semana : null, xp: num(sx.xp, 0) };
  const so = obj(p.social, {});
  p.social = { alias: typeof so.alias === 'string' ? so.alias.replace(/[^\p{L}\p{N} ._-]/gu, '').trim().slice(0, 20) : '', amigos: num(so.amigos, 0) };
  const tn = obj(p.tienda, {});
  const idOk = (s) => typeof s === 'string' && /^[a-z]{3,8}:[a-z]{3,12}$/.test(s);
  const eq = obj(tn.equipado, {});
  const sl = (s) => (typeof s === 'string' && /^[a-z]{3,12}$/.test(s) ? s : null);
  p.tienda = { comprados: Array.isArray(tn.comprados) ? tn.comprados.filter(idOk).slice(0, 60) : [], equipado: { fondo: sl(eq.fondo) || 'clasico', baraja: sl(eq.baraja) || 'clasica', espanola: sl(eq.espanola) || 'clasica', nai: sl(eq.nai) || 'clasico' } };
  // quien ya tenía progreso no necesita la bienvenida
  p.bienvenida = p.bienvenida === true || p.xp > 0 || Object.keys(p.completadas).length > 0;
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
  if (typeof nubeProgramar === 'function') nubeProgramar();
  if (typeof pushActualizar === 'function') pushActualizar();
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
  if (typeof sumarXpSemana === 'function') { sumarXpSemana(xp); retoSuma('dias'); }
  res.metaCumplida = antes < progreso.meta && antes + xp >= progreso.meta;
  return res;
}

// ---------- repetición espaciada (cajas de Leitner) ----------
// Cada ejercicio que respondes se apunta: si aciertas sube de caja y tarda más en volver; si fallas, vuelve hoy.
const INTERVALOS_DIAS = [0, 1, 2, 4, 8, 16];
// Datos de un ejercicio para las estadísticas (juego, unidad y tipo), incluidos los niveles Oro. Se resuelve al vuelo: no genera niveles de más.
const META_CACHE = {};
function metaEjercicio(id) {
  if (META_CACHE[id]) return META_CACHE[id];
  const m = /^(oro-)?([a-z]{2}-u?\d+-\d+)-/.exec(id);
  const n = m && INDICE_NIVELES[m[2]];
  const nivel = n && (m[1] ? (typeof ORO !== 'undefined' ? ORO[m[2]] : null) : n.nivel);
  const e = nivel && nivel.ejercicios.find((x) => x.id === id);
  return e ? (META_CACHE[id] = { curso: n.curso.id, u: n.u, tipo: (e.base || e).tipo }) : undefined;
}
function registrarEstadistica(id, acierto) {
  const m = metaEjercicio(id);
  if (!m) return;
  const suma = (o, k) => { const a = o[k] || [0, 0]; a[acierto ? 0 : 1] += 1; o[k] = a; };
  suma(progreso.stats.u, m.curso + '|' + m.u);
  suma(progreso.stats.t, m.tipo);
  suma(progreso.stats.d, hoy());
  const dias = Object.keys(progreso.stats.d).sort();
  while (dias.length > 31) delete progreso.stats.d[dias.shift()];
}
// Apunta el resultado en una situación concreta (ver js/situaciones.js)
function registrarSituacion(clave, acierto) {
  const a = progreso.stats.s[clave] || [0, 0];
  a[acierto ? 0 : 1] += 1;
  progreso.stats.s[clave] = a;
}
function registrarRespuesta(id, acierto) {
  registrarEstadistica(id, acierto);
  if (acierto && typeof retoSuma === 'function') retoSuma('aciertos');
  const ind = INDICE_EJERCICIOS[id];
  if (ind && ind.ejercicio.tipo !== 'relampago') situacionesDe(ind.ejercicio).forEach((c) => registrarSituacion(c, acierto)); // el relámpago apunta cada decisión por separado
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
const esVip = () => progreso.vip.hasta > Date.now();
const multVip = () => (esVip() ? 2 : 1); // el pase VIP da el doble de XP y de fichas
const niveles = (curso) => curso.unidades.flatMap((u) => u.lecciones);
const hechosDe = (curso) => niveles(curso).filter((l) => progreso.completadas[l.id]).length;
const siguienteNivel = (curso) => niveles(curso).find((l) => !progreso.completadas[l.id]) || null;
// id de ejercicio -> el ejercicio y su curso (para armar repasos que mezclan juegos)
// Los niveles generados se crean al usarlos, así que el índice se resuelve por id sin generar nada de más.
const INDICE_NIVELES = {};
CURSOS.forEach((c) => c.unidades.forEach((u, ui) => u.lecciones.forEach((l) => (INDICE_NIVELES[l.id] = { nivel: l, curso: c, u: ui }))));
const INDICE_CACHE = {};
function buscarEjercicio(id) {
  if (typeof id !== 'string') return undefined;
  if (INDICE_CACHE[id]) return INDICE_CACHE[id];
  const m = /^([a-z]{2}-u?\d+-\d+)-/.exec(id);
  const n = m && INDICE_NIVELES[m[1]];
  const e = n && n.nivel.ejercicios.find((x) => x.id === id);
  return e ? (INDICE_CACHE[id] = { ejercicio: e, curso: n.curso }) : undefined;
}
const INDICE_EJERCICIOS = new Proxy({}, { get: (_, id) => buscarEjercicio(id), has: (_, id) => !!buscarEjercicio(id) });
// Niveles ya alcanzados (hechos y los siguientes): de ahí salen los repasos y las partidas rápidas, sin generar los 600 niveles
function nivelesAlcanzados(extra = 3) {
  return CURSOS.flatMap((c) => { const l = niveles(c); let ult = -1; l.forEach((x, i) => { if (progreso.completadas[x.id]) ult = i; }); return l.slice(0, Math.max(extra, ult + 1 + extra)); });
}
const ejerciciosAlcanzados = () => nivelesAlcanzados().flatMap((l) => l.ejercicios);
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
  // Ejercicios interactivos: no usan "opciones"; la app comprueba la respuesta y llama a elegir(0) si es correcta
  if (e.tipo === 'seleccionar' || e.tipo === 'numero') return Object.assign({}, e, { opciones: [], correcta: 0 });
  if (e.tipo === 'emparejar') {
    let mezcla; // orden en que se muestra la columna de la derecha (nunca ya resuelto)
    do mezcla = barajar(e.pares.map((_, i) => i));
    while (mezcla.every((v, i) => v === i));
    return Object.assign({}, e, { opciones: [], correcta: 0, mezcla });
  }
  if (e.tipo === 'deslizador') return Object.assign({}, e, { opciones: [], correcta: 0 });
  if (e.tipo === 'clasificar') {
    let mezcla; // orden en que van saliendo los elementos (nunca ya "ordenados" por categoría)
    do mezcla = barajar(e.elementos.map((_, i) => i));
    while (e.elementos.length > 2 && mezcla.every((v, k) => k === 0 || e.elementos[v][1] >= e.elementos[mezcla[k - 1]][1]));
    return Object.assign({}, e, { opciones: [], correcta: 0, mezcla });
  }
  if (e.tipo === 'rellenar') return Object.assign({}, e, { opciones: [], correcta: 0, mezcla: barajar(e.banco.map((_, i) => i)) });
  if (e.tipo === 'relampago') return Object.assign({}, e, { respuestas: e.opciones, opciones: [], correcta: 0, mezcla: barajar(e.items.map((_, i) => i)) });
  // Formas nuevas (data/formas-interactivas.js): el ejercicio original va en `base`
  if (e.tipo === 'vf') return Object.assign({}, e, { opciones: [], correcta: 0 });
  if (e.tipo === 'duelo') return Object.assign({}, e, { par: barajar([e.acierto, e.falsa]), opciones: [], correcta: 0 });
  if (e.tipo === 'eliminar') { const p = preparar(e.base); return Object.assign({}, e, { lista: p.opciones, buena: p.correcta, opciones: [], correcta: 0 }); }
  if (e.tipo === 'reloj') return Object.assign({}, preparar(e.base), { tipo: 'reloj', id: e.id, base: e.base, segundos: e.segundos });
  if (e.tipo === 'construir') {
    let mezcla;
    do mezcla = barajar(e.banco.map((_, i) => i));
    while (mezcla.every((v, i) => e.banco[v] === e.palabras[i]));
    return Object.assign({}, e, { mezcla, opciones: [], correcta: 0 });
  }
  if (e.tipo === 'memoria') return Object.assign({}, e, { mezcla: barajar(e.pares.flatMap((_, i) => [2 * i, 2 * i + 1])), opciones: [], correcta: 0 });
  if (e.tipo === 'errata') return Object.assign({}, e, { opciones: [], correcta: 0 });
  if (e.tipo === 'accion' || e.opciones.length < 2) return e;
  const correcta = e.opciones[e.correcta];
  const opciones = e.opciones.every(esCifra)
    ? e.opciones.slice().sort((a, b) => (valorCifra(a) - valorCifra(b)) * (Math.random() < 0.5 ? 1 : -1))
    : barajar(e.opciones);
  return Object.assign({}, e, { opciones, correcta: opciones.indexOf(correcta) });
}

// Texto de la respuesta correcta que se enseña al fallar
function respuestaTexto(e) {
  if (e.tipo === 'ordenar') return e.elementos.join(' → ');
  if (e.tipo === 'seleccionar') return e.correctas.map((i) => e.cartas[i]).join(', ');
  if (e.tipo === 'numero') return String(e.respuesta) + (e.unidad ? ' ' + e.unidad : '');
  if (e.tipo === 'emparejar') return e.pares.map((p) => `${p[0]} = ${p[1]}`).join(' · ');
  if (e.tipo === 'clasificar') return e.categorias.map((c, k) => `${c}: ${e.elementos.filter((x) => x[1] === k).map((x) => x[0]).join(', ')}`).join(' · ');
  if (e.tipo === 'deslizador') return `${e.respuesta}${e.unidad ? ' ' + e.unidad : ''}` + (e.tolerancia ? ` (vale de ${e.respuesta - e.tolerancia} a ${e.respuesta + e.tolerancia})` : '');
  if (e.tipo === 'relampago') return e.items.map(([t, k, et]) => `${et ? et + ': ' : ''}${t} → ${e.respuestas ? e.respuestas[k] : e.opciones[k]}`).join(' · ');
  if (e.tipo === 'rellenar') { let k = 0; return e.texto.replace(/\{\}/g, () => e.huecos[k++]); }
  if (e.tipo === 'vf') return e.verdadero ? 'Verdadero' : `Falso (lo correcto era «${e.base.opciones[e.base.correcta]}»)`;
  if (e.tipo === 'duelo') return e.acierto;
  if (e.tipo === 'eliminar') return e.lista[e.buena];
  if (e.tipo === 'construir') return e.palabras.join(' ');
  if (e.tipo === 'memoria') return e.pares.map((p) => `${p[0]} = ${p[1]}`).join(' · ');
  if (e.tipo === 'errata') return e.elementos.join(' → ');
  return e.opciones[e.correcta];
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
  { id: 'semana', icono: '📅', titulo: 'Una semana', desc: 'Consigue una racha de 7 días', cumple: () => rachaVigente() >= 7 },
  { id: 'mes', icono: '🗓️', titulo: 'Un mes', desc: 'Consigue una racha de 30 días', cumple: () => rachaVigente() >= 30 },
  { id: 'xp-500', icono: '🌟', titulo: '500 XP', desc: 'Llega a 500 puntos de experiencia', cumple: (p) => p.xp >= 500 },
  { id: 'xp-2000', icono: '💫', titulo: '2000 XP', desc: 'Llega a 2000 puntos de experiencia', cumple: (p) => p.xp >= 2000 },
  { id: 'repasos-10', icono: '🧠', titulo: 'Memoria de elefante', desc: 'Haz 10 repasos', cumple: (p) => (p.repasos || 0) >= 10 },
  { id: 'perfectos-5', icono: '🎯', titulo: 'Puntería', desc: 'Termina 5 niveles sin fallos', cumple: (p) => (p.perfectos || 0) >= 5 },
  { id: 'rapida-20', icono: '⚡', titulo: 'Rayo', desc: 'Consigue 20 aciertos en una partida rápida', cumple: (p) => p.rapida.mejor >= 20 },
  { id: 'reto-1', icono: '🏅', titulo: 'Retador', desc: 'Cumple tu primer reto semanal', cumple: (p) => (p.retosHechos || 0) >= 1 },
  { id: 'reto-5', icono: '🏆', titulo: 'Imparable', desc: 'Cumple 5 retos semanales', cumple: (p) => (p.retosHechos || 0) >= 5 },
  { id: 'sociable', icono: '🤝', titulo: 'Sociable', desc: 'Añade a un amigo al ranking', cumple: (p) => (p.social && p.social.amigos) >= 1 },
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
    else nodo.setAttribute(clave, (clave === 'aria-label' || clave === 'title') && typeof valor === 'string' ? sinEmojis(valor) : valor);
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

// Sonido al pulsar (las opciones de test suenan al acertar o fallar, no al tocarlas)
document.addEventListener('pointerdown', (e) => {
  if (!e.target.closest) return;
  const b = e.target.closest('.boton, .juego, .rango, .repaso, .instalar, .ficha, .par, .seg, .carta-pick, .conteo-paso, .interruptor, .nodo, .cerrar, .volver, .ajustes-btn');
  if (b && !b.disabled && typeof sonido === 'function') sonido('toque');
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
  if (typeof barra === 'function') barra(null); // la barra inferior solo se muestra en las pantallas principales
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
// Las preguntas del mus se ven con la baraja española (js/baraja-espanola.js); el resto, con la francesa
let barajaEspanola = false;
function carta(valor, n = 0) {
  const texto = String(valor);
  if (barajaEspanola && esCartaMus(texto)) return cartaEspanola(texto, n);
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
    el('span', { class: 'dato', title: 'Racha' }, el('span', { class: 'emo emo-llama' }, '🔥'), ` ${rachaVigente()}`),
    el('span', { class: 'dato dato-energia', title: 'Energía' }, '⚡', esVip() ? ' ∞' : ` ${energiaActual()}`),
    el('span', { class: 'dato', title: 'Fichas' }, '🪙', ` ${progreso.fichas}`),
    el('span', { class: 'dato' + (subio ? ' sube' : ''), title: 'XP', 'aria-label': `${progreso.xp} XP` }, el('span', { class: 'emo emo-estrella' }, '⭐'), ` ${progreso.xp}`)
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
let seccionInicio = 'juegos';
function mostrarInicio(entrada = 'fundido') {
  alTeclear = null;

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
      el('span', { class: 'juego-niveles' }, rg.siguiente ? `${progreso.xp} / ${rg.siguiente.desde} XP` : '¡Has llegado al rango máximo!')
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
  );

  // Repaso inteligente: lo que toca repasar hoy y tus fallos
  const nPend = pendientesHoy().length;
  const nErr = misErrores().length;
  const filaRepaso = (clase, icono, titulo, desc, alPulsar) =>
    el(
      'button',
      { class: 'repaso fijo ' + clase + (clase === 'conteo' ? '' : ' mini'), type: 'button', style: '--acento:#3a7be0', onclick: alPulsar },
      el('span', { class: 'repaso-icono' }, icono),
      el('span', { class: 'juego-texto' }, el('strong', {}, titulo), el('span', { class: 'juego-desc' }, desc)),
      el('span', { class: 'flecha', 'aria-hidden': 'true' }, '›')
    );
  const plan = progreso.xp > 0 && typeof planSesionHoy === 'function' ? planSesionHoy() : null;
  const repasos = [
    plan && plan.ids.length >= 5 ? filaRepaso('sesion-hoy', '🎯', 'Sesión de hoy · 5 min', plan.resumen, () => iniciarSesionHoy()) : null,
    nPend ? filaRepaso('', '🧠', 'Repaso del día', `${nPend} ${nPend === 1 ? 'pregunta toca' : 'preguntas tocan'} repasarse hoy`, () => iniciarRepasoGlobal('pendientes')) : null,
    nErr ? filaRepaso('', '🩹', 'Mis errores', `${nErr} ${nErr === 1 ? 'pregunta' : 'preguntas'} que fallaste y aún no dominas`, () => iniciarRepasoGlobal('errores')) : null,
  ];

  // Racha en peligro: tienes racha y hoy aún no has practicado (una partida rápida de 1 minuto la salva)
  const enPeligro = rachaVigente() > 0 && progreso.ultimoDia !== hoy();
  const tarde = new Date().getHours() >= 18;
  const avisoRacha = enPeligro
    ? el('button', { class: 'racha-aviso' + (tarde ? ' urgente' : ''), type: 'button', onclick: () => iniciarPartidaRapida() },
        el('span', { class: 'racha-aviso-icono' }, '🔥'),
        el('span', { class: 'juego-texto' },
          el('strong', {}, tarde ? `¡Tu racha de ${rachaVigente()} ${rachaVigente() === 1 ? 'día' : 'días'} se acaba esta noche!` : `Tu racha de ${rachaVigente()} ${rachaVigente() === 1 ? 'día' : 'días'} te espera`),
          el('span', { class: 'juego-desc' }, 'Sálvala con una partida rápida de 1 minuto')),
        el('span', { class: 'flecha', 'aria-hidden': 'true' }, '›'))
    : null;

  const tarjetas = CURSOS.map((curso, i) => {
    const total = niveles(curso).length;
    const hechos = hechosDe(curso);
    return el(
      'button',
      { class: 'juego', type: 'button', 'data-curso': curso.id, style: `--acento:${curso.color};--i:${i}`, onclick: () => mostrarMapa(curso) },
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

  // Dos secciones: los juegos y, aparte, las herramientas de práctica
  const abrirMas = (f) => () => { seccionInicio = 'mas'; f(); };
  const panelJuegos = el('div', { class: 'panel-inicio', id: 'panel-juegos', role: 'tabpanel', 'aria-labelledby': 'pestana-juegos' }, el('h1', {}, 'Elige tu mesa'), tarjetas);
  const panelMas = el('div', { class: 'panel-inicio', id: 'panel-mas', role: 'tabpanel', 'aria-labelledby': 'pestana-mas' },
    repasos.some(Boolean) || typeof tarjetaReto === 'function'
      ? el('section', { class: 'para-hoy', 'aria-label': 'Para hoy' },
          el('h2', {}, 'Para hoy'),
          repasos.some(Boolean) ? el('div', { class: 'repasos-mini' }, repasos) : null,
          typeof tarjetaReto === 'function' ? tarjetaReto(() => mostrarInicio('sin')) : null)
      : null,
    el('h2', { class: 'herr-titulo' }, 'Herramientas'),
    el('div', { class: 'herramientas' },
    filaRepaso('conteo', '⚡', 'Partida rápida', progreso.rapida.mejor ? `60 segundos, todas las que puedas · Récord: ${progreso.rapida.mejor}` : '60 segundos: contesta todas las que puedas', abrirMas(() => iniciarPartidaRapida())),
    filaRepaso('conteo', '🃏', 'Simulador de blackjack', progreso.simulador && progreso.simulador.mejor ? `${SIM_MANOS} manos con corrección · Mejor sesión: ${progreso.simulador.mejor} %` : `${SIM_MANOS} manos de verdad, con la estrategia básica corrigiéndote`, abrirMas(() => mostrarSimulador())),
    filaRepaso('conteo', '🧭', 'Test de nivel', 'Responde unas preguntas y empieza en el nivel que te toca', abrirMas(() => mostrarTestNivel())),
    filaRepaso('conteo', '⏱️', 'Entrena el conteo', 'Cartas a toda velocidad con el sistema Hi-Lo', abrirMas(() => mostrarConteo())),
    filaRepaso('conteo', '🤝', 'Ranking con amigos', progreso.social.alias ? `Tu XP de la semana: ${typeof xpDeLaSemana === 'function' ? xpDeLaSemana() : 0}` : 'Compite cada semana con tus amigos', abrirMas(() => mostrarAmigos())),
    filaRepaso('conteo', '📊', 'Mis estadísticas', 'Tus aciertos por juego y tus puntos débiles', abrirMas(() => mostrarEstadisticas()))
    )
  );
  const bloqueHoy = el('div', { class: 'bloque-hoy' }, heroInicio(), el('div', { class: 'resumen' }, tarjetaMeta, tarjetaRango));
  const elegir = (cual) => {
    panelJuegos.hidden = cual !== 'juegos';
    panelMas.hidden = cual !== 'mas';
    bloqueHoy.hidden = cual !== 'juegos';
    [['juegos', pestJuegos], ['mas', pestMas]].forEach(([k, b]) => { b.classList.toggle('activa', k === cual); b.setAttribute('aria-selected', String(k === cual)); b.tabIndex = k === cual ? 0 : -1; });
  };
  const pestJuegos = el('button', { class: 'pestana-inicio', id: 'pestana-juegos', type: 'button', role: 'tab', 'aria-controls': 'panel-juegos', onclick: () => elegir('juegos') }, 'Juegos');
  const pestMas = el('button', { class: 'pestana-inicio', id: 'pestana-mas', type: 'button', role: 'tab', 'aria-controls': 'panel-mas', onclick: () => elegir('mas') }, 'Practicar', (nPend + nErr) > 0 || (plan && plan.ids.length >= 5) ? el('span', { class: 'punto-aviso', 'aria-label': 'Tienes cosas pendientes' }) : null);
  const pestanasInicio = el('div', { class: 'pestanas-inicio', role: 'tablist', 'aria-label': 'Secciones del inicio' }, pestJuegos, pestMas);
  elegir(seccionInicio);
  seccionInicio = 'juegos'; // solo se recuerda la vuelta desde una de las herramientas

  pintar(
    entrada,
    el('header', { class: 'cabecera' }, logoMarca(), marcador()),
    el(
      'main',
      { class: 'contenido' },
      almacenamientoFallo
        ? el('p', { class: 'alerta', role: 'alert' }, 'Tu navegador no deja guardar el progreso (¿modo privado?). Puedes seguir, pero al cerrar se perderá.')
        : null,
      avisoRacha,
      bloqueHoy,
      pestanasInicio,
      panelJuegos,
      panelMas,
      puedeInstalar() ? crearBotonInstalar() : null,
      el('p', { class: 'aviso' }, 'Contenido educativo. Sin dinero real. Solo para mayores de 18 años. Si el juego te preocupa, mira «Ayuda» en la pestaña Ajustes.')
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
  if (progreso.ultimoCurso !== curso.id && !curso.global) { progreso.ultimoCurso = curso.id; guardarProgreso(); }
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

    // Ruta dorada: junto a cada nivel hay un nivel Oro (solo VIP), del lado donde hay más sitio
    const desplazamiento = DESPLAZAMIENTOS[i % DESPLAZAMIENTOS.length];
    const oro = typeof ORO !== 'undefined' ? ORO[leccion.id] : null;
    let botonOro = null;
    if (oro) {
      const vip = esVip();
      const oroHecho = !!progreso.completadas[oro.id];
      const libre = vip && hecha;
      const sacudir = () => {
        botonOro.classList.remove('sacudir');
        void botonOro.offsetWidth;
        botonOro.classList.add('sacudir');
        setTimeout(() => botonOro.classList.remove('sacudir'), 500);
      };
      botonOro = el(
        'button',
        {
          class: 'nodo-oro' + (desplazamiento > 0 ? ' izq' : '') + (oroHecho ? ' hecho' : libre ? ' libre' : '') + (vip ? '' : ' sin-vip'),
          type: 'button',
          title: oro.titulo,
          'aria-label': `Nivel Oro: ${oro.titulo}` + (oroHecho ? ' (completado)' : !vip ? ' (solo para VIP)' : !hecha ? ' (bloqueado)' : ''),
          onclick: () => {
            if (!vip) return mostrarPremium(() => mostrarMapa(curso, 'atras'));
            if (!hecha) {
              parrafo.textContent = `El nivel Oro de «${leccion.titulo}» se abre cuando completes el nivel normal.`;
              return sacudir();
            }
            mostrarIntro(curso, oro);
          },
        },
        oroHecho ? '✓' : '👑',
        !libre && !oroHecho ? el('span', { class: 'candado', 'aria-hidden': 'true' }, '🔒') : null
      );
    }

    const envoltorio = el(
      'div',
      {
        class: 'nodo-envoltorio' + (reciente ? ' recien' : ''),
        style: `transform:translateX(${desplazamiento}px);--i:${numero++}`,
      },
      esActual ? el('span', { class: 'empezar' }, 'EMPEZAR') : null,
      el('div', { class: 'nodo-fila' }, boton, botonOro),
      el('span', { class: 'nodo-titulo' }, leccion.titulo)
    );
    if (esActual) nodoActual = envoltorio;
    return envoltorio;
  };

  // Cofre del camino: uno cada CADA_COFRE niveles; se abre cuando completas el nivel anterior
  const crearCofre = (k) => {
    const id = idCofre(curso, k);
    const abierto = !!progreso.cofres[id];
    const listo = !abierto && !!progreso.completadas[lista[k * CADA_COFRE - 1].id];
    const boton = el(
      'button',
      {
        class: 'nodo cofre' + (abierto ? ' abierto' : listo ? ' listo' : ' bloqueado'),
        type: 'button',
        'aria-label': abierto ? 'Cofre abierto' : listo ? 'Cofre listo para abrir' : 'Cofre bloqueado',
        onclick: () => {
          if (listo) return mostrarCofre(curso, id, () => mostrarMapa(curso, 'atras'));
          parrafo.textContent = abierto ? 'Ya has abierto este cofre.' : 'Este cofre se abre al completar el nivel anterior.';
          boton.classList.remove('sacudir');
          void boton.offsetWidth;
          boton.classList.add('sacudir');
        },
      },
      abierto ? '📭' : listo ? '🎁' : '🔒'
    );
    return el('div', { class: 'nodo-envoltorio cofre-envoltorio', style: `--i:${numero++}` }, listo ? el('span', { class: 'empezar' }, '¡ABRIR!') : null, el('div', { class: 'nodo-fila' }, boton), el('span', { class: 'nodo-titulo' }, 'Cofre'));
  };
  const nodosDe = (u) =>
    u.lecciones.flatMap((l, i) => {
      const n = crearNodo(l, i);
      const pos = lista.indexOf(l) + 1;
      return pos % CADA_COFRE === 0 ? [n, crearCofre(pos / CADA_COFRE)] : [n];
    });

  const unidades = curso.unidades.map((u, ui) =>
    el(
      'section',
      { class: 'unidad' },
      el('div', { class: 'unidad-banner', style: `--u:${ui}` }, el('h2', {}, u.titulo), el('p', {}, u.descripcion)),
      el('div', { class: 'camino' }, nodosDe(u))
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
      typeof ORO !== 'undefined'
        ? el(
            'button',
            { class: 'banner-oro' + (esVip() ? ' activo' : ''), type: 'button', onclick: () => mostrarPremium(() => mostrarMapa(curso, 'atras')) },
            el('span', { class: 'banner-oro-icono', 'aria-hidden': 'true' }, '👑'),
            el('span', { class: 'juego-texto' }, el('strong', {}, 'Ruta dorada VIP'), el('span', { class: 'juego-desc' }, esVip() ? 'Activa: junto a cada nivel tienes su nivel Oro, más difícil.' : 'Un nivel Oro más difícil junto a cada nivel. Toca para saber más.')),
            el('span', { class: 'flecha', 'aria-hidden': 'true' }, '›')
          )
        : null,
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
  const empezar = () => {
    // cada nivel gasta 1 ⚡ (el VIP no gasta); sin energía se ofrece esperar, comprar o ir a la tienda
    if (!tieneEnergia()) return mostrarSinEnergia(() => mostrarIntro(curso, leccion), () => mostrarMapa(curso, 'atras'));
    gastarEnergia();
    mostrarLeccion(curso, leccion);
  };
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
      { class: 'contenido centro', style: `--acento:${leccion.oro ? '#e8a400' : curso.color}` },
      el('p', { class: 'etiqueta' }, leccion.oro ? `${curso.nombre} · Nivel Oro` : curso.nombre),
      el('h1', {}, `${leccion.icono} ${leccion.titulo}`),
      fila,
      el('p', { class: 'aviso' }, `${leccion.ejercicios.length} ejercicios · ${leccion.xp} XP · ⚡ ${esVip() ? 'ilimitada' : 'gasta 1 (tienes ' + energiaActual() + ')'}`)
    ),
    el('div', { class: 'pie' }, el('button', { class: 'boton', type: 'button', onclick: empezar }, '¡Vamos!'))
  );
}

// ============================================================
// PANTALLA 4: la lección (ejercicios)
// ============================================================
function mostrarLeccion(curso, leccion) {
  sonido('reparto');
  let cola = leccion.ejercicios.map(preparar);
  let idx = 0;
  let elegida = null;
  let anchoPrevio = 0; // para que la barra de progreso avance suave en vez de saltar
  const fallados = {};
  const vistos = {}; // para apuntar en la repetición espaciada solo el primer intento de cada ejercicio
  let orden = []; // ejercicios "ordenar": posiciones de las fichas ya colocadas
  let marcadas = []; // ejercicios "seleccionar": cartas tocadas
  let valorNum = ''; // ejercicios "numero": lo que escribiste
  let par = { izq: null, unidos: [], fallos: 0, error: null }; // ejercicios "emparejar"
  let clas = { i: 0, fallos: 0, error: false, puestas: [] }; // ejercicios "clasificar"
  let rel = { i: 0, fallos: 0, flash: null, bloqueado: false }; // ejercicios "relampago"
  let relTimer = null;
  let valorDes = null; // ejercicios "deslizador": posición del control
  let huecos = []; // ejercicios "rellenar": palabra puesta en cada hueco (índice del banco o null)
  let pulsada = null; // formas nuevas de un solo toque (verdadero/falso, duelo, errata): lo que tocaste
  let tachadas = []; // "eliminar": respuestas descartadas
  let armado = []; // "construir": fichas del banco colocadas, en orden
  let mem = { abiertas: [], halladas: [], fallos: 0, bloqueado: false }; // "memoria"
  let comprobar = null; // acción del botón «Comprobar» de la pantalla actual
  let rapidaTimer = null; // partida rápida: 60 s en total
  let rapidaInicio = 0;
  const salir = () => { clearTimeout(rapidaTimer); return curso.global ? mostrarInicio('atras') : mostrarMapa(curso, 'atras'); };
  const aciertosRapida = () => Object.keys(vistos).filter((id) => !fallados[id]).length;
  function terminarRapida() {
    clearTimeout(rapidaTimer);
    clearTimeout(relTimer);
    if (!raiz.querySelector('[data-rapida]')) return; // ya saliste de la partida
    const n = aciertosRapida();
    progreso.rapida.partidas += 1;
    leccion.rapidaNuevoRecord = n > progreso.rapida.mejor;
    if (leccion.rapidaNuevoRecord) progreso.rapida.mejor = n;
    leccion.rapidaAciertos = n;
    leccion.xp = Math.max(2, Math.min(30, n * 2));
    finalizarLeccion(curso, leccion, 100);
  }

  function elegir(i) {
    if (elegida !== null) return;
    const ejercicio = cola[idx];
    elegida = i;
    if (i !== ejercicio.correcta) fallados[ejercicio.id] = true;
    sonido(i === ejercicio.correcta ? 'acierto' : 'error');
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
    if (elegida !== ejercicio.correcta && !leccion.rapida && !leccion.sinReintento) cola = cola.concat([preparar(ejercicio)]);

    if (idx + 1 >= cola.length && leccion.rapida) return terminarRapida();
    if (idx + 1 >= cola.length && leccion.alTerminar) return leccion.alTerminar(Object.assign({}, fallados)); // test de nivel: el resultado lo calcula quien lo pidió
    if (idx + 1 >= cola.length) {
      const total = leccion.ejercicios.length;
      const nFallados = Object.keys(fallados).length;
      finalizarLeccion(curso, leccion, Math.round(((total - nFallados) / total) * 100));
      return;
    }
    idx += 1;
    elegida = null;
    orden = [];
    marcadas = [];
    valorNum = '';
    par = { izq: null, unidos: [], fallos: 0, error: null };
    clas = { i: 0, fallos: 0, error: false, puestas: [] };
    clearTimeout(relTimer);
    rel = { i: 0, fallos: 0, flash: null, bloqueado: false };
    valorDes = null;
    huecos = [];
    pulsada = null;
    tachadas = [];
    armado = [];
    mem = { abiertas: [], halladas: [], fallos: 0, bloqueado: false };
    dibujar('ejercicio');
  }

  function dibujar(entrada) {
    const ejercicio = cola[idx];
    barajaEspanola = curso.id === 'mus' || /^(oro-)?ms-/.test(ejercicio.id);
    clearTimeout(relTimer);
    const respondido = elegida !== null;
    const acierto = respondido && elegida === ejercicio.correcta;

    // Nai lee la pregunta y reacciona a tu respuesta
    const estadoNai = !respondido ? 'pensando' : acierto ? 'feliz' : 'triste';
    const { fila, parrafo } = naiFila(estadoNai, ejercicio.pregunta, 'pequena', respondido);
    parrafo.className = 'pregunta';
    if (ejercicio.id) parrafo.dataset.id = ejercicio.id;

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

    comprobar = null;
    if (ejercicio.tipo === 'ordenar' && !respondido) comprobar = () => orden.length === ejercicio.elementos.length && elegir(orden.every((v, k) => v === k) ? 0 : -1);

    // Tocar las cartas que cumplen algo
    if (ejercicio.tipo === 'seleccionar') {
      const buenas = ejercicio.correctas;
      const igual = marcadas.length === buenas.length && marcadas.every((i) => buenas.includes(i));
      if (!respondido) comprobar = () => marcadas.length && elegir(igual ? 0 : -1);
      tablero = el(
        'div',
        { class: 'seleccion' },
        el('div', { class: 'seleccion-cartas' },
          ejercicio.cartas.map((c, i) => {
            const on = marcadas.includes(i);
            let clase = 'carta-pick' + (on ? ' on' : '');
            if (respondido) clase += on && buenas.includes(i) ? ' bien' : on ? ' mal' : buenas.includes(i) ? ' falta' : '';
            return el(
              'button',
              {
                class: clase,
                type: 'button',
                disabled: respondido ? '' : null,
                'aria-pressed': String(on),
                'aria-label': nombreCarta(c) + (on ? ', marcada' : ''),
                onclick: () => {
                  marcadas = on ? marcadas.filter((v) => v !== i) : marcadas.concat([i]);
                  dibujar('sin');
                  const b = raiz.querySelectorAll('.carta-pick')[i];
                  if (b) b.focus({ preventScroll: true });
                },
              },
              carta(c, i)
            );
          })
        ),
        respondido ? null : el('button', { class: 'boton', type: 'button', disabled: marcadas.length ? null : '', onclick: comprobar }, 'Comprobar')
      );
    }

    // Escribir una cifra
    if (ejercicio.tipo === 'numero') {
      const entrada = el('input', {
        class: 'numero-entrada' + (respondido ? (acierto ? ' bien' : ' mal') : ''),
        type: 'number',
        step: '1',
        autocomplete: 'off',
        'aria-label': 'Tu respuesta',
        value: respondido ? String(valorNum) : null,
        disabled: respondido ? '' : null,
      });
      if (!respondido) {
        comprobar = () => {
          const t = entrada.value.trim().replace(',', '.');
          if (t === '' || Number.isNaN(Number(t))) return;
          valorNum = Number(t);
          elegir(valorNum === ejercicio.respuesta ? 0 : -1);
        };
        entrada.addEventListener('keydown', (ev) => {
          if (ev.key === 'Enter') {
            ev.preventDefault();
            ev.stopPropagation(); // si no, el atajo global leería el mismo Enter como «Continuar»
            comprobar();
          }
        });
      }
      tablero = el(
        'div',
        { class: 'numero' },
        el('div', { class: 'numero-fila' }, entrada, ejercicio.unidad ? el('span', { class: 'numero-unidad' }, ejercicio.unidad) : null),
        respondido ? null : el('button', { class: 'boton', type: 'button', onclick: comprobar }, 'Comprobar')
      );
    }

    // Unir cada término con su significado
    if (ejercicio.tipo === 'emparejar') {
      const n = ejercicio.pares.length;
      const dueno = ejercicio; // para ignorar temporizadores de un ejercicio que ya pasó
      const unidoK = (campo, v) => par.unidos.findIndex((u) => u[campo] === v);
      const lado = (texto, campo, v) => {
        const k = unidoK(campo, v);
        const errorAqui = par.error && par.error[campo] === v;
        return el(
          'button',
          {
            class: 'par' + (campo === 'i' && par.izq === v ? ' sel' : '') + (k >= 0 ? ' unido' : '') + (errorAqui ? ' mal' : ''),
            type: 'button',
            style: k >= 0 ? `--k:${k}` : null,
            disabled: k >= 0 || respondido ? '' : null,
            'aria-pressed': campo === 'i' ? String(par.izq === v) : null,
            onclick: () => {
              if (campo === 'i') par.izq = par.izq === v ? null : v;
              else if (par.izq !== null) {
                if (par.izq === v) {
                  sonido('unir');
                  par.unidos.push({ i: v, j: v });
                  par.izq = null;
                  if (par.unidos.length === n) setTimeout(() => cola[idx] === dueno && elegida === null && elegir(par.fallos === 0 ? 0 : -1), 450);
                } else {
                  sonido('error');
                  par.fallos += 1;
                  par.error = { i: par.izq, j: v };
                  par.izq = null;
                  setTimeout(() => {
                    par.error = null;
                    if (cola[idx] === dueno && elegida === null) dibujar('sin');
                  }, 550);
                }
              } else return;
              dibujar('sin');
              const f = raiz.querySelector('.par.sel, .parejas-col:first-child .par:not(:disabled)');
              if (f) f.focus({ preventScroll: true });
            },
          },
          texto
        );
      };
      tablero = el(
        'div',
        { class: 'parejas-caja' },
        el('p', { class: 'ordenar-etiqueta' }, 'Toca un término y después su significado'),
        el('div', { class: 'parejas' },
          el('div', { class: 'parejas-col' }, ejercicio.pares.map((p, i) => lado(p[0], 'i', i))),
          el('div', { class: 'parejas-col' }, ejercicio.mezcla.map((j) => lado(ejercicio.pares[j][1], 'j', j)))
        )
      );
    }

    // Clasificar: cada carta que sale va a su cajón (arrastrando o tocando el cajón; teclas 1, 2, 3)
    if (ejercicio.tipo === 'clasificar') {
      const n = ejercicio.elementos.length;
      const dueno = ejercicio;
      const actual = clas.i < n ? ejercicio.mezcla[clas.i] : null;
      const colocar = (k) => {
        if (respondido || actual === null || cola[idx] !== dueno) return;
        if (ejercicio.elementos[actual][1] === k) {
          sonido('unir');
          clas.puestas.push({ e: actual, k });
          clas.i += 1;
          clas.error = false;
          dibujar('sin');
          if (clas.i === n) setTimeout(() => cola[idx] === dueno && elegida === null && elegir(clas.fallos === 0 ? 0 : -1), 500);
        } else {
          sonido('error');
          clas.fallos += 1;
          clas.error = true;
          dibujar('sin');
          setTimeout(() => { clas.error = false; if (cola[idx] === dueno && elegida === null) dibujar('sin'); }, 500);
        }
      };
      const ficha = actual === null ? null : el('div', { class: 'clas-ficha' + (clas.error ? ' error' : '') + (barajaEspanola && esCartaMus(ejercicio.elementos[actual][0]) ? ' con-carta' : ''), role: 'img', 'aria-label': `Carta para clasificar: ${ejercicio.elementos[actual][0]}`, 'data-clas': String(actual) },
        barajaEspanola && esCartaMus(ejercicio.elementos[actual][0]) ? cartaEspanola(ejercicio.elementos[actual][0], clas.i, true) : el('span', {}, ejercicio.elementos[actual][0]));
      if (ficha) {
        // arrastrar con el dedo o el ratón hasta un cajón
        let ini = null;
        ficha.addEventListener('pointerdown', (ev) => { ini = { x: ev.clientX, y: ev.clientY }; ficha.setPointerCapture(ev.pointerId); ficha.classList.add('arrastrando'); });
        ficha.addEventListener('pointermove', (ev) => {
          if (!ini) return;
          ficha.style.transform = `translate(${ev.clientX - ini.x}px, ${ev.clientY - ini.y}px) rotate(${(ev.clientX - ini.x) / 18}deg)`;
          ficha.style.pointerEvents = 'none';
          const sobre = document.elementFromPoint(ev.clientX, ev.clientY);
          ficha.style.pointerEvents = '';
          raiz.querySelectorAll('.clas-cajon').forEach((c) => c.classList.toggle('encima', !!sobre && c === sobre.closest('.clas-cajon')));
        });
        const soltar = (ev) => {
          if (!ini) return;
          ini = null;
          ficha.style.pointerEvents = 'none';
          const sobre = document.elementFromPoint(ev.clientX, ev.clientY);
          ficha.style.pointerEvents = '';
          const cajon = sobre && sobre.closest('.clas-cajon');
          ficha.classList.remove('arrastrando');
          ficha.style.transform = '';
          raiz.querySelectorAll('.clas-cajon').forEach((c) => c.classList.remove('encima'));
          if (cajon) colocar(Number(cajon.dataset.cajon));
        };
        ficha.addEventListener('pointerup', soltar);
        ficha.addEventListener('pointercancel', () => { ini = null; ficha.classList.remove('arrastrando'); ficha.style.transform = ''; });
      }
      tablero = el(
        'div',
        { class: 'clasificar' },
        el('p', { class: 'ordenar-etiqueta' }, respondido ? 'Así quedó' : `Arrastra la carta a su cajón o toca el cajón · ${Math.min(clas.i + 1, n)} de ${n}`),
        el('div', { class: 'clas-mazo' }, ficha || el('span', { class: 'ordenar-vacio' }, '¡Todas colocadas!')),
        el('div', { class: 'clas-cajones' + (ejercicio.categorias.length > 2 ? ' tres' : '') },
          ejercicio.categorias.map((c, k) =>
            el('button', { class: 'clas-cajon', type: 'button', 'data-cajon': String(k), style: `--k:${k}`, disabled: respondido ? '' : null, onclick: () => colocar(k) },
              el('strong', {}, el('span', { class: 'tecla' }, String(k + 1)), c),
              el('span', { class: 'clas-dentro' }, clas.puestas.filter((x) => x.k === k).map((x) => el('span', { class: 'clas-mini' }, ejercicio.elementos[x.e][0])))
            )
          )
        )
      );
    }

    // Deslizador: mueve el control hasta tu estimación
    if (ejercicio.tipo === 'deslizador') {
      const { min, max, respuesta, tolerancia = 0 } = ejercicio;
      const paso = ejercicio.paso || 1;
      if (valorDes === null) valorDes = ejercicio.inicio !== undefined ? ejercicio.inicio : Math.round((min + max) / 2 / paso) * paso;
      const pct = (v) => ((v - min) / (max - min)) * 100;
      const unidad = ejercicio.unidad || '';
      const burbuja = el('output', { class: 'desliz-valor' + (respondido ? (acierto ? ' bien' : ' mal') : '') }, `${valorDes}${unidad}`);
      const control = el('input', { class: 'desliz-control', type: 'range', min: String(min), max: String(max), step: String(paso), value: String(valorDes), 'aria-label': 'Tu estimación', disabled: respondido ? '' : null });
      const caja = el('div', { class: 'desliz-pista', style: `--p:${pct(valorDes)}%;--z1:${pct(Math.max(min, respuesta - tolerancia))}%;--z2:${pct(Math.min(max, respuesta + tolerancia))}%` }, respondido ? el('span', { class: 'desliz-zona', 'aria-hidden': 'true' }) : null, control);
      control.addEventListener('input', () => {
        valorDes = Number(control.value);
        burbuja.textContent = `${valorDes}${unidad}`;
        caja.style.setProperty('--p', pct(valorDes) + '%');
        if (!respondido) sonido('toque');
      });
      if (!respondido) comprobar = () => elegir(Math.abs(valorDes - respuesta) <= tolerancia ? 0 : -1);
      tablero = el(
        'div',
        { class: 'deslizador' },
        burbuja,
        caja,
        el('div', { class: 'desliz-extremos' }, el('span', {}, `${min}${unidad}`), el('span', {}, `${max}${unidad}`)),
        tolerancia && !respondido ? el('p', { class: 'ordenar-etiqueta' }, `Vale un margen de ±${tolerancia}${unidad ? ' ' + unidad : ''}`) : null,
        respondido ? null : el('button', { class: 'boton', type: 'button', onclick: comprobar }, 'Comprobar')
      );
    }

    // Rellenar huecos: toca las palabras para completar la frase
    if (ejercicio.tipo === 'rellenar') {
      const partes = ejercicio.texto.split('{}');
      const nh = partes.length - 1;
      while (huecos.length < nh) huecos.push(null);
      const llenos = huecos.every((h) => h !== null);
      const buenoK = (k) => huecos[k] !== null && ejercicio.banco[huecos[k]] === ejercicio.huecos[k];
      const todoBien = llenos && huecos.every((_, k) => buenoK(k));
      if (!respondido) comprobar = () => llenos && elegir(todoBien ? 0 : -1);
      const frase = el('p', { class: 'rell-frase' });
      partes.forEach((t, k) => {
        if (k < nh && k === nh - 1 && partes[nh].length <= 3) {
          // el hueco y el punto final van juntos para que no se quede el punto solo en otra línea
          var cola = el('span', { class: 'rell-junto' });
        } else cola = null;
        frase.append(t);
        if (k < nh) {
          const w = huecos[k];
          (cola || frase).append(el('button', {
            class: 'rell-hueco' + (w !== null ? ' lleno' : '') + (respondido ? (buenoK(k) ? ' bien' : ' mal') : '') + (!respondido && w === null && huecos.indexOf(null) === k ? ' siguiente' : ''),
            type: 'button',
            disabled: respondido || w === null ? '' : null,
            'aria-label': w === null ? `Hueco ${k + 1}, vacío` : `Hueco ${k + 1}: ${ejercicio.banco[w]}. Toca para quitarla`,
            onclick: () => { huecos[k] = null; sonido('toque'); dibujar('sin'); },
          }, w === null ? '' : ejercicio.banco[w]));
          if (cola) { cola.append(partes[nh]); frase.append(cola); partes[nh] = ''; }
        }
      });
      const banco = ejercicio.mezcla.map((b) => el('button', {
        class: 'ficha rell-palabra' + (huecos.includes(b) ? ' usada' : ''),
        type: 'button',
        disabled: respondido || huecos.includes(b) ? '' : null,
        onclick: () => { const k = huecos.indexOf(null); if (k < 0) return; huecos[k] = b; sonido('toque'); dibujar('sin'); const f = raiz.querySelector('.rell-palabra:not(:disabled)'); if (f) f.focus({ preventScroll: true }); },
      }, ejercicio.banco[b]));
      tablero = el(
        'div',
        { class: 'rellenar' },
        el('p', { class: 'ordenar-etiqueta' }, 'Toca las palabras para rellenar los huecos'),
        frase,
        el('div', { class: 'ordenar-banco' }, banco),
        respondido || !llenos ? null : el('button', { class: 'boton', type: 'button', onclick: comprobar }, 'Comprobar')
      );
    }

    // Relámpago: una serie de decisiones rápidas con cuenta atrás (se permite 1 fallo de 5; sin cuenta atrás en modo calma)
    if (ejercicio.tipo === 'relampago') {
      const n = ejercicio.items.length;
      const dueno = ejercicio;
      const permitidos = n >= 5 ? 1 : 0;
      const sinPrisa = document.documentElement.dataset.calma === 'si';
      const actual = rel.i < n ? ejercicio.mezcla[rel.i] : null;
      const responderRel = (k) => {
        if (respondido || rel.bloqueado || actual === null || cola[idx] !== dueno) return;
        clearTimeout(relTimer);
        const bien = k === ejercicio.items[actual][1];
        if (!bien) rel.fallos += 1;
        situacionesDe(ejercicio, actual).forEach((c) => registrarSituacion(c, bien));
        sonido(bien ? 'unir' : 'error');
        rel.flash = k < 0 ? 'tarde' : bien ? 'bien' : 'mal';
        rel.bloqueado = true;
        dibujar('sin');
        setTimeout(() => {
          if (cola[idx] !== dueno || elegida !== null) return;
          rel.i += 1;
          rel.flash = null;
          rel.bloqueado = false;
          if (rel.i >= n || rel.fallos > permitidos) return elegir(rel.fallos <= permitidos ? 0 : -1);
          dibujar('sin');
        }, 320);
      };
      if (actual !== null && !rel.bloqueado && !sinPrisa) relTimer = setTimeout(() => responderRel(-1), (ejercicio.segundos || 8) * 1000);
      const [texto, , etiqueta] = actual === null ? ['', 0, ''] : ejercicio.items[actual];
      const trozos = texto.split(/ [·+] | /).filter(Boolean);
      const sonCartas = trozos.length > 0 && trozos.length <= 5 && trozos.every((t) => (barajaEspanola ? esCartaMus(t) : /^(10|[2-9AJQK])[♠♥♦♣]$/.test(t)));
      tablero = el(
        'div',
        { class: 'relampago' },
        el('p', { class: 'ordenar-etiqueta' }, `Relámpago · ${Math.min(rel.i + 1, n)} de ${n}` + (sinPrisa ? ' · sin cuenta atrás' : ` · ${ejercicio.segundos || 8} s por pregunta`) + (permitidos ? ' · vale 1 fallo' : '')),
        sinPrisa ? null : el('div', { class: 'rel-barra', 'aria-hidden': 'true' }, el('span', { class: rel.bloqueado ? 'parada' : '', style: `--s:${ejercicio.segundos || 8}s` })),
        el('div', { class: 'rel-item' + (rel.flash ? ' ' + rel.flash : ''), 'data-rel': actual === null ? '' : String(actual), role: 'group', 'aria-label': `${etiqueta ? etiqueta + ': ' : ''}${texto}` },
          etiqueta ? el('span', { class: 'rel-etiqueta' }, etiqueta) : null,
          sonCartas ? el('div', { class: 'fila rel-cartas' }, trozos.map((t, i) => carta(t, i))) : el('strong', { class: 'rel-texto' }, texto)
        ),
        el('div', { class: 'rel-opciones' + (ejercicio.respuestas && ejercicio.respuestas.length > 2 ? ' tres' : '') },
          ejercicio.respuestas.map((o, k) => el('button', { class: 'rel-opcion', type: 'button', 'data-k': String(k), style: `--k:${k}`, disabled: respondido || rel.bloqueado ? '' : null, onclick: () => responderRel(k) }, el('span', { class: 'tecla' }, String(k + 1)), o)))
      );
    }


    // ---------- Formas nuevas de responder (data/formas-interactivas.js) ----------
    const dueno2 = ejercicio;
    const sigue = () => cola[idx] === dueno2 && elegida === null && !!raiz.querySelector(`.pregunta[data-id="${dueno2.id}"]`); // sigue en esta pantalla (no saliste de la lección)
    // ¿Verdadero o falso?: se propone una respuesta y se juzga
    if (ejercicio.tipo === 'vf') {
      const juzga = (dice) => { if (respondido) return; pulsada = dice; elegir(dice === ejercicio.verdadero ? 0 : -1); };
      const boton = (dice, texto, k) => {
        let clase = 'vf-boton ' + (dice ? 'si' : 'no');
        if (respondido && dice === ejercicio.verdadero) clase += ' bien';
        else if (respondido && pulsada === dice) clase += ' mal';
        return el('button', { class: clase, type: 'button', 'data-vf': dice ? 'v' : 'f', disabled: respondido ? '' : null, onclick: () => juzga(dice) }, el('span', { class: 'tecla' }, String(k)), texto);
      };
      tablero = el('div', { class: 'vf' },
        el('p', { class: 'ordenar-etiqueta' }, '¿Verdadero o falso?'),
        el('div', { class: 'vf-propuesta' }, el('span', { class: 'vf-etiqueta' }, 'Respuesta propuesta'), el('strong', {}, ejercicio.propuesta)),
        el('div', { class: 'vf-botones' }, boton(true, 'Verdadero', 1), boton(false, 'Falso', 2)));
    }
    // Duelo: dos respuestas frente a frente
    if (ejercicio.tipo === 'duelo') {
      const carta = (texto, k) => {
        let clase = 'duelo-carta';
        if (respondido && texto === ejercicio.acierto) clase += ' bien';
        else if (respondido && pulsada === k) clase += ' mal';
        return el('button', { class: clase, type: 'button', 'data-duelo': String(k), disabled: respondido ? '' : null,
          onclick: () => { if (respondido) return; pulsada = k; elegir(texto === ejercicio.acierto ? 0 : -1); } }, el('span', { class: 'tecla' }, String(k + 1)), texto);
      };
      tablero = el('div', { class: 'duelo' },
        el('p', { class: 'ordenar-etiqueta' }, 'Duelo: elige la correcta'),
        el('div', { class: 'duelo-cartas' }, carta(ejercicio.par[0], 0), el('span', { class: 'duelo-vs', 'aria-hidden': 'true' }, 'VS'), carta(ejercicio.par[1], 1)));
    }
    // Descartar: tacha las incorrectas hasta que solo quede la buena
    if (ejercicio.tipo === 'eliminar') {
      const malas = ejercicio.lista.length - 1;
      const tacha = (i) => {
        if (respondido || tachadas.includes(i)) return;
        if (i === ejercicio.buena) { tachadas = tachadas.concat([i]); return elegir(-1); }
        tachadas = tachadas.concat([i]);
        if (tachadas.length >= malas) { dibujar('sin'); return void setTimeout(() => sigue() && elegir(0), 420); }
        dibujar('sin');
      };
      tablero = el('div', { class: 'eliminar' },
        el('p', { class: 'ordenar-etiqueta' }, `Descarta las incorrectas · te faltan ${Math.max(0, malas - tachadas.filter((i) => i !== ejercicio.buena).length)}`),
        ejercicio.lista.map((texto, i) => {
          let clase = 'elim-opcion' + (tachadas.includes(i) ? ' tachada' : '');
          if (respondido && i === ejercicio.buena) clase += ' bien';
          else if (respondido && tachadas.includes(i) && i === ejercicio.buena) clase += ' mal';
          return el('button', { class: clase, type: 'button', 'data-elim': String(i), 'aria-pressed': tachadas.includes(i) ? 'true' : 'false', disabled: respondido || tachadas.includes(i) ? '' : null, onclick: () => tacha(i) },
            el('span', { class: 'tecla' }, tachadas.includes(i) ? '✕' : String(i + 1)), el('span', { class: 'elim-texto' }, texto));
        }));
    }
    // Contrarreloj: las respuestas de siempre, con tiempo
    if (ejercicio.tipo === 'reloj') {
      const sinPrisa2 = document.documentElement.dataset.calma === 'si';
      const seg = ejercicio.segundos || 12;
      if (!respondido && !sinPrisa2) relTimer = setTimeout(() => sigue() && elegir(-1), seg * 1000);
      tablero = el('div', { class: 'reloj' },
        el('p', { class: 'ordenar-etiqueta' }, 'Contrarreloj' + (sinPrisa2 ? ' · sin cuenta atrás' : ` · ${seg} s`)),
        sinPrisa2 ? null : el('div', { class: 'rel-barra', role: 'timer', 'aria-label': `Tienes ${seg} segundos` }, el('span', { class: respondido ? 'parada' : '', style: `--s:${seg}s` })));
    }
    // Armar la respuesta: toca las palabras en orden (sobran algunas)
    if (ejercicio.tipo === 'construir') {
      const hecho = armado.map((b) => ejercicio.banco[b]).join(' ');
      const correctoC = hecho === ejercicio.palabras.join(' ');
      const ficha = (b, colocada, k) => el('button', {
        class: 'ficha' + (colocada ? ' colocada' : '') + (respondido ? (correctoC ? ' bien' : ' mal') : ''), type: 'button', disabled: respondido ? '' : null,
        'aria-label': colocada ? `Quitar ${ejercicio.banco[b]}` : `Poner ${ejercicio.banco[b]}`,
        onclick: () => { if (respondido) return; armado = colocada ? armado.filter((v) => v !== b) : armado.concat([b]); dibujar('sin'); const f = raiz.querySelector('.construir .ordenar-banco .ficha'); if (f) f.focus({ preventScroll: true }); },
      }, ejercicio.banco[b]);
      const bancoC = ejercicio.mezcla.filter((b) => !armado.includes(b)).map((b) => ficha(b, false, 0));
      if (!respondido) comprobar = () => armado.length && elegir(hecho === ejercicio.palabras.join(' ') ? 0 : -1);
      tablero = el('div', { class: 'ordenar construir' },
        el('p', { class: 'ordenar-etiqueta' }, 'Arma la respuesta (sobran palabras)'),
        el('div', { class: 'ordenar-lista' }, armado.length ? armado.map((b, k) => ficha(b, true, k)) : el('span', { class: 'ordenar-vacio' }, 'Toca las palabras en orden')),
        bancoC.length ? el('p', { class: 'ordenar-etiqueta' }, 'Palabras') : null,
        el('div', { class: 'ordenar-banco' }, bancoC),
        !respondido && armado.length ? el('button', { class: 'boton', type: 'button', onclick: comprobar }, 'Comprobar') : null);
    }
    // Memoria: encuentra las parejas boca abajo
    if (ejercicio.tipo === 'memoria') {
      const n = ejercicio.pares.length;
      const abre = (c) => {
        if (respondido || mem.bloqueado || mem.abiertas.includes(c) || mem.halladas.includes(c >> 1) || mem.abiertas.length >= 2) return;
        mem.abiertas = mem.abiertas.concat([c]);
        if (mem.abiertas.length === 2) {
          const [a, b] = mem.abiertas;
          if (a >> 1 === b >> 1) {
            sonido('unir');
            mem.halladas = mem.halladas.concat([a >> 1]);
            mem.abiertas = [];
            if (mem.halladas.length === n) setTimeout(() => sigue() && elegir(mem.fallos <= 2 * n ? 0 : -1), 450);
          } else {
            sonido('error');
            mem.fallos += 1;
            mem.bloqueado = true;
            setTimeout(() => { if (!sigue()) return; mem.abiertas = []; mem.bloqueado = false; dibujar('sin'); }, 850);
          }
        }
        dibujar('sin');
      };
      tablero = el('div', { class: 'memoria' },
        el('p', { class: 'ordenar-etiqueta' }, `Memoria · ${mem.halladas.length} de ${n} parejas · fallos: ${mem.fallos}`),
        el('div', { class: 'mem-rejilla' }, ejercicio.mezcla.map((c) => {
          const hallada = mem.halladas.includes(c >> 1), abierta = hallada || mem.abiertas.includes(c);
          const texto = ejercicio.pares[c >> 1][c & 1];
          return el('button', { class: 'mem-carta' + (abierta ? ' abierta' : '') + (hallada ? ' hallada' : '') + (mem.bloqueado && mem.abiertas.includes(c) ? ' mal' : ''), type: 'button', style: `--k:${c >> 1}`, 'data-mem': String(c), 'data-par': String(c >> 1),
            'aria-label': abierta ? texto : 'Carta boca abajo', disabled: hallada || respondido ? '' : null, onclick: () => abre(c) }, abierta ? texto : '?');
        })));
    }
    // Encuentra el error: una ficha está fuera de sitio
    if (ejercicio.tipo === 'errata') {
      tablero = el('div', { class: 'errata' },
        el('p', { class: 'ordenar-etiqueta' }, 'Una ficha está fuera de sitio: tócala'),
        el('div', { class: 'errata-lista' }, ejercicio.secuencia.map((v, k) => {
          let clase = 'ficha errata-ficha';
          if (respondido && k === ejercicio.intruso) clase += ' bien';
          else if (respondido && pulsada === k) clase += ' mal';
          return el('button', { class: clase, type: 'button', 'data-errata': String(k), disabled: respondido ? '' : null, onclick: () => { if (respondido) return; pulsada = k; elegir(k === ejercicio.intruso ? 0 : -1); } },
            el('span', { class: 'ficha-n' }, String(k + 1)), ejercicio.elementos[v]);
        })));
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
              : ejercicio.tipo === 'reloj' && elegida === -1
                ? '¡Se acabó el tiempo!'
                : elegirAlAzar(['¡Casi!', 'Ups, esa no era.', 'No pasa nada.'])
          ),
          acierto
            ? null
            : el('p', { class: 'correcta' }, `Respuesta correcta: ${respuestaTexto(ejercicio)}`),
          el('p', {}, ejercicio.explicacion),
          el('button', { class: 'boton', type: 'button', onclick: continuar }, 'Continuar')
        )
      : null;

    // La barra avanza en cuanto aciertas, y arranca desde donde estaba (no desde cero)
    if (leccion.rapida && !rapidaInicio) { rapidaInicio = Date.now(); rapidaTimer = setTimeout(terminarRapida, 60000); }
    const transcurrido = rapidaInicio ? (Date.now() - rapidaInicio) / 1000 : 0;
    const objetivo = (idx + (acierto ? 1 : 0)) / cola.length;
    const relleno = el('div', { class: 'barra-relleno', style: `transform:scaleX(${anchoPrevio})` });
    const cambiaBarra = objetivo !== anchoPrevio;
    anchoPrevio = objetivo;

    pintar(
      entrada,
      el(
        'header',
        { class: 'cabecera-leccion' + (leccion.rapida ? ' rapida' : ''), 'data-rapida': leccion.rapida ? '1' : null },
        el('button', { class: 'cerrar', type: 'button', 'aria-label': 'Salir de la lección', onclick: salir }, '✕'),
        leccion.rapida
          ? el('div', { class: 'barra barra-tiempo', role: 'timer', 'aria-label': 'Tiempo restante de la partida rápida', style: `--acento:${curso.color}` },
              el('div', { class: 'barra-relleno tiempo', style: `animation-delay:-${transcurrido.toFixed(2)}s` }))
          : el(
          'div',
          { class: 'barra', style: `--acento:${curso.color}`, role: 'progressbar', 'aria-label': 'Progreso de la lección', 'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-valuenow': String(Math.round(objetivo * 100)) },
          relleno
        ),
        leccion.rapida ? el('span', { class: 'rapida-puntos', 'aria-live': 'polite' }, el('strong', {}, String(aciertosRapida())), ' ✓') : null
      ),
      el('main', { class: 'contenido' }, fila, situacion(ejercicio), tablero, opciones),
      feedback
    );

    barajaEspanola = false; // solo vale mientras se dibuja la pregunta
    if (!respondido && ejercicio.tipo === 'numero') {
      const entradaNum = raiz.querySelector('.numero-entrada');
      if (entradaNum) entradaNum.focus({ preventScroll: true });
    }
    if (cambiaBarra) alSiguienteFotograma(() => (relleno.style.transform = `scaleX(${objetivo})`));
    else relleno.style.transform = `scaleX(${objetivo})`;

    alTeclear = (e) => {
      if (!respondido && ejercicio.tipo === 'relampago' && /^[1-9]$/.test(e.key) && Number(e.key) <= ejercicio.respuestas.length) {
        const b = raiz.querySelector(`.rel-opcion[data-k="${Number(e.key) - 1}"]`);
        if (b && !b.disabled) b.click();
      } else if (!respondido && ejercicio.tipo === 'clasificar' && /^[1-9]$/.test(e.key) && Number(e.key) <= ejercicio.categorias.length) {
        const cajon = raiz.querySelector(`.clas-cajon[data-cajon="${Number(e.key) - 1}"]`);
        if (cajon) cajon.click();
      } else if (!respondido && /^[1-9]$/.test(e.key) && Number(e.key) <= ejercicio.opciones.length) {
        elegir(Number(e.key) - 1);
      } else if (respondido && e.key === 'Enter') {
        e.preventDefault();
        continuar();
      } else if (!respondido && comprobar && e.key === 'Enter') {
        e.preventDefault();
        comprobar();
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
  const vipX = multVip();
  const xp = (leccion.repaso ? Math.round((leccion.xp * precision) / 100) : leccion.xp) * vipX;
  const actividad = registrarActividad(xp);
  // fichas: 3 por nivel nuevo (6 si es Oro) y 5 por cumplir la meta diaria
  const fichas = (!leccion.repaso && !yaHecha ? (leccion.oro ? 6 : 3) : 0) + (actividad.metaCumplida ? 5 : 0);
  const fichasTotal = fichas * vipX;
  progreso.fichas += fichasTotal;
  const idx = niveles(curso).indexOf(leccion);
  const cofreNuevo = !leccion.repaso && !leccion.oro && !yaHecha && idx >= 0 && (idx + 1) % CADA_COFRE === 0;
  if (leccion.repaso) progreso.repasos = (progreso.repasos || 0) + 1;
  else progreso.completadas[leccion.id] = true;
  if (precision === 100 && !leccion.repaso) { progreso.perfectos = (progreso.perfectos || 0) + 1; if (typeof retoSuma === 'function') retoSuma('perfectos'); }
  if (!leccion.repaso && typeof retoSuma === 'function') retoSuma('niveles');
  if (leccion.rapida && typeof retoSuma === 'function') retoSuma('rapida', leccion.rapidaAciertos || 0);
  const logros = calcularLogros();
  guardarProgreso();

  const nuevoRango = rangoDe(progreso.xp);
  const siguiente = siguienteNivel(curso);
  const nuevoNivel = !leccion.repaso && !leccion.oro && !yaHecha;
  mostrarResultado(curso, leccion, precision, {
    xp,
    fichas: fichasTotal,
    vip: vipX > 1,
    cofreNuevo,
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

  const rap = leccion.rapida ? leccion.rapidaAciertos : null;
  const mensaje =
    rap !== null
      ? leccion.rapidaNuevoRecord && rap > 0 ? `¡Nuevo récord! ${rap} aciertos en 60 segundos.` : `${rap} ${rap === 1 ? 'acierto' : 'aciertos'} en 60 segundos.`
      : leccion.repaso && precision === 100
      ? '¡Repaso perfecto! Se nota que lo tienes claro.'
      : precision === 100
      ? '¡Perfecto! Ni un solo fallo. Así se aprende.'
      : precision >= 67
      ? '¡Muy bien! Lo has hecho genial.'
      : 'Nivel completado. Los fallos también enseñan: repítelo cuando quieras para afianzar.';
  const nEstrellas = rap !== null ? (rap >= 12 ? 3 : rap >= 6 ? 2 : 1) : precision === 100 ? 3 : precision >= 67 ? 2 : 1;
  const { fila } = naiFila(precision >= 67 ? 'celebrando' : 'feliz', mensaje, 'grande');

  // Las líneas van apareciendo una tras otra (--i) y los números suben desde 0
  const linea = (i, clase, contenido) => el('p', { class: clase + ' aparece', style: `--i:${i}` }, contenido);
  const xp = linea(2, 'resultado-dato', '');
  const prec = linea(3, 'resultado-dato', '');
  let orden = 4;
  const notas = [];
  if (rachaVigente() > 0) notas.push(linea(orden++, 'resultado-dato', `🔥 Racha: ${rachaVigente()} ${rachaVigente() === 1 ? 'día' : 'días'}`));
  const act = extra.actividad || {};
  if (extra.vip) notas.push(linea(orden++, 'resultado-dato', '👑 Bonus VIP: el doble de XP y de fichas'));
  if (extra.fichas) notas.push(linea(orden++, 'resultado-dato', `🪙 +${extra.fichas} fichas`));
  if (extra.cofreNuevo) notas.push(linea(orden++, 'resultado-nuevo', '🎁 ¡Hay un cofre esperándote en el mapa!'));
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
      el('h1', { class: 'resultado-titulo' }, rap !== null ? '¡Tiempo!' : leccion.repaso ? '¡Repaso terminado!' : leccion.oro ? '👑 ¡Nivel Oro completado!' : '¡Nivel completado!'),
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
    precision >= 67 && rap !== 0 || extra.cursoCompleto || extra.rangoNuevo ? confeti(extra.cursoCompleto || extra.rangoNuevo ? 80 : 40) : null
  );

  // Sonidos del resultado: fanfarria, y luego meta, logros y rango si los hay
  sonido(precision >= 67 || extra.cursoCompleto ? 'nivel' : 'toque');
  if (extra.fichas) sonido('ficha', 450);
  if (act.metaCumplida) sonido('meta', 700);
  if (extra.logros && extra.logros.length) sonido('logro', act.metaCumplida ? 1300 : 700);
  if (extra.rangoNuevo) sonido('rango', 1500);
  contar(xp, extra.xp, (v) => `+${v} XP`, 350);
  if (rap !== null) contar(prec, rap, (v) => `Aciertos: ${v}`, 550);
  else contar(prec, precision, (v) => `Precisión: ${v}%`, 550);
}

