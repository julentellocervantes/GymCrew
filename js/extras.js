// Pantallas extra: repaso del día / mis errores, ajustes con copia de seguridad, y entrenador de conteo.
// Se carga después de app.js y usa sus funciones (el, pintar, naiFila, progreso...).

// ---------- ajustes que cambian el aspecto ----------
function aplicarAjustes() {
  const a = progreso.ajustes || {};
  document.documentElement.dataset.letra = a.letra === 'grande' ? 'grande' : 'normal';
  document.documentElement.dataset.calma = a.calma ? 'si' : 'no';
}

// ---------- repaso del día y mis errores (mezclan ejercicios de todos los juegos) ----------
function iniciarRepasoGlobal(tipo) {
  const ids = tipo === 'errores' ? misErrores() : pendientesHoy();
  if (!ids.length) return mostrarInicio('fundido');
  const curso = { id: 'global', nombre: 'Repaso', icono: '🧠', color: '#7a5af8', unidades: [], global: true };
  mostrarLeccion(curso, {
    id: 'repaso-global',
    titulo: tipo === 'errores' ? 'Mis errores' : 'Repaso del día',
    icono: tipo === 'errores' ? '🩹' : '🧠',
    xp: 10,
    repaso: true,
    ejercicios: barajar(ids).slice(0, 8).map((id) => INDICE_EJERCICIOS[id].ejercicio),
  });
}

// ---------- ajustes, copia de seguridad y ayuda ----------
function descargarCopia() {
  const datos = { app: 'entrenador-cartas', version: 3, fecha: hoy(), progreso };
  const blob = new Blob([JSON.stringify(datos, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = el('a', { href: url, download: `entrenador-cartas-${hoy()}.json` });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

// Devuelve el progreso de un archivo de copia, o null si no es válido
function leerCopia(texto) {
  let datos;
  try {
    datos = JSON.parse(texto);
  } catch (e) {
    return null;
  }
  const crudo = datos && datos.app === 'entrenador-cartas' ? datos.progreso : null;
  if (!crudo || typeof crudo.xp !== 'number') return null;
  return normalizarProgreso(crudo);
}

function mostrarAjustes(aviso = '', animacion = 'fundido') {
  alTeclear = null;
  const mensaje = el('p', { class: 'ajuste-mensaje', role: 'status', 'aria-live': 'polite' }, aviso);
  const avisar = (t) => (mensaje.textContent = t);

  const segmentos = (opciones, actual, alElegir, etiqueta) =>
    el(
      'div',
      { class: 'segmentos', role: 'group', 'aria-label': etiqueta },
      opciones.map(([valor, texto]) =>
        el('button', { class: 'seg' + (valor === actual ? ' on' : ''), type: 'button', 'aria-pressed': String(valor === actual), onclick: () => alElegir(valor) }, texto)
      )
    );
  const interruptor = (texto, desc, activo, alCambiar) =>
    el(
      'button',
      { class: 'interruptor' + (activo ? ' on' : ''), type: 'button', role: 'switch', 'aria-checked': String(activo), onclick: () => alCambiar(!activo) },
      el('span', { class: 'juego-texto' }, el('strong', {}, texto), el('span', { class: 'juego-desc' }, desc)),
      el('span', { class: 'palanca', 'aria-hidden': 'true' }, el('span', {}))
    );
  const recargar = () => mostrarAjustes();

  const entrada = el('input', { type: 'file', accept: 'application/json,.json', class: 'oculto', 'aria-label': 'Elegir archivo de copia' });
  entrada.addEventListener('change', () => {
    const archivo = entrada.files && entrada.files[0];
    if (!archivo) return;
    const lector = new FileReader();
    lector.onload = () => {
      const p = leerCopia(String(lector.result));
      if (!p) return avisar('Ese archivo no parece una copia de seguridad de esta app.');
      if (!confirm(`¿Sustituir tu progreso actual (${progreso.xp} XP) por el de la copia (${p.xp} XP)?`)) return;
      progreso = p;
      guardarProgreso();
      aplicarAjustes();
      mostrarAjustes('Copia restaurada.', 'sin');
    };
    lector.onerror = () => avisar('No se ha podido leer el archivo.');
    lector.readAsText(archivo);
  });

  pintar(
    animacion,
    el('header', { class: 'cabecera' }, el('span', { class: 'logo' }, el('span', { class: 'logo-palo' }, '♥'), 'Entrenador de cartas'), marcador()),
    el(
      'main',
      { class: 'contenido' },
      el('h1', {}, '⚙️ Ajustes'),
      el(
        'section',
        { class: 'ajuste' },
        el('h2', {}, '🎯 Meta diaria'),
        el('p', {}, 'Los XP que quieres ganar cada día. Cumplirla no es obligatorio, es solo un empujón.'),
        segmentos([[10, '10 XP · suave'], [20, '20 XP · normal'], [30, '30 XP · serio'], [50, '50 XP · intenso']], progreso.meta, (v) => {
          progreso.meta = v;
          guardarProgreso();
          recargar();
        }, 'Meta diaria'),
        el('p', { class: 'ajuste-nota' }, '🧊 Cada 7 días de racha ganas un congelador (máximo 2): si un día no entrenas, lo usa para salvar tu racha.')
      ),
      el(
        'section',
        { class: 'ajuste' },
        el('h2', {}, '👀 Comodidad'),
        segmentos([['normal', 'Letra normal'], ['grande', 'Letra grande']], progreso.ajustes.letra, (v) => {
          progreso.ajustes.letra = v;
          guardarProgreso();
          aplicarAjustes();
          recargar();
        }, 'Tamaño de letra'),
        interruptor('Efectos de sonido', 'Sonidos al acertar, fallar y completar niveles', progreso.ajustes.sonido !== false, (v) => {
          progreso.ajustes.sonido = v;
          guardarProgreso();
          recargar();
          sonido('acierto'); // si lo acabas de activar, suena una muestra
        }),
        interruptor('Menos movimiento', 'Quita animaciones, confeti y chispas', !!progreso.ajustes.calma, (v) => {
          progreso.ajustes.calma = v;
          guardarProgreso();
          aplicarAjustes();
          recargar();
        })
      ),
      el(
        'section',
        { class: 'ajuste' },
        el('h2', {}, '💾 Copia de seguridad'),
        el('p', {}, 'Tu progreso solo vive en este navegador. Descarga una copia para no perderlo si cambias de móvil o borras los datos del navegador.'),
        el('div', { class: 'ajuste-botones' },
          el('button', { class: 'boton secundario', type: 'button', onclick: () => { descargarCopia(); avisar('Copia descargada.'); } }, 'Descargar copia'),
          el('button', { class: 'boton secundario', type: 'button', onclick: () => entrada.click() }, 'Restaurar copia')
        ),
        entrada,
        mensaje
      ),
      el(
        'section',
        { class: 'ajuste' },
        el('h2', {}, '🤝 Ayuda'),
        el('p', {}, 'Esta app es para aprender y no mueve dinero. Si el juego con dinero te preocupa a ti o a alguien cercano, hay ayuda gratuita y confidencial:'),
        el('a', { class: 'enlace-ayuda', href: 'https://jugadoresanonimos.org', target: '_blank', rel: 'noopener noreferrer' }, 'Jugadores Anónimos España ↗'),
        el('p', { class: 'ajuste-nota' }, 'También puedes buscar la Federación Española de Jugadores de Azar Rehabilitados (FEJAR) o hablar con tu médico de cabecera. El juego está permitido solo a mayores de 18 años.')
      ),
      el(
        'section',
        { class: 'ajuste' },
        el('h2', {}, '👋 Bienvenida'),
        el('p', {}, 'Vuelve a ver la pantalla de presentación.'),
        el('button', { class: 'boton secundario', type: 'button', onclick: () => mostrarBienvenida(true) }, 'Ver la bienvenida')
      ),
      el(
        'section',
        { class: 'ajuste' },
        el('h2', {}, '🗑️ Empezar de cero'),
        el('button', { class: 'boton peligro', type: 'button', onclick: reiniciarProgreso }, 'Reiniciar progreso')
      )
    )
  );
}

function reiniciarProgreso() {
  if (!confirm('¿Borrar tu XP, tu racha y todos los niveles completados? Esto no se puede deshacer (descarga antes una copia si quieres conservarla).')) return;
  const ajustes = progreso.ajustes;
  progreso = progresoNuevo();
  progreso.ajustes = ajustes; // la letra y el movimiento son de tu dispositivo, no de tu progreso
  guardarProgreso();
  mostrarInicio('fundido');
}

// ============================================================
// ENTRENADOR DE CONTEO (Hi-Lo)
// ============================================================
const RANGOS_BARAJA = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const PALOS_BARAJA = ['♠', '♥', '♦', '♣'];
// Hi-Lo: 2-6 suman 1, 7-9 valen 0, 10-As restan 1
function valorHiLo(cartaTexto) {
  const rango = cartaTexto.slice(0, -1);
  if (['2', '3', '4', '5', '6'].includes(rango)) return 1;
  if (['7', '8', '9'].includes(rango)) return 0;
  return -1;
}
const mazoParaConteo = (n) =>
  barajar(RANGOS_BARAJA.flatMap((r) => PALOS_BARAJA.map((p) => r + p))).slice(0, n);

const VELOCIDADES = [[2000, 'Tranquilo'], [1200, 'Normal'], [700, 'Rápido']];
const CANTIDADES = [10, 20, 30];
const confConteo = { vel: 1200, n: 20 };

function mostrarConteo(entrada = 'adelante') {
  alTeclear = null;
  const mejor = progreso.conteo.mejor;
  const { fila } = naiFila(
    'feliz',
    'Voy a enseñarte cartas una a una. Tú sumas +1 para 2-6, 0 para 7-9 y −1 para 10-As, y al final me dices cuánto vale la cuenta.',
    'pequena'
  );
  const grupo = (etiqueta, opciones, actual, alElegir) =>
    el(
      'div',
      { class: 'segmentos', role: 'group', 'aria-label': etiqueta },
      opciones.map(([v, t]) => el('button', { class: 'seg' + (v === actual ? ' on' : ''), type: 'button', 'aria-pressed': String(v === actual), onclick: () => alElegir(v) }, t))
    );
  const pinta = () => mostrarConteo('sin');
  pintar(
    entrada,
    el('header', { class: 'cabecera' }, el('button', { class: 'volver', type: 'button', 'aria-label': 'Volver a los juegos', onclick: () => mostrarInicio('atras') }, '←'), marcador()),
    el(
      'main',
      { class: 'contenido' },
      el('h1', {}, '⏱️ Entrena el conteo'),
      fila,
      el('section', { class: 'ajuste' }, el('h2', {}, 'Velocidad'), grupo('Velocidad', VELOCIDADES.map(([v, t]) => [v, `${t} · ${(v / 1000).toFixed(1)} s`]), confConteo.vel, (v) => { confConteo.vel = v; pinta(); })),
      el('section', { class: 'ajuste' }, el('h2', {}, 'Cartas'), grupo('Cantidad de cartas', CANTIDADES.map((n) => [n, String(n)]), confConteo.n, (v) => { confConteo.n = v; pinta(); })),
      el('p', { class: 'aviso' }, mejor ? `Tu récord: ${mejor} cartas por minuto sin fallar la cuenta` : 'Aún no tienes récord: acierta la cuenta para conseguir el primero.'),
      el('p', { class: 'aviso' }, 'Este ejercicio es visual y depende del tiempo: si lo necesitas más lento, elige «Tranquilo».')
    ),
    el('div', { class: 'pie' }, el('button', { class: 'boton', type: 'button', onclick: () => correrConteo() }, 'Empezar'))
  );
}

function correrConteo() {
  const { vel, n } = confConteo;
  const cartas = mazoParaConteo(n);
  const total = cartas.reduce((s, c) => s + valorHiLo(c), 0);
  const zona = el('div', { class: 'conteo-zona' }, el('p', { class: 'conteo-listo' }, '¿Listo?'));
  const contador = el('p', { class: 'aviso conteo-contador' }, `0 / ${n}`);
  const salir = () => mostrarConteo('atras');
  alTeclear = (e) => {
    if (e.key === 'Escape') salir();
  };
  pintar(
    'adelante',
    el('header', { class: 'cabecera-leccion' }, el('button', { class: 'cerrar', type: 'button', 'aria-label': 'Parar el entrenamiento', onclick: salir }, '✕')),
    el('main', { class: 'contenido centro' }, el('p', { class: 'etiqueta' }, 'Suma mentalmente'), zona, contador)
  );
  let k = 0;
  const siguiente = () => {
    if (!zona.isConnected) return; // saliste de la pantalla: se corta el entrenamiento
    if (k >= cartas.length) return preguntarConteo(cartas, total);
    zona.replaceChildren(carta(cartas[k], 0));
    sonido('carta');
    k += 1;
    contador.textContent = `${k} / ${n}`;
    setTimeout(siguiente, vel);
  };
  setTimeout(siguiente, 900);
}

function preguntarConteo(cartas, total) {
  let valor = 0;
  const pantalla = el('span', { class: 'conteo-valor', 'aria-live': 'polite' }, '0');
  const mostrar = () => (pantalla.textContent = (valor > 0 ? '+' : valor < 0 ? '−' : '') + Math.abs(valor));
  const cambiar = (d) => {
    valor = Math.max(-40, Math.min(40, valor + d));
    mostrar();
  };
  const { fila } = naiFila('pensando', '¿Cuánto vale la cuenta ahora mismo?', 'pequena');
  alTeclear = (e) => {
    if (e.key === 'ArrowUp' || e.key === '+') cambiar(1);
    else if (e.key === 'ArrowDown' || e.key === '-') cambiar(-1);
    else if (e.key === 'Enter') {
      e.preventDefault();
      resultadoConteo(cartas, total, valor);
    }
  };
  pintar(
    'fundido',
    el('main', { class: 'contenido centro' }, fila,
      el('div', { class: 'conteo-selector' },
        el('button', { class: 'conteo-paso', type: 'button', 'aria-label': 'Restar uno', onclick: () => cambiar(-1) }, '−'),
        pantalla,
        el('button', { class: 'conteo-paso', type: 'button', 'aria-label': 'Sumar uno', onclick: () => cambiar(1) }, '+')
      ),
      el('p', { class: 'aviso' }, 'Usa − y + (o las flechas del teclado) y pulsa Comprobar.')
    ),
    el('div', { class: 'pie' }, el('button', { class: 'boton', type: 'button', onclick: () => resultadoConteo(cartas, total, valor) }, 'Comprobar'))
  );
}

function resultadoConteo(cartas, total, dicho) {
  const acierto = dicho === total;
  const xp = acierto ? 5 + Math.round(cartas.length / 4) : 2;
  const rangoAntes = rangoDe(progreso.xp).indice;
  const actividad = registrarActividad(xp);
  progreso.conteo.sesiones += 1;
  if (acierto) progreso.conteo.mejor = Math.max(progreso.conteo.mejor, Math.round(60000 / confConteo.vel));
  const logros = calcularLogros();
  guardarProgreso();
  sonido(acierto ? 'nivel' : 'error');
  if (actividad.metaCumplida) sonido('meta', 700);
  if (logros.length) sonido('logro', actividad.metaCumplida ? 1300 : 700);
  const nuevoRango = rangoDe(progreso.xp);

  const signo = (v) => (v > 0 ? '+' + v : v < 0 ? '−' + Math.abs(v) : '0');
  alTeclear = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      mostrarConteo('atras');
    }
  };
  const { fila } = naiFila(
    acierto ? 'celebrando' : 'triste',
    acierto ? '¡Cuenta perfecta! Tienes buen ojo.' : `La cuenta era ${signo(total)} y tú dijiste ${signo(dicho)}. Repasa las cartas y vuelve a intentarlo.`,
    'grande'
  );
  const notas = [el('p', { class: 'resultado-dato aparece', style: '--i:2' }, `+${xp} XP`)];
  if (actividad.metaCumplida) notas.push(el('p', { class: 'resultado-nuevo aparece', style: '--i:3' }, '🎯 ¡Meta diaria cumplida!'));
  if (actividad.congeladorGanado) notas.push(el('p', { class: 'resultado-nuevo aparece', style: '--i:3' }, '🧊 ¡Has ganado un congelador de racha!'));
  if (nuevoRango.indice > rangoAntes) notas.push(el('p', { class: 'resultado-nuevo aparece', style: '--i:4' }, `${nuevoRango.actual.icono} ¡Nuevo rango: ${nuevoRango.actual.nombre}!`));
  logros.forEach((l, i) => notas.push(el('p', { class: 'resultado-logro aparece', style: `--i:${5 + i}` }, `${l.icono} Logro: ${l.titulo}`)));

  pintar(
    'adelante',
    el('main', { class: 'contenido centro' },
      el('h1', { class: 'resultado-titulo' }, acierto ? '¡Bien contado!' : 'Casi'),
      fila,
      notas,
      el('div', { class: 'mesa conteo-repaso' },
        el('p', { class: 'mesa-etiqueta' }, 'Las cartas, con su valor'),
        el('div', { class: 'conteo-lista' }, cartas.map((c) => el('span', { class: 'conteo-item' }, carta(c, 0), el('small', {}, signo(valorHiLo(c))))))
      )
    ),
    el('div', { class: 'pie' },
      el('button', { class: 'boton', type: 'button', onclick: () => correrConteo() }, 'Otra vez'),
      el('button', { class: 'enlace', type: 'button', onclick: () => mostrarConteo('atras') }, 'Volver')
    ),
    acierto ? confeti(40) : null
  );
}


// ============================================================
// BIENVENIDA
// ============================================================
function mostrarBienvenida(repetida = false) {
  const { fila } = naiFila('celebrando', repetida ? '¡Hola otra vez! Esto es lo que puedes hacer aquí.' : '¡Hola! Soy Nai y voy a ser tu entrenador de cartas.', 'hero');
  const empezar = (destino) => {
    progreso.bienvenida = true;
    guardarProgreso();
    destino();
  };
  alTeclear = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      empezar(() => mostrarInicio('adelante'));
    }
  };
  const ventaja = (icono, titulo, desc, i) =>
    el('li', { class: 'bienvenida-item aparece', style: `--i:${i}` }, el('span', { class: 'bienvenida-icono', 'aria-hidden': 'true' }, icono), el('span', { class: 'juego-texto' }, el('strong', {}, titulo), el('span', { class: 'juego-desc' }, desc)));
  pintar(
    'fundido',
    el('main', { class: 'contenido bienvenida' },
      fila,
      almacenamientoFallo ? el('p', { class: 'alerta', role: 'alert' }, 'Tu navegador no deja guardar el progreso (¿modo privado?). Puedes seguir, pero al cerrar se perderá.') : null,
      el('h1', { class: 'bienvenida-titulo' }, 'Bienvenido al Entrenador de cartas'),
      el('p', { class: 'bienvenida-sub' }, 'Aprende blackjack, póker y mus practicando situaciones reales, poco a poco y sin dinero.'),
      el('ul', { class: 'bienvenida-lista' },
        ventaja('🎮', 'Aprende jugando', 'Niveles cortos con preguntas de todo tipo: test, ordenar, unir, tocar cartas…', 0),
        ventaja('🔁', 'Repasa lo que fallas', 'La app te vuelve a preguntar justo cuando toca para que no se te olvide.', 1),
        ventaja('🧰', 'Herramientas a mano', 'Tabla de estrategia, calculadoras y un contador de cartas en la pestaña Útil.', 2),
        ventaja('⏱️', 'Entrena el conteo', 'Cartas a toda velocidad con el sistema Hi-Lo.', 3)),
      el('p', { class: 'aviso' }, 'Contenido educativo. Sin dinero real. Solo para mayores de 18 años.')),
    el('div', { class: 'pie' },
      el('button', { class: 'boton', type: 'button', onclick: () => empezar(() => mostrarInicio('adelante')) }, repetida ? 'Volver a los juegos' : 'Empezar'),
      el('button', { class: 'enlace', type: 'button', onclick: () => empezar(() => mostrarUtil('adelante')) }, 'Ya sé jugar: ir a las herramientas'))
  );
}

// ============================================================
// BARRA INFERIOR (Juegos · Útil · Ajustes)
// ============================================================
const PESTANAS = [
  { id: 'juegos', icono: '🃏', texto: 'Juegos', ir: () => mostrarInicio('fundido') },
  { id: 'util', icono: '🧰', texto: 'Útil', ir: () => mostrarUtil('fundido') },
  { id: 'ajustes', icono: '⚙️', texto: 'Ajustes', ir: () => mostrarAjustes('', 'fundido') },
];
let barraPestana = null;
function barra(activa) {
  const nav = document.getElementById('barra');
  if (!nav) return;
  barraPestana = activa;
  document.body.classList.toggle('con-barra', !!activa);
  nav.hidden = !activa;
  if (!activa) return;
  if (!nav.children.length)
    nav.append(
      ...PESTANAS.map((t) =>
        el('button', { class: 'pestana', type: 'button', 'data-pestana': t.id, onclick: () => t.ir() }, el('span', { class: 'pestana-icono', 'aria-hidden': 'true' }, t.icono), el('span', { class: 'pestana-texto' }, t.texto))
      )
    );
  nav.querySelectorAll('.pestana').forEach((b) => {
    const on = b.dataset.pestana === activa;
    b.classList.toggle('activa', on);
    if (on) b.setAttribute('aria-current', 'page');
    else b.removeAttribute('aria-current');
  });
}
