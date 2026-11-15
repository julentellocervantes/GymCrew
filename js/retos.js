// RETO SEMANAL: cada lunes sale un reto nuevo; al completarlo cobras fichas y XP.
// También lleva el XP de la semana (para el ranking con amigos).

const lunesDe = (dia) => {
  const d = new Date(dia + 'T12:00:00');
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return fechaLocal(d);
};
const semanaActual = () => lunesDe(hoy());

// tipo: qué cuenta | meta | texto
const RETOS = [
  { id: 'aciertos', meta: 80, titulo: 'Acierta 80 preguntas', desc: 'Suma aciertos en cualquier juego esta semana' },
  { id: 'niveles', meta: 4, titulo: 'Completa 4 niveles', desc: 'Niveles de cualquier juego (también se cuentan los repetidos)' },
  { id: 'dias', meta: 5, titulo: 'Practica 5 días distintos', desc: 'Con una sola lección al día basta' },
  { id: 'rapida', meta: 15, titulo: '15 aciertos en una partida rápida', desc: 'Tu mejor partida rápida de la semana' },
  { id: 'perfectos', meta: 2, titulo: 'Termina 2 niveles sin fallos', desc: 'Un 100 % de aciertos en el nivel' },
];
const RETO_PREMIO = { fichas: 25, xp: 30 };

// Devuelve el reto de esta semana (lo crea si todavía no existe)
function retoActual() {
  const sem = semanaActual();
  if (!progreso.reto || progreso.reto.semana !== sem) {
    const num = Math.floor(new Date(sem + 'T12:00:00').getTime() / 604800000);
    progreso.reto = { semana: sem, id: RETOS[num % RETOS.length].id, n: 0, dias: [], cobrado: false };
  }
  return Object.assign({ def: RETOS.find((r) => r.id === progreso.reto.id) || RETOS[0] }, progreso.reto);
}

// Suma al reto si trata de lo mismo. valor: cuánto suma (o el máximo, para «rapida»)
function retoSuma(tipo, valor = 1) {
  const r = retoActual();
  if (r.def.id !== tipo || progreso.reto.cobrado) return;
  const p = progreso.reto;
  if (tipo === 'rapida') p.n = Math.max(p.n, valor);
  else if (tipo === 'dias') { const h = hoy(); if (!p.dias.includes(h)) { p.dias.push(h); p.n = p.dias.length; } }
  else p.n += valor;
}

const retoCompleto = () => { const r = retoActual(); return r.n >= r.def.meta; };

// Cobra el premio si está completo y aún no se cobró. Devuelve true si cobró.
function retoCobrar() {
  const r = retoActual();
  if (r.cobrado || r.n < r.def.meta) return false;
  progreso.reto.cobrado = true;
  progreso.retosHechos = (progreso.retosHechos || 0) + 1;
  const v = multVip();
  progreso.fichas += RETO_PREMIO.fichas * v;
  progreso.xp += RETO_PREMIO.xp * v;
  sumarXpSemana(RETO_PREMIO.xp * v);
  calcularLogros();
  guardarProgreso();
  return true;
}

// XP de esta semana (lunes a domingo)
function sumarXpSemana(xp) {
  const sem = semanaActual();
  if (!progreso.semanaXp || progreso.semanaXp.semana !== sem) progreso.semanaXp = { semana: sem, xp: 0 };
  progreso.semanaXp.xp += xp;
}
const xpDeLaSemana = () => (progreso.semanaXp && progreso.semanaXp.semana === semanaActual() ? progreso.semanaXp.xp : 0);

// Tarjeta del inicio
function tarjetaReto(alCambiar) {
  const r = retoActual();
  const hecho = r.n >= r.def.meta;
  const pct = Math.min(100, Math.round((100 * r.n) / r.def.meta));
  const listo = hecho && !r.cobrado;
  const claseExtra = r.cobrado ? ' cobrado' : listo ? ' listo' : '';
  const texto = r.cobrado ? '¡Reto cumplido! Vuelve el lunes para el siguiente.' : listo ? `Toca para cobrar ${RETO_PREMIO.fichas} fichas y ${RETO_PREMIO.xp} XP` : `${Math.min(r.n, r.def.meta)} de ${r.def.meta} · ${r.def.desc}`;
  return el('button', { class: 'reto' + claseExtra, type: 'button', 'aria-label': 'Reto de la semana: ' + r.def.titulo, onclick: () => {
      if (retoCobrar()) { sonido('ficha'); sonido('logro', 400); alCambiar(); }
    } },
    el('span', { class: 'reto-icono' }, r.cobrado ? '🏅' : '🎯'),
    el('span', { class: 'juego-texto' },
      el('strong', {}, 'Reto semanal: ' + r.def.titulo),
      el('span', { class: 'juego-barra' }, el('span', { class: 'juego-relleno', style: `width:${pct}%` })),
      el('span', { class: 'juego-niveles' }, texto)));
}
