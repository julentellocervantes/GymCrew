// SIETE FORMAS MÁS DE RESPONDER, repartidas por todos los niveles (normales y Oro).
// No son preguntas nuevas: cada una convierte un ejercicio que ya existe (mismo id, misma respuesta) en otra forma de contestarlo,
// así que la repetición espaciada, los errores y las estadísticas siguen funcionando. El ejercicio original queda en `base`
// (con su `chequeo`) y tests/validar.js lo sigue comprobando con sus reglas independientes.
//
//   vf         ¿verdadero o falso?  Se propone una respuesta y se juzga                { propuesta, verdadero, falsa }
//   duelo      dos respuestas frente a frente                                         { acierto, falsa }
//   eliminar   tacha las respuestas incorrectas hasta que quede una                   { }  (usa base.opciones)
//   reloj      contrarreloj: una respuesta de las de siempre, pero con tiempo        { segundos }
//   construir  arma la respuesta tocando palabras                                      { palabras, banco }
//   memoria    encuentra las parejas boca abajo (viene de «emparejar»)                { pares }
//   errata     una ficha está fuera de sitio: tócala (viene de «ordenar»)             { elementos, secuencia, intruso }
(function () {
  const semilla = (t) => { let h = 1779033703; for (const c of t) h = Math.imul(h ^ c.charCodeAt(0), 3432918353) << 13 | h >>> 19; return () => { h = Math.imul(h ^ h >>> 16, 2246822507); h = Math.imul(h ^ h >>> 13, 3266489909); return ((h ^= h >>> 16) >>> 0) / 4294967296; }; };
  const entre = (r, n) => Math.floor(r() * n);
  const mezclar = (r, l) => { const a = l.slice(); for (let i = a.length - 1; i > 0; i--) { const j = entre(r, i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };

  const esTest = (e) => (e.tipo === 'opcion_unica' || e.tipo === 'accion') && Array.isArray(e.opciones) && e.opciones.length >= 2 && Number.isInteger(e.correcta);
  const palabrasDe = (t) => String(t).split(' ').filter(Boolean);
  const FORMAS = {
    vf(e, r) {
      if (!esTest(e)) return null;
      const mala = mezclar(r, e.opciones.filter((_, i) => i !== e.correcta))[0];
      const verdadero = r() < 0.5;
      return { propuesta: verdadero ? e.opciones[e.correcta] : mala, verdadero, falsa: mala };
    },
    duelo(e, r) {
      if (!esTest(e) || e.opciones.length < 3) return null;
      return { acierto: e.opciones[e.correcta], falsa: mezclar(r, e.opciones.filter((_, i) => i !== e.correcta))[0] };
    },
    eliminar(e) {
      if (!esTest(e) || e.opciones.length < 3) return null;
      return {};
    },
    reloj(e) {
      if (!esTest(e)) return null;
      return { segundos: 12 };
    },
    construir(e, r) {
      if (e.tipo !== 'opcion_unica' || !esTest(e)) return null;
      const texto = e.opciones[e.correcta];
      const palabras = palabrasDe(texto);
      if (palabras.length < 3 || palabras.length > 9 || texto.length > 70) return null;
      if (e.opciones.some((o, i) => i !== e.correcta && o === texto)) return null;
      const propias = new Set(palabras);
      const extra = [];
      for (const o of mezclar(r, e.opciones.filter((_, i) => i !== e.correcta))) for (const w of palabrasDe(o)) if (!propias.has(w) && !extra.includes(w)) extra.push(w);
      const banco = palabras.concat(extra.slice(0, palabras.length >= 6 ? 3 : 2));
      if (banco.length === palabras.length) return null; // sin distractores no hay reto
      return { palabras, banco };
    },
    memoria(e) {
      if (e.tipo !== 'emparejar' || !Array.isArray(e.pares) || e.pares.length < 3 || e.pares.length > 5) return null;
      if (e.pares.some((p) => String(p[0]).length > 30 || String(p[1]).length > 30)) return null;
      const lados = e.pares.flatMap((p) => p);
      if (new Set(lados).size !== lados.length) return null; // las cartas de una pareja deben poder distinguirse
      return { pares: e.pares };
    },
    errata(e, r) {
      if (e.tipo !== 'ordenar' || !Array.isArray(e.elementos) || e.elementos.length < 4 || new Set(e.elementos).size !== e.elementos.length) return null;
      const n = e.elementos.length;
      for (let intento = 0; intento < 40; intento++) {
        const de = entre(r, n), a = entre(r, n);
        if (Math.abs(de - a) < 2) continue;
        const sec = e.elementos.map((_, i) => i);
        sec.splice(de, 1);
        sec.splice(a, 0, de);
        // solo una ficha es la culpable: al quitarla, el resto queda en orden
        const culpables = sec.filter((_, k) => { const resto = sec.filter((__, j) => j !== k); return resto.every((v, j) => j === 0 || resto[j - 1] < v); });
        if (culpables.length !== 1 || culpables[0] !== de) continue;
        return { elementos: e.elementos, secuencia: sec, intruso: sec.indexOf(de) };
      }
      return null;
    },
  };
  const ORDEN = ['vf', 'eliminar', 'duelo', 'reloj', 'construir', 'memoria', 'errata'];

  function convertir(e, forma, r) {
    const datos = FORMAS[forma](e, r);
    if (!datos) return null;
    const tema = String(e.pregunta).replace(/[.:]\s*$/, '');
    // en memoria y errata la pregunta original (y su dibujo de cartas) ya no describe lo que hay que hacer
    const pregunta = forma === 'errata' ? `Una ficha está fuera de sitio. ¿Cuál? Tema: ${tema.charAt(0).toLowerCase() + tema.slice(1)}.` : forma === 'memoria' ? `Encuentra las parejas boca abajo. ${e.pregunta}` : e.pregunta;
    const situacion = forma === 'errata' || forma === 'memoria' ? undefined : e.situacion;
    return Object.assign({ tipo: forma, id: e.id, pregunta, explicacion: e.explicacion, situacion, base: e }, datos);
  }

  // Cada nivel cambia unos 2 o 3 ejercicios (casi la mitad), cada uno a una forma distinta, empezando por una distinta según el nivel
  function variar(l) {
    if (l.variado || !Array.isArray(l.ejercicios)) return;
    l.variado = true;
    const r = semilla('formas|' + l.id);
    const n = l.ejercicios.length;
    const objetivo = Math.min(3, Math.max(2, Math.round(n * 0.4)));
    const usadas = new Set();
    const salida = l.ejercicios.slice();
    const orden = mezclar(r, l.ejercicios.map((_, i) => i).filter((i) => i > 0 || n < 5)); // el primero se queda como está: entrada suave
    const inicio = entre(r, ORDEN.length);
    let hechos = 0;
    for (const i of orden) {
      if (hechos >= objetivo) break;
      const e = l.ejercicios[i];
      for (let k = 0; k < ORDEN.length; k++) {
        const forma = ORDEN[(inicio + hechos + k) % ORDEN.length];
        if (usadas.has(forma)) continue;
        const nuevo = convertir(e, forma, semilla('f|' + e.id + forma));
        if (!nuevo) continue;
        salida[i] = nuevo;
        usadas.add(forma);
        hechos++;
        break;
      }
    }
    l.ejercicios = salida;
  }

  const todos = [];
  for (const c of CURSOS) for (const u of c.unidades) for (const l of u.lecciones) todos.push(l);
  for (const id of Object.keys(ORO)) todos.push(ORO[id]);
  GEN.transformar(variar, todos);
  GEN.FORMAS_INTERACTIVAS = ORDEN;
})();
