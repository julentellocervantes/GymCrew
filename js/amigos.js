// RANKING CON AMIGOS: tu nombre y tu XP de la semana, visibles solo para quien añada tu código.
// Usa la misma cuenta que la copia en la nube (correo sin contraseña). Todo pasa por funciones de Supabase
// que comprueban quién eres; nadie ve tu correo ni tu progreso, solo tu nombre y tu XP semanal.

const ERRORES_AMIGOS = {
  alias_invalido: 'El nombre debe tener de 2 a 20 letras, números, espacios, puntos o guiones.',
  codigo_no_existe: 'Ese código no existe. Revisa que esté bien escrito.',
  es_tu_codigo: 'Ese es tu propio código. Pásaselo a un amigo.',
  demasiados_amigos: 'Has llegado al máximo de 30 amigos.',
  sin_perfil: 'Primero crea tu nombre del ranking.',
  sin_sesion: 'Tu sesión ha caducado. Vuelve a entrar con tu correo en Ajustes.',
};

async function amigosRpc(nombre, args = {}) {
  const s = await sesionActual();
  if (!s) throw new Error(ERRORES_AMIGOS.sin_sesion);
  let r;
  try {
    r = await fetch(`${PREMIUM.nube.url}/rest/v1/rpc/${nombre}`, { method: 'POST', headers: cabecerasNube(s.access_token), body: JSON.stringify(args) });
  } catch (e) {
    throw new Error('No hay conexión. Inténtalo cuando vuelvas a estar en línea.');
  }
  const d = await r.json().catch(() => null);
  if (!r.ok) {
    const clave = Object.keys(ERRORES_AMIGOS).find((k) => d && typeof d.message === 'string' && d.message.includes(k));
    throw new Error(clave ? ERRORES_AMIGOS[clave] : 'No se ha podido completar. Inténtalo otra vez en un rato.');
  }
  return d;
}

// Sube mi nombre y mi XP de esta semana (si ya tengo perfil). Devuelve mi código o null.
async function amigosSubirXp() {
  if (!nubeDisponible() || !leerSesion() || !progreso.social.alias) return null;
  try {
    return await amigosRpc('entrenador_perfil_guardar', { p_alias: progreso.social.alias, p_xp: xpDeLaSemana(), p_semana: semanaActual() });
  } catch (e) {
    return null;
  }
}

function mostrarAmigos(entrada = 'adelante', aviso = '') {
  alTeclear = null;
  const mensaje = el('p', { class: 'ajuste-mensaje', role: 'status', 'aria-live': 'polite' }, aviso);
  const avisar = (t) => (mensaje.textContent = t);
  const cabecera = el('header', { class: 'cabecera' }, el('button', { class: 'volver', type: 'button', 'aria-label': 'Volver a los juegos', onclick: () => mostrarInicio('atras') }, '←'), marcador());
  const { fila } = naiFila('feliz', 'Compite con tus amigos: gana XP esta semana y sube en el ranking. Cada lunes empieza de cero.');
  const cuerpo = el('div', { class: 'amigos' });
  pintar(entrada, cabecera, el('main', { class: 'contenido' }, el('h1', {}, 'Ranking con amigos'), fila, cuerpo, mensaje));

  if (!nubeDisponible()) return cuerpo.append(el('p', {}, 'El ranking no está disponible ahora mismo.'));
  if (!leerSesion()) {
    return cuerpo.append(
      el('p', {}, 'Para jugar con amigos necesitas entrar con tu correo (sin contraseña). Es el mismo acceso de la copia en la nube.'),
      el('button', { class: 'boton', type: 'button', onclick: () => mostrarAjustes('Entra con tu correo en «Copia en la nube» para usar el ranking.') }, 'Ir a Ajustes')
    );
  }

  // 1) nombre del ranking
  if (!progreso.social.alias) {
    const campo = el('input', { type: 'text', class: 'campo-email', maxlength: '20', placeholder: 'Tu nombre en el ranking', autocomplete: 'nickname', 'aria-label': 'Tu nombre en el ranking' });
    return cuerpo.append(
      el('p', {}, 'Elige cómo quieres que te vean tus amigos. No uses tu nombre completo ni datos personales.'),
      campo,
      el('button', { class: 'boton', type: 'button', onclick: async (ev) => {
        const alias = campo.value.trim();
        ev.target.disabled = true;
        const antes = progreso.social.alias;
        progreso.social.alias = alias;
        try {
          await amigosRpc('entrenador_perfil_guardar', { p_alias: alias, p_xp: xpDeLaSemana(), p_semana: semanaActual() });
          guardarProgreso();
          mostrarAmigos('fundido');
        } catch (e) {
          progreso.social.alias = antes;
          avisar(e.message);
          ev.target.disabled = false;
        }
      } }, 'Crear mi perfil'),
      el('p', { class: 'ajuste-nota' }, 'Solo se muestran tu nombre y tu XP de la semana, y solo a quien añada tu código.')
    );
  }

  // 2) ranking
  cuerpo.append(el('p', { class: 'ajuste-nota' }, 'Cargando el ranking…'));
  (async () => {
    let codigo;
    try {
      codigo = await amigosSubirXp();
      const filas = await amigosRpc('entrenador_ranking');
      progreso.social.amigos = filas.filter((f) => !f.yo).length;
      calcularLogros();
      guardarProgreso();
      cuerpo.replaceChildren();
      cuerpo.append(
        el('ol', { class: 'ranking' }, filas.map((f, i) =>
          el('li', { class: 'ranking-fila' + (f.yo ? ' yo' : ''), 'data-codigo': f.codigo },
            el('span', { class: 'ranking-puesto' }, String(i + 1)),
            el('span', { class: 'juego-texto' }, el('strong', {}, f.alias + (f.yo ? ' (tú)' : '')), el('span', { class: 'juego-desc' }, `${f.xp_semana} XP esta semana`)),
            f.yo ? null : el('button', { class: 'boton mini-boton', type: 'button', 'aria-label': 'Quitar a ' + f.alias, onclick: async () => {
              try { await amigosRpc('entrenador_amigo_quitar', { p_codigo: f.codigo }); mostrarAmigos('fundido', f.alias + ' ya no está en tu ranking.'); } catch (e) { avisar(e.message); }
            } }, 'Quitar')))),
        filas.length < 2 ? el('p', { class: 'ajuste-nota' }, 'Todavía estás solo. Pasa tu código a un amigo o escribe el suyo abajo.') : null,
        el('div', { class: 'ranking-codigo' },
          el('span', { class: 'juego-texto' }, el('strong', {}, 'Tu código: ' + (codigo || '…')), el('span', { class: 'juego-desc' }, 'Quien lo escriba aquí te verá en su ranking')),
          el('button', { class: 'boton secundario mini-boton', type: 'button', onclick: async () => {
            const texto = `Practica cartas conmigo en el Entrenador de cartas: https://entrenador-cartas.onrender.com y añade mi código ${codigo} en «Ranking con amigos».`;
            try { if (navigator.share) await navigator.share({ text: texto }); else { await navigator.clipboard.writeText(texto); avisar('Invitación copiada.'); } } catch (e) { /* cancelado */ }
          } }, 'Invitar')),
        (() => {
          const campo = el('input', { type: 'text', class: 'campo-email', maxlength: '8', placeholder: 'Código de un amigo', autocapitalize: 'characters', autocomplete: 'off', 'aria-label': 'Código de un amigo' });
          return el('div', { class: 'ranking-anadir' }, campo,
            el('button', { class: 'boton secundario', type: 'button', onclick: async (ev) => {
              ev.target.disabled = true;
              try { const n = await amigosRpc('entrenador_amigo_agregar', { p_codigo: campo.value }); sonido('logro'); mostrarAmigos('fundido', `${n} ya está en tu ranking.`); }
              catch (e) { avisar(e.message); ev.target.disabled = false; }
            } }, 'Añadir amigo'));
        })()
      );
    } catch (e) {
      cuerpo.replaceChildren(el('p', {}, e.message));
    }
  })();
}
