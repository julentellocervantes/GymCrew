// TEST DE NIVEL: 12 preguntas, una por «punto de control» repartido a lo largo de los 100 niveles de un juego.
// Sin segundas oportunidades. Con el resultado se recomienda el nivel de partida y, si quieres, se marcan como hechos los anteriores (sin XP ni fichas).
// Se carga después de simulador.js.

const TEST_PUNTOS = [1, 6, 12, 20, 28, 36, 45, 55, 65, 75, 85, 95]; // posición (desde 0) del nivel de cada pregunta
const TEST_EVITAR = ['relampago', 'memoria', 'clasificar', 'cuenta_corriente']; // formatos largos: no encajan en un test rápido

function preguntasTestNivel(curso) {
  const lista = niveles(curso);
  return TEST_PUNTOS.filter((p) => p < lista.length).map((p) => {
    const l = lista[p];
    const util = l.ejercicios.filter((e) => !TEST_EVITAR.includes(e.tipo));
    return { punto: p, nivel: l, ejercicio: (util.length ? util : l.ejercicios)[p % (util.length || l.ejercicios.length)] };
  });
}

// Nivel recomendado (posición desde 0): se sube mientras no falles dos preguntas. Función pura, la usa también tests/navegador.js
function nivelRecomendado(puntos, fallos) {
  let falladas = 0, ultimoBueno = 0;
  for (const p of puntos) {
    if (fallos[p]) { falladas += 1; if (falladas >= 2) break; } else ultimoBueno = p;
  }
  return ultimoBueno;
}

function mostrarTestNivel(entrada = 'adelante') {
  alTeclear = null;
  const { fila } = naiFila('feliz', `Te hago ${TEST_PUNTOS.length} preguntas, de fáciles a difíciles, sin segundas oportunidades. Con eso te digo por dónde empezar.`, 'pequena');
  pintar(
    entrada,
    el('header', { class: 'cabecera' }, el('button', { class: 'volver', type: 'button', 'aria-label': 'Volver', onclick: () => mostrarInicio('atras') }, '←'), marcador()),
    el('main', { class: 'contenido' },
      el('h1', {}, '🧭 Test de nivel'),
      fila,
      el('p', { class: 'aviso' }, 'Elige el juego. Si ya sabes jugar, te ahorra los niveles que ya dominas; si no, te lo dice y empiezas desde el principio.'),
      CURSOS.map((c) => {
        const hechos = hechosDe(c), total = niveles(c).length;
        return el('button', { class: 'repaso fijo conteo mini', type: 'button', 'data-curso': c.id, style: `--acento:${c.color}`, onclick: () => iniciarTestNivel(c) },
          el('span', { class: 'repaso-icono' }, c.icono),
          el('span', { class: 'juego-texto' }, el('strong', {}, c.nombre), el('span', { class: 'juego-desc' }, hechos ? `Llevas ${hechos} de ${total} niveles` : 'Todavía no has empezado')),
          el('span', { class: 'flecha', 'aria-hidden': 'true' }, '›'));
      }))
  );
}

function iniciarTestNivel(curso) {
  const preguntas = preguntasTestNivel(curso);
  const porId = {};
  preguntas.forEach((q) => { porId[q.ejercicio.id] = q.punto; });
  mostrarLeccion(curso, {
    id: 'test-nivel', titulo: 'Test de nivel', icono: '🧭', xp: 10, repaso: true, sinReintento: true,
    ejercicios: preguntas.map((q) => q.ejercicio),
    alTerminar: (falladas) => {
      const fallos = {};
      Object.keys(falladas).forEach((id) => { fallos[porId[id]] = true; });
      mostrarResultadoTestNivel(curso, preguntas, fallos);
    },
  });
}

function mostrarResultadoTestNivel(curso, preguntas, fallos) {
  alTeclear = null;
  const lista = niveles(curso);
  const puntos = preguntas.map((q) => q.punto);
  const aciertos = puntos.filter((p) => !fallos[p]).length;
  const rec = nivelRecomendado(puntos, fallos);
  const empieza = lista[rec];
  const yaVa = hechosDe(curso);
  const todoBien = aciertos === puntos.length;
  const { fila } = naiFila(rec >= 30 ? 'celebrando' : 'feliz',
    todoBien ? '¡Ni un fallo! Dominas este juego de arriba abajo.' : rec === 0 ? 'Mejor empezar desde el principio: así se te quedan bien las bases.' : `Ya sabes bastante. Te recomiendo empezar en el nivel ${rec + 1}.`, 'grande');
  const saltar = () => {
    lista.slice(0, rec).forEach((l) => { if (!progreso.completadas[l.id]) progreso.completadas[l.id] = true; });
    guardarProgreso();
    mostrarMapa(curso, 'adelante');
  };
  pintar('adelante',
    el('main', { class: 'contenido centro', style: `--acento:${curso.color}` },
      el('h1', { class: 'resultado-titulo' }, 'Tu nivel en ' + curso.nombre),
      fila,
      el('p', { class: 'resultado-dato' }, `Aciertos: ${aciertos} de ${puntos.length}`),
      el('p', { class: 'resultado-dato', 'data-recomendado': String(rec + 1) }, rec === 0 ? 'Empiezas en el nivel 1' : `Empiezas en el nivel ${rec + 1}: «${empieza.titulo}»`),
      rec > 0 && yaVa < rec ? el('p', { class: 'aviso' }, `Marcaré como hechos los ${rec} niveles anteriores, sin darte XP ni fichas. Puedes repasarlos cuando quieras.`) : null,
      rec > 0 && yaVa >= rec ? el('p', { class: 'aviso' }, 'Ya vas por delante de lo que marca el test: sigue por donde ibas.') : null),
    el('div', { class: 'pie' },
      rec > 0 && yaVa < rec ? el('button', { class: 'boton', type: 'button', 'data-accion': 'saltar', onclick: saltar }, `Empezar en el nivel ${rec + 1}`) : el('button', { class: 'boton', type: 'button', onclick: () => mostrarMapa(curso, 'adelante') }, 'Ir al mapa'),
      el('button', { class: 'boton secundario', type: 'button', onclick: () => mostrarInicio('atras') }, 'Ahora no'))
  );
}
