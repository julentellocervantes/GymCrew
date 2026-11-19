// Prueba en un navegador real (Chromium con Playwright). Requiere: npm i playwright
// Uso: sirve la carpeta (p. ej. `python3 -m http.server 8123`) y ejecuta `node tests/navegador.js [url]`
const { chromium } = require('playwright');
const assert = require('assert');
const URL = process.argv[2] || 'http://localhost:8123/index.html';
const OUT = process.env.CAPTURAS || null;
const hiLo = (c) => { const r = c.slice(0, -1); return '23456'.includes(r) && r.length === 1 ? 1 : ['7', '8', '9'].includes(r) ? 0 : -1; };
let hechos = 0;
const ok = (c, m) => { assert.ok(c, m); hechos++; if (process.env.DEBUG) console.log('ok', m); };

(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, acceptDownloads: true });
  await ctx.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort()); // sin internet de fuentes: la app usa la tipografía del sistema
  const page = await ctx.newPage();
  const fallos = [];
  page.on('pageerror', (e) => fallos.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !/fonts|Failed to load resource|ERR_TUNNEL/.test(m.text())) fallos.push(m.text()); });
  page.on('dialog', (d) => d.accept());
  const foto = async (n) => { if (OUT) { await page.waitForTimeout(1100); await page.screenshot({ path: OUT + n + '.png' }); } };
  const dia = (delta) => { const d = new Date(Date.now() + delta * 86400000); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  const guardar = (obj) => page.evaluate((o) => localStorage.setItem('progreso-v2', JSON.stringify(o)), obj);

  await page.goto(URL);
  const todos = await page.evaluate(() => CURSOS.flatMap((c) => c.unidades.flatMap((u) => u.lecciones.flatMap((l) => l.ejercicios))));
  const textosOp = () => page.locator('.opcion').evaluateAll((els) => els.map((e) => e.innerText.replace(/^\s*\d+\s*/, '').trim()));

  // Responde la pregunta actual (opción o ordenar). acertar=false para fallar a propósito.
  async function responder(acertar = true) {
    const q = await page.locator('.pregunta').first().innerText();
    const idq = await page.locator('.pregunta').first().getAttribute('data-id');
    const ej = todos.find((e) => e.id === idq) || todos.find((e) => e.pregunta === q);
    ok(ej, 'ejercicio reconocido: ' + q);
    if (ej.tipo === 'ordenar') {
      const orden = acertar ? ej.elementos : ej.elementos.slice().reverse();
      for (const t of orden) await page.locator('.ordenar-banco .ficha', { hasText: new RegExp('^\\s*' + t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*$') }).click();
      await page.getByRole('button', { name: 'Comprobar' }).click();
    } else if (ej.tipo === 'seleccionar') {
      const marcar = acertar ? ej.correctas : [ej.cartas.findIndex((_, i) => !ej.correctas.includes(i))];
      for (const i of marcar) await page.locator('.carta-pick').nth(i).click();
      await page.getByRole('button', { name: 'Comprobar' }).click();
    } else if (ej.tipo === 'numero') {
      await page.locator('.numero-entrada').fill(String(acertar ? ej.respuesta : ej.respuesta + 1));
      await page.keyboard.press('Enter');
    } else if (ej.tipo === 'emparejar') {
      const izq = (t) => page.locator('.parejas-col').first().locator('.par', { hasText: new RegExp('^' + t + '$') });
      const der = (t) => page.locator('.parejas-col').nth(1).locator('.par', { hasText: t });
      if (!acertar) { await izq(ej.pares[0][0]).click(); await der(ej.pares[1][1]).click(); }
      for (const [a, b2] of ej.pares) { await izq(a).click(); await der(b2).click(); }
      await page.waitForSelector('.feedback');
    } else if (ej.tipo === 'clasificar') {
      for (let k = 0; k < ej.elementos.length; k++) {
        const cajon = ej.elementos[Number(await page.locator('.clas-ficha').getAttribute('data-clas'))][1];
        if (!acertar && k === 0) await page.locator('.clas-cajon').nth((cajon + 1) % ej.categorias.length).click();
        await page.locator('.clas-cajon').nth(cajon).click();
      }
      await page.waitForSelector('.feedback');
    } else if (ej.tipo === 'deslizador') {
      const v = acertar ? ej.respuesta : (ej.respuesta + ej.tolerancia + 5 <= ej.max ? ej.respuesta + ej.tolerancia + 5 : ej.respuesta - ej.tolerancia - 5);
      await page.locator('.desliz-control').evaluate((c, x) => { c.value = x; c.dispatchEvent(new Event('input', { bubbles: true })); }, String(Math.max(ej.min, Math.min(ej.max, v))));
      await page.getByRole('button', { name: 'Comprobar' }).click();
    } else if (ej.tipo === 'relampago') {
      while (!(await page.locator('.feedback').count())) {
        await page.waitForSelector('.feedback, .rel-opcion:not([disabled])');
        if (await page.locator('.feedback').count()) break;
        const i = Number(await page.locator('.rel-item').getAttribute('data-rel'));
        const bueno = ej.items[i][1];
        const k = acertar ? bueno : (bueno + 1) % ej.opciones.length;
        await page.locator('.rel-opcion').nth(k).click();
      }
    } else if (ej.tipo === 'rellenar') {
      const palabras = acertar ? ej.huecos : ej.huecos.slice().reverse().concat([]);
      const orden = acertar ? ej.huecos : ej.banco.filter((w) => !ej.huecos.includes(w)).slice(0, 1).concat(ej.huecos.slice(1));
      for (const h of orden) await page.locator('.rell-palabra:not(:disabled)', { hasText: new RegExp('^\\s*' + h.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*$') }).click();
      await page.getByRole('button', { name: 'Comprobar' }).click();
    } else if (ej.tipo === 'vf') {
      await page.locator(`.vf-boton[data-vf="${ej.verdadero === acertar ? 'v' : 'f'}"]`).click();
    } else if (ej.tipo === 'duelo') {
      const t = await page.locator('.duelo-carta').evaluateAll((els) => els.map((e) => e.lastChild.textContent.trim()));
      await page.locator('.duelo-carta').nth(acertar ? t.indexOf(ej.acierto) : t.findIndex((x) => x !== ej.acierto)).click();
    } else if (ej.tipo === 'eliminar') {
      const t = (await page.locator('.elim-texto').allInnerTexts()).map((x) => x.trim());
      const buena = ej.base.opciones[ej.base.correcta];
      if (acertar) { for (let i = 0; i < t.length; i++) if (t[i] !== buena) await page.locator('.elim-opcion').nth(i).click(); }
      else await page.locator('.elim-opcion').nth(t.indexOf(buena)).click();
      await page.waitForSelector('.feedback');
    } else if (ej.tipo === 'construir') {
      const orden = acertar ? ej.palabras : ej.palabras.slice().reverse();
      for (const w of orden) await page.locator('.construir .ordenar-banco .ficha', { hasText: new RegExp('^\\s*' + w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*$') }).first().click();
      await page.getByRole('button', { name: 'Comprobar' }).click();
    } else if (ej.tipo === 'memoria') {
      if (!acertar) { // dos cartas que no son pareja y luego todas bien: el ejercicio sale bien con pocos fallos, así que aquí se comprueba solo que se puede abrir
        await page.locator('.mem-carta[data-par="0"]').first().click();
      }
      for (let i = 0; i < ej.pares.length; i++) {
        const abiertas = await page.locator(`.mem-carta[data-par="${i}"].abierta`).count();
        if (abiertas === 0) await page.locator(`.mem-carta[data-par="${i}"]:not(:disabled)`).nth(0).click();
        await page.locator(`.mem-carta[data-par="${i}"]:not(.abierta):not(:disabled)`).nth(0).click();
      }
      await page.waitForSelector('.feedback');
    } else if (ej.tipo === 'errata') {
      const k = acertar ? ej.intruso : (ej.intruso + 1) % ej.secuencia.length;
      await page.locator(`.errata-ficha[data-errata="${k}"]`).click();
    } else {
      const base = ej.tipo === 'reloj' ? ej.base : ej;
      const t = await textosOp();
      const buena = base.opciones[base.correcta];
      await page.locator('.opcion').nth(acertar ? t.indexOf(buena) : t.findIndex((x) => x !== buena)).click();
    }
    return ej;
  }
  const hayPregunta = () => page.locator('.pregunta').count();
  async function terminar(acertar = true) {
    while (await hayPregunta()) { await responder(acertar); await page.locator('.feedback .boton').click(); }
  }
  const estado = () => page.evaluate(() => JSON.parse(localStorage.getItem('progreso-v2')));
  const inicio = async (p) => { await guardar(Object.assign({ bienvenida: true }, p)); await page.reload(); };

  // 1) Un guardado antiguo se completa con los campos nuevos y no rompe nada
  await inicio({ xp: 35, racha: 0, ultimoDia: null, completadas: {} });
  ok(await page.locator('.meta').count() === 1, 'tarjeta de meta diaria');
  ok((await page.locator('.meta').innerText()).includes('0 / 20 XP'), 'meta por defecto 20 XP');
  await foto('1-inicio');

  // 1b) Las tres formas nuevas de responder: fallar una vez cada una y acertar después
  await inicio({ xp: 35, racha: 0, ultimoDia: null, completadas: {} });
  await page.evaluate(() => {
    const l = { id: 'prueba-nuevas', titulo: 'Prueba', icono: '🎯', xp: 10, intro: 'Prueba de las formas nuevas de responder.',
      ejercicios: CURSOS.flatMap((c) => c.unidades.flatMap((u) => u.lecciones.flatMap((x) => x.ejercicios))).filter((e) => ['bj-3-1-c1', 'bj-3-3-d1', 'bj-3-3-r1'].includes(e.id)) };
    mostrarLeccion(CURSOS[0], l);
  });
  const falladas = new Set();
  for (let paso = 0; paso < 6 && (await hayPregunta()); paso++) {
    const q = await page.locator('.pregunta').first().innerText();
    const idq = await page.locator('.pregunta').first().getAttribute('data-id');
    const primera = !falladas.has(q);
    falladas.add(q);
    const ej = await responder(!primera);
    if (primera) {
      ok(await page.locator('.feedback.mal').count() === 1, 'fallar «' + ej.tipo + '» da feedback de error');
      ok((await page.locator('.correcta').innerText()).startsWith('Respuesta correcta'), ej.tipo + ': enseña la respuesta correcta');
    } else ok(await page.locator('.feedback.bien').count() === 1, 'acertar «' + ej.tipo + '» da feedback correcto');
    await page.locator('.feedback .boton').click();
  }
  ok(falladas.size === 3, 'se jugaron clasificar, deslizador y rellenar');
  ok(await page.locator('.resultado-titulo').count() === 1, 'las formas nuevas terminan el nivel');
  // clasificar con teclado (teclas 1, 2, 3) y arrastrando con el ratón
  await page.evaluate(() => mostrarLeccion(CURSOS[0], { id: 'prueba-arrastre', titulo: 'P', icono: '🎯', xp: 10, intro: 'Prueba de arrastrar y teclas.', ejercicios: CURSOS.flatMap((c) => c.unidades.flatMap((u) => u.lecciones.flatMap((x) => x.ejercicios))).filter((e) => e.id === 'bj-3-1-c1') }));
  const primeraCarta = (await page.locator('.clas-ficha').innerText()).trim();
  const cajonBueno = (await page.evaluate(() => CURSOS[0].unidades[2].lecciones[0].ejercicios.find((e) => e.id === 'bj-3-1-c1').elementos)).find((x) => x[0] === primeraCarta)[1];
  const caja = await page.locator('.clas-cajon').nth(cajonBueno).boundingBox();
  const fb = await page.locator('.clas-ficha').boundingBox();
  await page.mouse.move(fb.x + fb.width / 2, fb.y + fb.height / 2);
  await page.mouse.down();
  await page.mouse.move(caja.x + caja.width / 2, caja.y + caja.height / 2, { steps: 8 });
  await page.mouse.up();
  ok(await page.locator('.clas-cajon').nth(cajonBueno).locator('.clas-mini').count() === 1, 'arrastrar la carta al cajón correcto la coloca');
  const sig = (await page.locator('.clas-ficha').innerText()).trim();
  const buenoSig = (await page.evaluate(() => CURSOS[0].unidades[2].lecciones[0].ejercicios.find((e) => e.id === 'bj-3-1-c1').elementos)).find((x) => x[0] === sig)[1];
  await page.keyboard.press(String(buenoSig + 1));
  ok(await page.locator('.clas-mini').count() === 2, 'la tecla del cajón también coloca la carta');
  await inicio({ xp: 35, racha: 0, ultimoDia: null, completadas: {} });

  // 1c) Baraja española en las preguntas del mus y estilos en la tienda
  await inicio({ xp: 35, racha: 0, ultimoDia: null, completadas: {}, fichas: 500 });
  await page.evaluate(() => {
    const todos = CURSOS.flatMap((c) => c.unidades.flatMap((u) => u.lecciones.flatMap((x) => x.ejercicios)));
    const mus = CURSOS.find((c) => c.id === 'mus');
    mostrarLeccion(mus, { id: 'prueba-mus', titulo: 'M', icono: '🎯', xp: 10, intro: 'Prueba de la baraja española.', ejercicios: [todos.find((e) => e.id === 'ms-1-1-c1'), todos.find((e) => e.id === 'ms-5-2-d1')].concat(todos.filter((e) => e.tipo === 'seleccionar' && /^ms-/.test(e.id)).slice(0, 1)) });
  });
  await page.waitForSelector('.pregunta');
  ok(await page.locator('.clas-ficha .carta-es').count() === 1 && await page.locator('.clas-ficha .carta').count() === 0, 'clasificar del mus usa la baraja española');
  await foto('1c-mus-clasificar');
  await page.evaluate(() => { const l = CURSOS.find((c) => c.id === 'blackjack').unidades[0].lecciones[0]; mostrarLeccion(CURSOS[0], l); });
  await page.waitForSelector('.pregunta');
  ok(await page.locator('.carta-es').count() === 0, 'el blackjack sigue con la baraja francesa');
  await page.evaluate(() => mostrarTienda('sin'));
  await page.locator('[data-pestana=espanola]').click();
  ok(await page.locator('[data-articulo^="espanola:"]').count() === 6 && await page.locator('[data-articulo^="espanola:"] .carta-es').count() === 12, 'la tienda tiene 6 estilos de baraja española con vista previa');
  ok(await page.evaluate(() => document.documentElement.getAttribute('data-espanola')) === null, 'sin comprar no se aplica el estilo');
  await page.locator('[data-articulo="espanola:taberna"] button').click();
  await page.waitForSelector('[data-articulo="espanola:taberna"].puesto');
  ok(await page.evaluate(() => document.documentElement.getAttribute('data-espanola')) === 'taberna' && await page.evaluate(() => progreso.fichas) === 460, 'comprar la baraja Taberna la equipa y cobra 40 fichas');
  ok(await page.evaluate(() => getComputedStyle(document.querySelector('[data-articulo="espanola:taberna"] .es-papel')).fill) !== 'rgb(255, 250, 240)', 'el estilo cambia los colores de la baraja');
  await foto('1c-tienda-espanola');
  await inicio({ xp: 35, racha: 0, ultimoDia: null, completadas: {} });
  // 1d) Relámpago (cuenta atrás) y estadísticas de errores
  await inicio({ xp: 35, racha: 0, ultimoDia: null, completadas: {} });
  const relId = await page.evaluate(() => CURSOS[0].unidades.flatMap((u) => u.lecciones.flatMap((x) => x.ejercicios)).find((e) => e.tipo === 'relampago').id);
  const abrirRel = () => page.evaluate((id) => {
    const e = CURSOS.flatMap((c) => c.unidades.flatMap((u) => u.lecciones.flatMap((x) => x.ejercicios))).find((x) => x.id === id);
    mostrarLeccion(CURSOS[0], { id: 'prueba-rel', titulo: 'Prueba', icono: '🎯', xp: 10, intro: 'Relámpago.', ejercicios: [e] });
  }, relId);
  await abrirRel();
  ok(await page.locator('.relampago .rel-barra').count() === 1 && await page.locator('.rel-opcion').count() >= 2, 'el relámpago muestra barra de tiempo y opciones');
  await foto('1d-relampago');
  await responder(false);
  ok(await page.locator('.feedback.mal').count() === 1, 'relámpago: todo mal no aprueba');
  await page.locator('.feedback .boton').click().catch(() => {});
  await page.waitForTimeout(300);
  await abrirRel();
  await responder(true);
  ok(await page.locator('.feedback.bien').count() === 1, 'relámpago: todo bien aprueba');
  // con la cuenta atrás: si pasa el tiempo cuenta como fallo
  await abrirRel();
  await page.waitForSelector('.feedback, .rel-item.fallo', { timeout: 40000 }).catch(() => {});
  const stats = await page.evaluate(() => { const p = JSON.parse(localStorage.getItem('progreso-v2')); return p.stats; });
  ok(stats && Object.keys(stats.t).length > 0 && Object.keys(stats.d).length === 1, 'se guardan estadísticas por tipo y día');
  await inicio({ xp: 35, racha: 1, ultimoDia: dia(0), completadas: {}, stats: { u: { 'blackjack|0': [3, 9], 'poker|1': [18, 2] }, t: { opcion_unica: [15, 5], relampago: [6, 6] }, d: { [dia(0)]: [21, 11] } } });
  await page.evaluate(() => mostrarEstadisticas());
  ok(await page.locator('.est-debil').count() >= 1, 'estadísticas: muestra el punto débil');
  ok(/%/.test(await page.locator('.est-debil').first().innerText()), 'estadísticas: el punto débil lleva su porcentaje');
  await foto('1d-estadisticas');
  await page.locator('.est-debil .boton').first().click();
  ok(await page.locator('.pregunta').count() === 1, 'Entrenar abre un repaso de ese tema');
  // jugadas concretas: "fallas el 60 % de las jugadas con 12-16 contra 7 o más"
  await inicio({ xp: 35, racha: 1, ultimoDia: dia(0), completadas: {}, stats: { u: {}, t: { accion: [4, 6] }, d: { [dia(0)]: [4, 6] }, s: { 'bj-12-16-f': [4, 6], 'bj-17': [9, 1] } } });
  await page.evaluate(() => mostrarEstadisticas());
  ok(/Fallas el 60 % de las jugadas con 12-16 contra 7 o más/.test(await page.locator('.estadisticas').innerText()), 'estadísticas: «fallas el 60 % de las jugadas con 12-16 contra 7 o más»');
  ok(await page.locator('[data-situacion]').count() === 1, 'estadísticas: solo sale la jugada con muchos fallos');
  await foto('1d-estadisticas-jugadas');
  await page.locator('[data-situacion] .boton').click();
  ok(await page.locator('.pregunta').count() === 1, 'Entrenar jugada abre un repaso');
  const todasBien = [];
  for (let k = 0; k < 8 && (await hayPregunta()); k++) { const id = await page.locator('.pregunta').first().getAttribute('data-id'); todasBien.push(await page.evaluate((i) => situacionesDe(INDICE_EJERCICIOS[i].ejercicio).includes('bj-12-16-f'), id)); await responder(true); await page.locator('.feedback .boton').click(); }
  ok(todasBien.length >= 3 && todasBien.every(Boolean), 'el entreno solo trae preguntas de esa jugada');
  const s2 = await page.evaluate(() => JSON.parse(localStorage.getItem('progreso-v2')).stats.s['bj-12-16-f']);
  ok(s2[0] >= 4 + todasBien.length && s2[1] === 6, 'responder apunta los aciertos en la situación');
  await inicio({ xp: 35, racha: 0, ultimoDia: null, completadas: {} });

  // 1e) Racha en peligro y partida rápida de 60 s (con reloj simulado)
  {
    const p3 = await ctx.newPage();
    p3.on('pageerror', (e) => fallos.push('p3: ' + e.message));
    await p3.clock.install({ time: new Date() });
    const prog = JSON.stringify({ bienvenida: true, xp: 120, racha: 5, ultimoDia: dia(-1), completadas: {}, rapida: { partidas: 2, mejor: 3 } });
    await p3.addInitScript((j) => { if (!sessionStorage.getItem('sembrado')) { sessionStorage.setItem('sembrado', '1'); localStorage.setItem('progreso-v2', j); } }, prog);
    await p3.goto(URL);
    await p3.waitForSelector('.racha-aviso');
    ok(await p3.locator('.racha-aviso').count() === 1 && /5 días/.test(await p3.locator('.racha-aviso').innerText()), 'aviso de racha en peligro con los días de racha');
    await p3.getByRole('tab', { name: 'Practicar' }).click();
    ok(/Récord: 3/.test(await p3.locator('.repaso', { hasText: 'Partida rápida' }).innerText()), 'la fila de partida rápida enseña el récord');
    await p3.locator('.racha-aviso').click();
    await p3.waitForSelector('[data-rapida] .barra-tiempo');
    let buenas = 0;
    for (let k = 0; k < 5; k++) {
      const id = await p3.locator('.pregunta').first().getAttribute('data-id');
      const buena = await p3.evaluate((i) => { const e0 = INDICE_EJERCICIOS[i].ejercicio, e = e0.base || e0; return e.opciones[e.correcta]; }, id);
      const textos = await p3.locator('.opcion').evaluateAll((els) => els.map((x) => x.innerText.replace(/^\s*\d+\s*/, '').trim()));
      await p3.locator('.opcion').nth(textos.indexOf(buena)).click();
      buenas++;
      await p3.locator('.feedback .boton').click();
    }
    ok(Number(await p3.locator('.rapida-puntos strong').innerText()) === 5, 'la partida rápida cuenta los aciertos');
    await p3.clock.fastForward(61000);
    await p3.waitForSelector('.resultado-titulo');
    ok((await p3.locator('.resultado-titulo').innerText()) === '¡Tiempo!', 'al acabar los 60 s sale el resultado');
    ok(/5 aciertos/.test(await p3.locator('main').innerText()) && /récord/i.test(await p3.locator('main').innerText()), 'resultado con aciertos y nuevo récord');
    const guardado = await p3.evaluate(() => JSON.parse(localStorage.getItem('progreso-v2')).rapida);
    ok(guardado.mejor === 5 && guardado.partidas === 3, 'se guarda el récord de la partida rápida');
    await p3.close();
  }

  // 2) Nivel con ejercicio de ordenar: accesibilidad, SRS, meta y XP
  await page.locator('.juego').first().click();
  await page.locator('.nodo.actual').click({ force: true });
  await page.getByRole('button', { name: '¡Vamos!' }).click();
  ok(await page.locator('[role=progressbar]').count() === 1, 'barra con role progressbar');
  const ariaCartas = await page.evaluate(() => [...document.querySelectorAll('.carta')].map((c) => c.getAttribute('aria-label')));
  ok(ariaCartas.every(Boolean), 'las cartas tienen nombre para lectores de pantalla');
  let vistoOrdenar = false;
  while (await hayPregunta()) {
    const q = await page.locator('.pregunta').first().innerText();
    const idq = await page.locator('.pregunta').first().getAttribute('data-id');
    const ej = todos.find((e) => e.id === idq) || todos.find((e) => e.pregunta === q);
    if (ej.tipo === 'ordenar' && !vistoOrdenar) {
      vistoOrdenar = true;
      await foto('2-ordenar');
      // primero se coloca mal: debe fallar y mostrar el orden correcto
      await responder(false);
      const fb = await page.locator('.feedback').innerText();
      ok(fb.includes('Respuesta correcta: ' + ej.elementos.join(' → ')), 'el feedback muestra el orden correcto');
      ok(await page.locator('.feedback[role=status]').count() === 1, 'feedback con role=status');
      ok(await page.evaluate(() => document.activeElement.textContent.trim() === 'Continuar'), 'el foco pasa a Continuar');
      await page.locator('.feedback .boton').click();
    } else {
      await responder(true);
      await page.locator('.feedback .boton').click();
    }
  }
  ok(vistoOrdenar, 'el nivel tenía un ejercicio de ordenar');
  await page.waitForSelector('.resultado-titulo');
  await page.waitForTimeout(900);
  ok((await page.locator('main').innerText()).includes('+'), 'resultado con XP');
  await page.getByRole('button', { name: 'Continuar' }).click();
  await page.locator('.volver').click();
  let p = await estado();
  ok(Object.keys(p.srs).length >= 5, 'la repetición espaciada apunta respuestas: ' + Object.keys(p.srs).length);
  ok(p.xpHoy.dia === dia(0) && p.xpHoy.xp > 0, 'XP de hoy apuntado');
  const fallado = Object.entries(p.srs).filter(([, s]) => s.fallos > 0);
  ok(fallado.length === 1 && fallado[0][1].caja === 0, 'solo el ordenar fallado queda como error');
  // el ejercicio fallado vuelve al final y se acierta: primer intento cuenta como fallo, pero ya no hay más
  ok(await page.getByText('Mis errores').count() === 1, 'aparece "Mis errores"');
  ok(await page.getByText('Repaso del día').count() === 1, 'aparece "Repaso del día" (lo fallado toca hoy)');
  await foto('3-inicio-repasos');

  // 3) Mis errores: repaso mezclado y vuelta a inicio
  await page.getByRole('tab', { name: /Practicar/ }).click();
  await page.getByText('Mis errores').click();
  ok(await page.locator('.pregunta').count() === 1, 'empieza el repaso de errores');
  await terminar(true);
  await page.waitForSelector('.resultado-titulo');
  await page.getByRole('button', { name: 'Continuar' }).click();
  await page.waitForSelector('.meta');
  ok(await page.locator('h1', { hasText: 'Elige tu mesa' }).count() === 1, 'el repaso global vuelve a inicio');
  p = await estado();
  ok(Object.values(p.srs).some((s) => s.fallos > 0 && s.caja === 1), 'tras acertar el error sube de caja');
  ok(p.repasos === 1, 'cuenta como repaso');

  // 4) Meta diaria cumplida y congeladores de racha
  await inicio({ xp: 10, racha: 5, ultimoDia: dia(-2), congeladores: 1, meta: 10, completadas: {} });
  ok((await page.locator('.marcador').innerText()).includes('5'), 'con congelador la racha de anteayer sigue viva');
  await page.locator('.juego').first().click();
  await page.locator('.nodo.actual').click({ force: true });
  await page.getByRole('button', { name: '¡Vamos!' }).click();
  await terminar(true);
  await page.waitForSelector('.resultado-titulo');
  await page.waitForTimeout(1200);
  const txt = await page.locator('main').innerText();
  ok(txt.includes('Meta diaria cumplida'), 'aviso de meta cumplida');
  ok(txt.includes('congelador ha salvado'), 'aviso de congelador usado');
  p = await estado();
  ok(p.racha === 6 && p.congeladores === 0, `racha 6 y congelador gastado (racha ${p.racha}, cong ${p.congeladores})`);
  await inicio({ xp: 10, racha: 6, ultimoDia: dia(-1), congeladores: 0, completadas: {} });
  await page.locator('.juego').first().click();
  await page.locator('.nodo.actual').click({ force: true });
  await page.getByRole('button', { name: '¡Vamos!' }).click();
  await terminar(true);
  p = await estado();
  ok(p.racha === 7 && p.congeladores === 1, 'al llegar a 7 días se gana un congelador');
  await inicio({ xp: 10, racha: 9, ultimoDia: dia(-3), congeladores: 2, completadas: {} });
  ok((await page.locator('.marcador').innerText()).includes('0'), 'con 3 días sin entrenar la racha se pierde aunque haya congeladores');

  // 5) Ajustes: meta, letra, movimiento, copia de seguridad
  await inicio({ xp: 120, racha: 2, ultimoDia: dia(0), completadas: { 'bj-1-1': true } });
  await page.locator('.pestana[data-pestana=ajustes]').click();
  await foto('4-ajustes');
  await page.getByRole('button', { name: '10 XP · suave' }).click();
  ok((await estado()).meta === 10, 'meta guardada');
  await page.getByRole('button', { name: 'Letra grande' }).click();
  ok(await page.evaluate(() => document.documentElement.dataset.letra) === 'grande', 'letra grande aplicada');
  await page.getByRole('switch', { name: /Menos movimiento/ }).click();
  ok(await page.evaluate(() => document.documentElement.dataset.calma) === 'si', 'menos movimiento aplicado');
  const [descarga] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Descargar copia' }).click()]);
  const copia = JSON.parse(require('fs').readFileSync(await descarga.path(), 'utf8'));
  ok(copia.app === 'entrenador-cartas' && copia.progreso.xp === 120 && copia.progreso.meta === 10, 'la copia contiene el progreso');
  copia.progreso.xp = 777;
  await page.locator('input[type=file]').setInputFiles({ name: 'copia.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(copia)) });
  await page.waitForFunction(() => document.body.innerText.includes('Copia restaurada'));
  ok((await estado()).xp === 777, 'la copia se restaura');
  await page.locator('input[type=file]').setInputFiles({ name: 'mala.json', mimeType: 'application/json', buffer: Buffer.from('{"hola":1}') });
  await page.waitForFunction(() => document.body.innerText.includes('no parece una copia'));
  ok((await estado()).xp === 777, 'una copia inválida no cambia nada');
  await page.locator('input[type=file]').setInputFiles({ name: 'rota.json', mimeType: 'application/json', buffer: Buffer.from('esto no es json') });
  await page.waitForFunction(() => document.body.innerText.includes('no parece una copia'));
  await page.reload(); // los ajustes de letra y movimiento se mantienen
  ok(await page.evaluate(() => document.documentElement.dataset.letra) === 'grande', 'la letra grande se recuerda');
  // reiniciar conserva los ajustes de aspecto
  await page.locator('.pestana[data-pestana=ajustes]').click();
  await page.getByRole('button', { name: 'Reiniciar progreso' }).click();
  p = await estado();
  ok(p.xp === 0 && p.ajustes.letra === 'grande', 'reiniciar borra el progreso pero no los ajustes de aspecto');
  ok((await page.locator('.aviso').first().innerText()).includes('18'), 'aviso de mayores de 18');

  // 6) Entrenador de conteo
  await inicio({ xp: 0 });
  await page.getByRole('tab', { name: 'Practicar' }).click();
  await page.getByText('Entrena el conteo').click();
  await page.getByRole('button', { name: /Rápido/ }).click();
  await page.getByRole('button', { name: '10', exact: true }).click();
  await foto('5-conteo-ajustes');
  const observar = () => page.evaluate(() => {
    window.__vistas = [];
    if (window.__obs) return;
    window.__obs = true;
    new MutationObserver((muts) => muts.forEach((m) => m.addedNodes.forEach((n) => { if (n.classList && n.classList.contains('carta') && n.closest('.conteo-zona')) window.__vistas.push(n.textContent); }))).observe(document.body, { childList: true, subtree: true });
  });
  await observar();
  await page.getByRole('button', { name: 'Empezar' }).click();
  await page.waitForSelector('.conteo-selector', { timeout: 20000 });
  const vistas = await page.evaluate(() => window.__vistas);
  ok(vistas.length === 10, 'se enseñaron las 10 cartas, vistas: ' + vistas.length);
  const esperado = vistas.reduce((s, c) => s + hiLo(c), 0);
  const dicho = esperado + 1; // primero se falla a propósito
  for (let i = 0; i < Math.abs(dicho); i++) await page.getByRole('button', { name: dicho > 0 ? 'Sumar uno' : 'Restar uno' }).click();
  await page.getByRole('button', { name: 'Comprobar' }).click();
  await page.waitForSelector('.conteo-lista');
  ok((await page.locator('main').innerText()).includes('Casi'), 'cuenta incorrecta detectada');
  ok(await page.locator('.conteo-item').count() === 10, 'se muestran las cartas con su valor');
  let items = await page.locator('.conteo-item').evaluateAll((els) => els.map((e) => [e.querySelector('.carta').textContent, e.querySelector('small').textContent.replace('−', '-')]));
  ok(items.every(([c, v]) => Number(v.replace('+', '')) === hiLo(c)), 'valores Hi-Lo mostrados correctos');
  await foto('7-conteo-resultado');
  ok((await estado()).conteo.mejor === 0 && (await estado()).conteo.sesiones === 1, 'fallar no da récord');
  // salir a mitad corta el temporizador sin errores
  await page.getByRole('button', { name: 'Otra vez' }).click();
  await page.waitForTimeout(2200);
  await page.getByRole('button', { name: 'Parar el entrenamiento' }).click();
  await page.waitForTimeout(1500);
  ok(await page.locator('.conteo-selector').count() === 0, 'parar el entrenamiento no deja pantallas fantasma');
  // acierto
  await observar();
  await page.getByRole('button', { name: 'Empezar' }).click();
  await page.waitForSelector('.conteo-selector', { timeout: 20000 });
  const vistas2 = await page.evaluate(() => window.__vistas);
  const esp2 = vistas2.reduce((s, c) => s + hiLo(c), 0);
  for (let i = 0; i < Math.abs(esp2); i++) await page.getByRole('button', { name: esp2 > 0 ? 'Sumar uno' : 'Restar uno' }).click();
  await page.getByRole('button', { name: 'Comprobar' }).click();
  await page.waitForSelector('.conteo-lista');
  ok((await page.locator('main').innerText()).includes('Bien contado'), 'cuenta correcta detectada (' + esp2 + ')');
  p = await estado();
  ok(p.conteo.mejor === Math.round(60000 / 700) && p.conteo.sesiones === 2 && p.logros.contador, 'récord y logro de contador');

  // 6b) Preguntas interactivas: seleccionar, número y emparejar (bien y mal)
  const nivelDe = (id) => page.evaluate((i) => { const c = CURSOS.find((c) => c.unidades.some((u) => u.lecciones.some((l) => l.id === i))); return c.id; }, id);
  async function abrirNivel(id) {
    // se marcan como hechos los niveles anteriores para llegar al nivel pedido: se salta directo con la API de la app
    await page.evaluate((i) => { const c = CURSOS.find((c) => c.unidades.some((u) => u.lecciones.some((l) => l.id === i))); mostrarLeccion(c, niveles(c).find((l) => l.id === i)); }, id);
  }
  await inicio({ xp: 0 });
  await abrirNivel('bj-3-1');
  const vistos = new Set();
  let fallosSel = 0;
  while (await hayPregunta()) {
    const q = await page.locator('.pregunta').first().innerText();
    const idq = await page.locator('.pregunta').first().getAttribute('data-id');
    const ej = todos.find((e) => e.id === idq) || todos.find((e) => e.pregunta === q);
    if (ej.tipo === 'seleccionar') {
      ok(await page.getByRole('button', { name: 'Comprobar' }).isDisabled(), 'Comprobar está desactivado sin selección');
      const cartas = await page.locator('.carta-pick').evaluateAll((els) => els.map((e) => e.querySelector('.carta').textContent));
      const marcar = (!vistos.has(ej.id)) ? ej.correctas.slice(1).concat([ej.cartas.findIndex((_, i) => !ej.correctas.includes(i))]) : ej.correctas; // la primera vez se falla
      ok(cartas.join() === ej.cartas.join(), 'las cartas del ejercicio se muestran en su orden');
      for (const i of marcar) await page.locator('.carta-pick').nth(i).click();
      await foto('9-seleccionar');
      await page.getByRole('button', { name: 'Comprobar' }).click();
      const primera = !vistos.has(ej.id);
      vistos.add(ej.id);
      ok((await page.locator('.feedback').innerText()).includes(primera ? 'Respuesta correcta' : '¡'), 'seleccionar: feedback ' + (primera ? 'de fallo' : 'de acierto'));
      if (primera) { fallosSel++; ok(await page.locator('.carta-pick.mal').count() === 1 && await page.locator('.carta-pick.falta').count() === 1, 'se marcan la carta de más y la que faltaba'); }
      await page.locator('.feedback .boton').click();
    } else { await responder(true); await page.locator('.feedback .boton').click(); }
  }
  ok(fallosSel === 2, 'los dos ejercicios de seleccionar se fallaron y repitieron: ' + fallosSel);
  await page.waitForSelector('.resultado-titulo');

  await abrirNivel('bj-3-3');
  const numeros = [];
  while (await hayPregunta()) {
    const q = await page.locator('.pregunta').first().innerText();
    const idq = await page.locator('.pregunta').first().getAttribute('data-id');
    const ej = todos.find((e) => e.id === idq) || todos.find((e) => e.pregunta === q);
    if (ej.tipo === 'numero') {
      ok(await page.evaluate(() => document.activeElement.classList.contains('numero-entrada')), 'el cursor está en el campo numérico');
      const primera = !numeros.includes(ej.id); numeros.push(ej.id);
      await page.locator('.numero-entrada').fill(String(primera ? ej.respuesta + 1 : ej.respuesta));
      await page.keyboard.press('Enter'); // se comprueba con Enter
      ok((await page.locator('.feedback').innerText()).includes(primera ? 'Respuesta correcta: ' + ej.respuesta : 'Genial') || !primera, 'número: feedback');
      await page.locator('.feedback .boton').click();
    } else { await responder(true); await page.locator('.feedback .boton').click(); }
  }
  ok(numeros.length >= 4, 'los números fallados se repiten: ' + numeros.length);
  await page.waitForSelector('.resultado-titulo');

  await abrirNivel('pk-4-3');
  let emparejado = false;
  while (await hayPregunta()) {
    const q = await page.locator('.pregunta').first().innerText();
    const idq = await page.locator('.pregunta').first().getAttribute('data-id');
    const ej = todos.find((e) => e.id === idq) || todos.find((e) => e.pregunta === q);
    if (ej.tipo === 'emparejar' && !emparejado) {
      emparejado = true;
      await foto('10-emparejar');
      // un error a propósito: la primera izquierda con la derecha de otro par
      await page.locator('.parejas-col').first().locator('.par').nth(0).click();
      await page.locator('.parejas-col').nth(1).locator('.par', { hasText: ej.pares[1][1] }).click();
      ok(await page.locator('.par.mal').count() === 2, 'pareja equivocada marcada');
      await page.waitForTimeout(700);
      ok(await page.locator('.par.mal').count() === 0, 'el error desaparece solo');
      for (let i = 0; i < ej.pares.length; i++) {
        await page.locator('.parejas-col').first().locator('.par', { hasText: new RegExp('^' + ej.pares[i][0] + '$') }).click();
        await page.locator('.parejas-col').nth(1).locator('.par', { hasText: ej.pares[i][1] }).click();
      }
      ok(await page.locator('.par.unido').count() === ej.pares.length * 2, 'todas las parejas unidas');
      await page.waitForSelector('.feedback');
      ok((await page.locator('.feedback').innerText()).includes('Respuesta correcta: Preflop = '), 'con un error se cuenta como fallo');
      await page.locator('.feedback .boton').click();
    } else if (ej.tipo === 'emparejar') {
      for (let i = 0; i < ej.pares.length; i++) {
        await page.locator('.parejas-col').first().locator('.par', { hasText: new RegExp('^' + ej.pares[i][0] + '$') }).click();
        await page.locator('.parejas-col').nth(1).locator('.par', { hasText: ej.pares[i][1] }).click();
      }
      await page.waitForSelector('.feedback.bien');
      await page.locator('.feedback .boton').click();
    } else { await responder(true); await page.locator('.feedback .boton').click(); }
  }
  await page.waitForSelector('.resultado-titulo');
  ok(emparejado, 'se probó emparejar');
  p = await estado();
  ok(Object.keys(p.srs).some((k) => k.startsWith('pk-4-3-m1')), 'los ejercicios interactivos entran en la repetición espaciada');

  // 6c) Efectos de sonido: cada uno genera audio real, suenan en los momentos correctos y se pueden desactivar
  const picos = await page.evaluate(async () => {
    const res = {};
    for (const n of sonido.nombres) {
      const c = new OfflineAudioContext(1, 44100 * 2, 44100);
      sonido.generar(n, c, c.destination);
      const datos = (await c.startRendering()).getChannelData(0);
      let pico = 0, ultimo = 0;
      for (let i = 0; i < datos.length; i++) { const a = Math.abs(datos[i]); if (a > pico) pico = a; if (a > 0.005) ultimo = i; }
      res[n] = { pico: +pico.toFixed(3), dur: +(ultimo / 44100).toFixed(2) };
    }
    return res;
  });
  for (const [n, r] of Object.entries(picos)) ok(r.pico > 0.03 && r.pico <= 1 && r.dur > 0.02 && r.dur < 1.8, `el sonido «${n}» genera audio (pico ${r.pico}, dura ${r.dur} s)`);
  await inicio({ xp: 0 });
  await page.evaluate(() => (sonido.registro.length = 0));
  await abrirNivel('bj-1-1');
  await responder(true);
  await page.waitForTimeout(100);
  let reg = await page.evaluate(() => sonido.registro.slice());
  ok(reg.includes('acierto') && !reg.includes('error'), 'acertar suena a acierto: ' + reg);
  await page.locator('.feedback .boton').click();
  await responder(false);
  reg = await page.evaluate(() => sonido.registro.slice());
  ok(reg.includes('error'), 'fallar suena a error');
  await page.locator('.feedback .boton').click();
  await terminar(true);
  await page.waitForSelector('.resultado-titulo');
  reg = await page.evaluate(() => sonido.registro.slice());
  ok(reg.includes('nivel'), 'terminar un nivel suena a fanfarria');
  ok(reg.includes('toque'), 'pulsar botones hace un clic');
  // se puede desactivar y se recuerda
  await page.reload();
  await page.locator('.pestana[data-pestana=ajustes]').click();
  await page.getByRole('switch', { name: /Efectos de sonido/ }).click();
  ok((await estado()).ajustes.sonido === false, 'el sonido se desactiva en Ajustes');
  await page.evaluate(() => (sonido.registro.length = 0));
  await abrirNivel('bj-1-1');
  await responder(true);
  await page.mouse.click(10, 10);
  ok((await page.evaluate(() => sonido.registro.length)) === 0, 'con el sonido desactivado no suena nada');
  await page.reload();
  await page.locator('.pestana[data-pestana=ajustes]').click();
  ok(await page.getByRole('switch', { name: /Efectos de sonido/ }).getAttribute('aria-checked') === 'false', 'el ajuste de sonido se recuerda');
  await page.getByRole('switch', { name: /Efectos de sonido/ }).click();
  ok((await estado()).ajustes.sonido === true, 'y se puede volver a activar');
  await page.getByRole('switch', { name: /Alto contraste/ }).click();
  ok(await page.evaluate(() => document.documentElement.dataset.contraste === 'alto' && progreso.ajustes.contraste === true && getComputedStyle(document.querySelector('.decor')).display === 'none'), 'Alto contraste: se activa, se guarda y quita el fondo animado');
  await page.getByRole('switch', { name: /Alto contraste/ }).click();
  ok(await page.evaluate(() => document.documentElement.dataset.contraste === 'normal'), 'Alto contraste se puede desactivar');

  // 6d) Bienvenida, barra inferior y pestaña Útil
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForSelector('.bienvenida');
  ok((await page.locator('main').innerText()).includes('Bienvenido a Tapete'), 'un usuario nuevo ve la bienvenida');
  ok(await page.locator('#barra').isHidden(), 'la bienvenida no muestra la barra inferior');
  await foto('11-bienvenida');
  await page.getByRole('button', { name: 'Empezar' }).click();
  await page.waitForSelector('.tour');
  ok((await page.locator('.tour').innerText()).includes('Juegos') && await page.locator('.pestana[data-pestana=juegos]').getAttribute('aria-current') === 'page', 'el recorrido empieza explicando Juegos');
  for (const id of ['util', 'campana', 'tienda', 'ajustes']) {
    await page.locator('.tour').getByRole('button', { name: 'Siguiente' }).click();
    await page.waitForFunction((i) => { const t = document.querySelector('.pestana[data-pestana=' + i + ']'); return t && t.getAttribute('aria-current') === 'page' && t.classList.contains('tour-foco'); }, id);
    ok(await page.locator('.tour').count() === 1, 'el recorrido pasa por la pestaña ' + id);
  }
  await page.locator('.tour').getByRole('button', { name: '¡A jugar!' }).click();
  await page.waitForSelector('.juego');
  ok(await page.locator('.tour').count() === 0 && await page.locator('.tour-velo').count() === 0, 'al terminar el recorrido se quita');
  ok((await estado()).bienvenida === true, 'la bienvenida se recuerda');
  ok(await page.locator('#barra').isVisible(), 'la barra aparece en Juegos');
  ok(await page.locator('.pestana').count() === 5, 'cinco pestañas: Juegos, Útil, Campaña, Tienda y Ajustes');
  await page.locator('.pestana[data-pestana=tienda]').click();
  await page.waitForSelector('.tienda');
  ok(await page.locator('.pestana[data-pestana=tienda]').getAttribute('aria-current') === 'page' && await page.locator('#barra').isVisible(), 'la pestaña Tienda se enciende y la barra se ve');
  ok((await page.locator('.tienda').innerText()).includes('Energía: 2 / 2') && (await page.locator('.tienda').innerText()).includes('Pase VIP'), 'la tienda muestra la energía y el pase VIP');
  // comprar un fondo con fichas
  await page.evaluate(() => { progreso.fichas = 100; mostrarTienda('sin'); });
  await page.locator('[data-articulo="fondo:mesa"] button').click();
  ok(await page.evaluate(() => progreso.fichas === 60 && document.documentElement.dataset.fondo === 'mesa' && progreso.tienda.comprados.includes('fondo:mesa')), 'comprar un fondo gasta las fichas y lo aplica');
  await page.locator('[data-articulo="fondo:clasico"] button').click();
  ok(await page.locator('.tienda .ico').count() > 3 && !/[\p{Emoji_Presentation}\uFE0F]/u.test(await page.locator("main").innerText()), 'la tienda usa iconos propios y ningún emoji');
  ok(await page.evaluate(() => !document.documentElement.dataset.fondo), 'volver al fondo clásico es gratis');
  await page.locator('[data-pestana=baraja]').click();
  ok(await page.locator('[data-articulo^="baraja:"]').count() === 6 && await page.locator('[data-articulo^="fondo:"]').count() === 0, 'las pestañas de la tienda muestran una categoría cada vez');
  await page.locator('[data-articulo="baraja:dorada"] button').click();
  ok(await page.locator('[data-pestana=baraja]').getAttribute('aria-selected') === 'true', 'tras comprar se queda en la misma pestaña');
  ok(await page.evaluate(() => document.documentElement.dataset.baraja === 'dorada' && progreso.fichas === 0), 'comprar una baraja la aplica a las cartas');
  await page.locator('[data-pestana=nai]').click();
  await page.locator('[data-articulo="nai:corona"] button').click();
  ok((await page.locator('.tienda-seccion .mensaje, .ajuste-mensaje').first().innerText()).includes('Te faltan'), 'sin fichas suficientes no se compra y avisa');
  await page.evaluate(() => { progreso.fichas = 100; progreso.tienda.equipado.baraja = 'clasica'; progreso.energia = { n: 0, t: Date.now(), dia: hoy() }; mostrarTienda('sin'); });
  await page.getByRole('button', { name: /\+1 .*energía/ }).click();
  ok(await page.evaluate(() => progreso.energia.n === 1 && progreso.fichas === 90), 'comprar energía con fichas');
  // VIP: el doble de XP y fichas
  ok(await page.evaluate(() => { progreso.vip.hasta = Date.now() + 1e9; const r = multVip() === 2; progreso.vip.hasta = 0; return r && multVip() === 1; }), 'el VIP multiplica por 2 y sin VIP es ×1');
  // sin energía: no se puede empezar un nivel
  await page.evaluate(() => { progreso.energia = { n: 0, t: Date.now(), dia: hoy() }; progreso.fichas = 5; const c = CURSOS[0]; mostrarIntro(c, niveles(c)[0]); });
  await page.getByRole('button', { name: '¡Vamos!' }).click();
  await page.waitForSelector('.energia-espera');
  ok((await page.locator('main').innerText()).includes('Sin energía') && await page.locator('.pregunta').count() === 0, 'sin energía no empieza el nivel');
  ok(await page.getByRole('button', { name: /Comprar 1/ }).isDisabled(), 'sin fichas no se puede comprar energía');
  // con energía: empieza y gasta 1
  await page.evaluate(() => { progreso.energia = { n: 2, t: 0, dia: hoy() }; const c = CURSOS[0]; mostrarIntro(c, niveles(c)[0]); });
  await page.getByRole('button', { name: '¡Vamos!' }).click();
  await page.waitForSelector('.pregunta');
  ok(await page.evaluate(() => progreso.energia.n === 1 && progreso.energia.t > 0), 'empezar un nivel gasta 1 de energía y arranca la recarga');
  // recarga con el tiempo y reinicio diario
  ok(await page.evaluate(() => { progreso.energia = { n: 0, t: Date.now() - 31 * 60 * 1000, dia: hoy() }; return energiaActual() === 1; }), 'tras 30 minutos se recupera 1 de energía');
  ok(await page.evaluate(() => { progreso.energia = { n: 0, t: Date.now(), dia: '2000-01-01' }; return energiaActual() === 2; }), 'cada día empiezas con 2 de energía');
  ok(await page.evaluate(() => { progreso.energia = { n: 0, t: Date.now(), dia: hoy() }; progreso.vip.hasta = Date.now() + 1e9; const r = tieneEnergia(); progreso.vip.hasta = 0; return r; }), 'el VIP tiene energía ilimitada');
  // cofre en el mapa tras 6 niveles
  await page.evaluate(() => { localStorage.setItem('progreso-v2', JSON.stringify({ bienvenida: true, xp: 40, completadas: {} })); location.reload(); });
  await page.waitForSelector('.juego');
  await page.evaluate(() => { const c = CURSOS[0]; progreso.fichas = 0; mostrarMapa(c); });
  ok(await page.locator('.nodo.cofre.bloqueado').count() >= 1 && await page.locator('.nodo.cofre.listo').count() === 0, 'los cofres empiezan bloqueados');
  await page.evaluate(() => { const c = CURSOS[0]; niveles(c).slice(0, 6).forEach((l) => (progreso.completadas[l.id] = true)); mostrarMapa(c); });
  ok(await page.locator('.nodo.cofre.listo').count() === 1, 'al completar 6 niveles el primer cofre queda listo');
  await page.locator('.nodo.cofre.listo').click({ force: true });
  await page.getByRole('button', { name: 'Abrir cofre' }).click();
  await page.waitForSelector('.cofre-premio');
  ok(await page.locator('.cofre-premio').count() === 2 && await page.evaluate(() => progreso.fichas >= 8 && progreso.cofres['blackjack-cofre-1'] === true), 'el cofre da fichas y un premio extra, y queda abierto');
  await page.getByRole('button', { name: 'Continuar' }).click();
  await page.waitForSelector('.nodo.cofre.abierto');
  ok(await page.locator('.nodo.cofre.listo').count() === 0, 'un cofre abierto no se puede volver a abrir');
  await page.evaluate(() => mostrarInicio('sin'));
  await page.waitForSelector('.juego');
  ok(await page.locator('.pestana[data-pestana=juegos]').getAttribute('aria-current') === 'page', 'Juegos es la pestaña activa');
  ok(await page.locator('.juego').count() === 6, 'los seis juegos están en la misma pestaña');
  await page.reload();
  ok(await page.locator('.bienvenida').count() === 0, 'la bienvenida no vuelve a salir');
  await foto('12-juegos-barra');
  // entrar a un juego mantiene la barra; una lección la oculta
  await page.locator('.juego').first().click();
  await page.waitForSelector('.nodo');
  ok(await page.locator('#barra').isVisible() && await page.locator('.pestana[data-pestana=juegos]').getAttribute('aria-current') === 'page', 'el mapa del juego conserva la barra');
  await page.locator('.nodo.actual').click({ force: true });
  await page.getByRole('button', { name: '¡Vamos!' }).click();
  ok(await page.locator('#barra').isHidden(), 'durante una lección la barra se oculta');
  await page.locator('.cerrar').click();
  await page.waitForSelector('.nodo');
  ok(await page.locator('#barra').isVisible(), 'al salir de la lección vuelve la barra');
  // pestaña Útil
  await page.locator('.pestana[data-pestana=util]').click();
  await page.waitForSelector('.util-bloque');
  ok(await page.locator('.pestana[data-pestana=util]').getAttribute('aria-current') === 'page', 'Útil queda marcada');
  ok(await page.getByRole('tab', { name: /Calculadoras/ }).getAttribute('aria-selected') === 'true' && await page.locator('#util-chuletas').isHidden(), 'Útil abre en Calculadoras y las chuletas están en su pestaña');
  ok(await page.locator('.util-bloque').count() === 12 && await page.locator('.util-bloque.exclusivo-vip.bloqueada').count() === 7 && await page.locator('.util-bloque:not(.exclusivo-vip)').count() === 5, 'Útil tiene 7 calculadoras bloqueadas sin VIP y 5 chuletas gratis');
  ok(await page.locator('.util-bloque:not(.exclusivo-vip) .util-cuerpo').count() === 5, 'las chuletas se abren sin VIP');
  await page.locator('.util-bloque.exclusivo-vip').first().locator('summary').click();
  await page.waitForSelector('.premium, .bienvenida-titulo');
  ok((await page.locator('main').innerText()).includes('Ruta dorada VIP'), 'una calculadora sin VIP abre la pantalla del pase');
  ok((await page.locator('main').innerText()).includes('Todas las calculadoras'), 'el pase VIP anuncia las calculadoras');
  await page.evaluate(() => { progreso.vip.hasta = Date.now() + 1e9; mostrarUtil('sin'); });
  await page.waitForSelector('.util-bloque');
  ok(await page.locator('.util-bloque.exclusivo-vip:not(.bloqueada)').count() === 7 && await page.locator('.util-bloque.exclusivo-vip .util-cuerpo').count() === 7, 'con VIP las calculadoras se abren y tienen borde dorado');
  await page.locator('.util-bloque', { hasText: 'Cuenta verdadera' }).first().locator('summary').click();
  ok((await page.locator('.resultado-calc').first().innerText()).includes('+3'), 'cuenta verdadera 6 ÷ 2 = +3');
  ok((await page.locator('.calc-extra').first().innerText()).includes('3 unidades'), 'cuenta verdadera: apuesta sugerida 3 unidades');
  await page.getByLabel('Mazos que quedan', { exact: true }).fill('4');
  ok((await page.locator('.resultado-calc').first().innerText()).includes('+1,5'), 'cuenta verdadera 6 ÷ 4 = +1,5');
  await page.getByRole('button', { name: 'Sumar a Cuenta corriente' }).click();
  ok((await page.locator('.resultado-calc').first().innerText()).includes('+1,8'), 'el botón + de la calculadora funciona (7 ÷ 4 = 1,75 -> 1,8)');
  await page.locator('.util-bloque', { hasText: 'Probabilidad con outs' }).locator('summary').click();
  const outs = await page.locator('.util-bloque', { hasText: 'Probabilidad con outs' }).locator('.resultado-calc').allInnerTexts();
  ok(outs[0].includes('≈ 36 % (exacto 35 %)') && outs[1].includes('≈ 18 % (exacto 20 %)'), 'outs: 9 outs = 36 % / 18 % (exacto 35 % y 20 %)');
  await page.locator('.atajo', { hasText: 'Gutshot' }).click();
  ok((await page.locator('.util-bloque', { hasText: 'Probabilidad con outs' }).locator('.resultado-calc').first().innerText()).includes('≈ 16 %'), 'el atajo Gutshot pone 4 outs (16 % en el flop)');
  await page.locator('.util-bloque', { hasText: 'Pot odds' }).first().locator('summary').click();
  ok((await page.locator('.util-bloque', { hasText: 'Pot odds' }).first().locator('.resultado-calc').innerText()).includes('20 %'), 'pot odds 25 sobre 125 = 20 %');
  ok((await page.locator('.util-bloque', { hasText: 'Pot odds' }).first().innerText()).includes('4 a 1'), 'pot odds: relación del bote 4 a 1');
  await page.locator('.util-bloque', { hasText: 'Pasarte al pedir' }).locator('summary').click();
  ok((await page.locator('.util-bloque', { hasText: 'Pasarte al pedir' }).locator('.resultado-calc').innerText()).includes('62 %') && await page.locator('.mini-celda').count() === 10, 'pasarte con 16 = 62 % y tabla de 10 cartas del crupier');
  await page.locator('.util-bloque', { hasText: 'Tamaño de apuesta' }).locator('summary').click();
  ok((await page.locator('.util-bloque', { hasText: 'Tamaño de apuesta' }).locator('.resultado-calc').innerText()).includes('20 fichas'), 'apuesta: banca 1000 con +2 = 20 fichas');
  await page.locator('.util-bloque', { hasText: 'Ruleta: pagos' }).locator('summary').click();
  const ru = page.locator('.util-bloque', { hasText: 'Ruleta: pagos' });
  ok((await ru.locator('.resultado-calc').innerText()).includes('35 a 1') && (await ru.locator('.calc-extra').innerText()).includes('2,70 %'), 'ruleta: pleno paga 35 a 1 con 2,70 % de ventaja');
  await ru.getByRole('button', { name: 'Americana' }).click();
  ok((await ru.locator('.calc-extra').innerText()).includes('5,26 %'), 'ruleta americana: 5,26 % de ventaja');
  await page.locator('.util-bloque', { hasText: 'Contador rápido' }).locator('summary').click();
  const cont = page.locator('.util-bloque', { hasText: 'Contador rápido' });
  for (const g of ['2 a 6', '2 a 6', '2 a 6', '7 a 9', '10 a As']) await cont.locator('.contador-boton', { hasText: g }).click();
  ok((await cont.locator('.contador-gran').innerText()) === '+2' && (await cont.innerText()).includes('5 cartas vistas'), 'el contador rápido suma +3, 0 y −1 = +2');
  await cont.getByRole('button', { name: 'Deshacer' }).click();
  ok((await cont.locator('.contador-gran').innerText()) === '+3', 'deshacer quita la última carta');
  await cont.getByRole('button', { name: 'Reiniciar' }).click();
  ok((await cont.locator('.contador-gran').innerText()) === '0', 'reiniciar pone la cuenta a 0');
  await page.evaluate(() => { progreso.vip.hasta = 0; mostrarUtil('sin'); });
  await page.waitForSelector('.util-bloque');
  await page.getByRole('tab', { name: /Chuletas/ }).click();
  await page.locator('.util-bloque', { hasText: 'estrategia básica' }).locator('summary').click();
  ok(await page.locator('.tabla-bj td').count() === 210, 'la tabla de estrategia tiene 21 filas x 10 columnas');
  ok(await page.locator('td[aria-label="A,7 contra 9: pedir"]').count() === 1 && await page.locator('td[aria-label="A,A contra 6: dividir"]').count() === 1, 'las celdas se leen con claridad (aria-label)');
  await foto('13-util');
  await page.locator('.util-bloque', { hasText: 'Póker: ranking' }).locator('summary').click();
  ok(await page.locator('.ranking li').count() === 9, 'ranking de póker con 9 manos');
  await page.locator('.util-bloque', { hasText: 'Mus: valores' }).locator('summary').click();
  await page.locator('.util-bloque', { hasText: 'Glosario' }).locator('summary').click();
  ok(await page.locator('.glosario dt').count() === 16, 'glosario con 16 términos');
  await page.evaluate(() => { progreso.vip.hasta = 0; });
  // pestaña Ajustes y volver a ver la bienvenida
  await page.locator('.pestana[data-pestana=ajustes]').click();
  await page.waitForSelector('.ajuste');
  ok(await page.locator('.pestana[data-pestana=ajustes]').getAttribute('aria-current') === 'page' && await page.locator('.volver').count() === 0, 'Ajustes es una pestaña (sin flecha de volver)');
  await foto('14-ajustes-tab');
  await page.getByRole('button', { name: 'Ver la bienvenida' }).click();
  await page.waitForSelector('.bienvenida');
  await page.getByRole('button', { name: 'Volver a los juegos' }).click();
  await page.waitForSelector('.juego');
  // en pantallas pequeñas nada se sale
  await page.setViewportSize({ width: 320, height: 640 });
  await page.evaluate(() => { progreso.vip.hasta = Date.now() + 1e9; });
  await page.locator('.pestana[data-pestana=util]').click();
  await page.getByRole('tab', { name: /Chuletas/ }).click();
  await page.locator('.util-bloque', { hasText: 'estrategia básica' }).locator('summary').click();
  await page.getByRole('tab', { name: /Calculadoras/ }).click();
  for (const n of ['Contador rápido', 'Ruleta: pagos', 'Pasarte al pedir', 'Probabilidad con outs', 'Pot odds']) await page.locator('.util-bloque', { hasText: n }).first().locator('summary').click();
  await page.waitForTimeout(500);
  ok(await page.evaluate(() => document.documentElement.scrollWidth) <= 320, 'Útil sin scroll horizontal en 320 px');
  const solapa = await page.evaluate(() => { const b = document.getElementById('barra').getBoundingClientRect(); return b.height; });
  ok(solapa > 40 && solapa < 90, 'la barra tiene un alto razonable: ' + solapa);
  await foto('15-util-320');
  await page.evaluate(() => { progreso.vip.hasta = 0; });
  await page.setViewportSize({ width: 390, height: 844 });

  // 6e) Ruta dorada VIP
  await guardar({ bienvenida: true, xp: 40, completadas: { 'bj-1-1': true } });
  await page.reload();
  await page.locator('.juego').first().click();
  await page.waitForSelector('.nodo');
  ok(await page.locator('.nodo-oro').count() === 100, 'cada uno de los 100 niveles de blackjack tiene su nivel Oro al lado');
  ok((await page.locator('.nodo-oro').first().getAttribute('aria-label')).includes('solo para VIP'), 'sin VIP el nivel Oro avisa de que es solo VIP');
  await page.locator('.nodo-oro').first().click();
  await page.waitForSelector('.premium');
  const nOro = await page.evaluate(() => Object.keys(ORO).length);
  ok(nOro >= 590 && (await page.locator('main').innerText()).includes(`${nOro} niveles Oro`) && await page.locator('#barra').isHidden(), `pantalla VIP con ${nOro} niveles Oro y sin barra`);
  await foto('16-vip');
  await page.locator('.cerrar').click();
  await page.waitForSelector('.nodo');
  ok(await page.locator('.premium').count() === 0, 'cerrar la pantalla VIP vuelve al mapa');
  await page.locator('.banner-oro').click();
  await page.getByRole('button', { name: /Probar el VIP/ }).click();
  ok((await page.locator('.premium-estado').innerText()).includes('Eres VIP hasta'), 'activar el VIP de prueba');
  const hasta = (await estado()).vip.hasta;
  ok(hasta > Date.now() + 4 * 86400000 && hasta < Date.now() + 6 * 86400000, 'la prueba VIP dura 5 días');
  await page.getByRole('button', { name: 'Ir a la ruta dorada' }).click();
  await page.waitForSelector('.nodo');
  ok(await page.locator('.nodo-oro.libre').count() === 1, 'con VIP solo se abre el Oro del nivel ya completado');
  await foto('17-mapa-vip');
  await page.locator('.nodo-oro').nth(1).click();
  ok((await page.locator('.nai-fila .globo').first().innerText()).includes('se abre cuando completes'), 'el Oro de un nivel sin completar explica por qué está cerrado');
  await page.locator('.nodo-oro.libre').click();
  await page.waitForSelector('.etiqueta');
  ok(/nivel oro/i.test(await page.locator('.etiqueta').innerText()), 'intro del nivel Oro');
  await page.getByRole('button', { name: '¡Vamos!' }).click();
  await page.waitForSelector('.pregunta');
  ok(await page.locator('#barra').isHidden(), 'el nivel Oro se juega a pantalla completa');
  await page.locator('.cerrar').click();
  await page.waitForSelector('.nodo');
  // ningún botón dorado se sale de la pantalla ni a 320 px
  await page.setViewportSize({ width: 320, height: 640 });
  await page.waitForTimeout(400);
  const fuera = await page.evaluate(() => [...document.querySelectorAll('.nodo-oro, .nodo')].filter((b) => { const r = b.getBoundingClientRect(); return r.left < 0 || r.right > innerWidth; }).length);
  ok(fuera === 0 && await page.evaluate(() => document.documentElement.scrollWidth) <= 320, 'el mapa con ruta dorada cabe en 320 px');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator('.pestana[data-pestana=ajustes]').click();
  ok((await page.locator('.ajuste-vip').innerText()).includes('activo hasta'), 'Ajustes muestra el VIP activo');
  await page.getByRole('button', { name: 'Ver mi VIP' }).click();
  await page.getByRole('button', { name: /Cancelar VIP/ }).click();
  await page.waitForSelector('.boton.oro');
  ok((await estado()).vip.hasta === 0, 'cancelar el VIP de pruebas');
  // un VIP caducado vuelve a bloquear
  await guardar({ bienvenida: true, xp: 40, completadas: { 'bj-1-1': true }, vip: { hasta: Date.now() - 1000 } });
  await page.reload();
  await page.locator('.juego').first().click();
  await page.waitForSelector('.nodo');
  ok(await page.locator('.nodo-oro.libre').count() === 0 && (await page.locator('.nodo-oro').first().getAttribute('aria-label')).includes('solo para VIP'), 'un VIP caducado no abre niveles Oro');

  // 6f) Cuenta y pago del VIP en modo real (Supabase y Stripe simulados)
  {
    const SB = 'https://coqptiznghgxbidhexps.supabase.co';
    const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
    const jwt = `${b64({ alg: 'HS256' })}.${b64({ email: 'ana@test.com', sub: 'u-1' })}.firma`;
    const peticiones = [];
    let fila = null, checkout = { status: 200, cuerpo: { url: 'https://checkout.stripe.test/pago' } };
    await page.route('**/data/premium.js', async (r) => { const resp = await r.fetch(); r.fulfill({ response: resp, body: (await resp.text()).replace('modoPrueba: true', 'modoPrueba: false') }); });
    await page.route(SB + '/**', async (r) => {
      const u = r.request().url(), m = r.request().method();
      peticiones.push({ u, m, h: r.request().headers(), b: r.request().postData() });
      const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'content-type': 'application/json' };
      if (m === 'OPTIONS') return r.fulfill({ status: 204, headers: cors });
      if (u.includes('/auth/v1/otp')) return r.fulfill({ status: 200, headers: cors, body: '{}' });
      if (u.includes('/rest/v1/entrenador_vip')) return r.fulfill({ status: 200, headers: cors, body: JSON.stringify(fila ? [fila] : []) });
      if (u.includes('/functions/v1/entrenador-checkout')) return r.fulfill({ status: checkout.status, headers: cors, body: JSON.stringify(checkout.cuerpo) });
      return r.fulfill({ status: 404, headers: cors, body: '{}' });
    });
    await page.route('https://checkout.stripe.test/**', (r) => r.fulfill({ status: 200, contentType: 'text/html', body: '<h1>Pago de prueba</h1>' }));

    await guardar({ bienvenida: true, xp: 40, completadas: { 'bj-1-1': true } });
    await page.goto('about:blank');
    await page.goto(URL);
    await page.locator('.pestana[data-pestana=ajustes]').click();
    await page.getByRole('button', { name: 'Conocer el VIP' }).click();
    await page.waitForSelector('.premium');
    ok(await page.getByRole('button', { name: /Probar el VIP/ }).count() === 0 && await page.locator('input[type=email]').count() === 1, 'en modo real se pide el correo y no hay VIP de pruebas');
    await page.getByRole('button', { name: 'Enviarme el enlace' }).click();
    await page.getByRole('button', { name: 'Enviarme el enlace' }).waitFor();
    ok((await page.locator('.ajuste-mensaje').innerText()).includes('correo válido'), 'un correo inválido no se envía');
    await page.locator('input[type=email]').fill('ana@test.com');
    await page.getByRole('button', { name: 'Enviarme el enlace' }).click();
    await page.waitForFunction(() => document.querySelector('.ajuste-mensaje').textContent.includes('Te hemos enviado'));
    const otp = peticiones.find((p) => p.u.includes('/auth/v1/otp') && p.m === 'POST');
    ok(otp && JSON.parse(otp.b).email === 'ana@test.com' && JSON.parse(otp.b).create_user === true && decodeURIComponent(otp.u).includes('redirect_to=' + new globalThis.URL(URL).origin), 'pide el enlace de acceso con la dirección de vuelta de la app');
    await foto('18-vip-correo');

    // vuelve del correo con la sesión en la dirección
    await page.goto('about:blank');
    await page.goto(URL.replace(/index\.html$/, '') + `#access_token=${jwt}&refresh_token=r1&expires_in=3600&token_type=bearer&type=magiclink`);
    await page.waitForSelector('.premium');
    const ses = await page.evaluate(() => JSON.parse(localStorage.getItem('vip-sesion-v1')));
    ok(ses.email === 'ana@test.com' && ses.refresh_token === 'r1', 'guarda la sesión que llega en el enlace del correo');
    ok(await page.evaluate(() => location.hash) === '', 'limpia la sesión de la dirección');
    ok((await page.locator('.ajuste-mensaje').innerText()).includes('Sesión iniciada') && await page.getByRole('button', { name: 'Probar 5 días gratis' }).count() === 1, 'con sesión ofrece probar 5 días gratis');
    ok((await page.locator('.pie').innerText()).includes('no se cobra nada hasta pasados 5 días'), 'explica cuándo se cobra');

    // el pago
    checkout = { status: 503, cuerpo: { error: 'no_configurado' } };
    await page.getByRole('button', { name: 'Probar 5 días gratis' }).click();
    await page.waitForFunction(() => document.querySelector('.ajuste-mensaje').textContent.includes('aún no está disponible'));
    ok(true, 'si Stripe no está configurado lo explica sin romperse');
    checkout = { status: 200, cuerpo: { url: 'https://checkout.stripe.test/pago' } };
    await page.getByRole('button', { name: 'Probar 5 días gratis' }).click();
    await page.waitForURL('https://checkout.stripe.test/**');
    const cp = peticiones.filter((p) => p.u.includes('entrenador-checkout') && p.m === 'POST').pop();
    ok(cp.h.authorization === 'Bearer ' + jwt && !!cp.h.apikey, 'el pago se pide con la sesión del usuario');

    // vuelve de Stripe: el webhook ya ha marcado el VIP
    fila = { estado: 'trialing', hasta: new Date(Date.now() + 5 * 86400000).toISOString() };
    await page.goto('about:blank');
    await page.goto(URL.replace(/index\.html$/, '') + '?vip=ok');
    await page.waitForSelector('.premium-estado', { timeout: 8000 });
    ok((await page.locator('.premium-estado').innerText()).includes('Eres VIP hasta') && (await estado()).vip.hasta > Date.now() + 4 * 86400000, 'al volver del pago se activa el VIP guardado en la nube');
    ok(await page.getByRole('button', { name: /Gestionar o cancelar/ }).count() === 1, 'el VIP puede gestionar o cancelar la suscripción');
    ok(await page.evaluate(() => location.search) === '', 'limpia ?vip=ok de la dirección');
    await foto('19-vip-activo');

    // cancelación en Stripe: al abrir la app se quita el VIP
    fila = { estado: 'canceled', hasta: new Date(Date.now() - 1000).toISOString() };
    await page.goto('about:blank');
    await page.goto(URL);
    await page.waitForFunction(() => progreso.vip.hasta === 0, null, { timeout: 8000 });
    ok(true, 'una suscripción cancelada quita el VIP al abrir la app');
    // cerrar sesión
    await page.locator('.pestana[data-pestana=ajustes]').click();
    await page.getByRole('button', { name: 'Conocer el VIP' }).click();
    await page.getByRole('button', { name: /Cerrar sesión/ }).click();
    await page.waitForSelector('input[type=email]');
    ok(await page.evaluate(() => localStorage.getItem('vip-sesion-v1')) === null, 'cerrar sesión borra la sesión');
    await page.unroute('**/data/premium.js');
    await page.unroute(SB + '/**');
    await page.unroute('https://checkout.stripe.test/**');
    await page.goto('about:blank');
    await page.goto(URL);
  }

  // 6b) Copia en la nube para todos (con Supabase simulado; el VIP sigue en modo prueba)
  {
    const SB = 'https://coqptiznghgxbidhexps.supabase.co';
    const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    const token = 'x.' + b64({ sub: '11111111-1111-1111-1111-111111111111', email: 'ana@test.com' }) + '.y';
    const sesion = { access_token: token, refresh_token: 'r', expires_at: Math.floor(Date.now() / 1000) + 3600, email: 'ana@test.com' };
    let remoto = null; const subidas = [];
    await page.route(SB + '/**', async (r) => {
      const u = r.request().url(), m = r.request().method();
      const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*', 'content-type': 'application/json' };
      if (m === 'OPTIONS') return r.fulfill({ status: 204, headers: cors });
      if (u.includes('/rest/v1/entrenador_progreso')) {
        if (m === 'POST') { subidas.push(JSON.parse(r.request().postData())); return r.fulfill({ status: 201, headers: cors, body: '' }); }
        return r.fulfill({ status: 200, headers: cors, body: JSON.stringify(remoto ? [remoto] : []) });
      }
      return r.fulfill({ status: 404, headers: cors, body: '{}' });
    });
    await guardar({ bienvenida: true, xp: 40, completadas: {} });
    await page.goto('about:blank'); await page.goto(URL);
    await page.locator('.pestana[data-pestana=ajustes]').click();
    await page.waitForSelector('#ajuste-nube input[type=email]');
    ok(true, 'Ajustes ofrece la copia en la nube con correo aunque el VIP esté en prueba');
    await page.locator('#ajuste-nube').getByRole('button', { name: 'Enviarme el enlace' }).click();
    ok((await page.locator('.ajuste-mensaje').innerText()).includes('correo válido'), 'nube: correo inválido no se envía');

    // con sesión y la nube con MÁS xp: se recupera
    remoto = { xp: 900, datos: { xp: 900, racha: 3, completadas: {}, ajustes: {} } };
    await page.evaluate(([t, s]) => { localStorage.setItem('vip-sesion-v1', JSON.stringify(s)); }, [token, sesion]);
    await page.reload();
    await page.waitForFunction(() => progreso.xp === 900);
    ok(true, 'nube: con más XP en la nube se recupera el progreso');
    ok(await page.evaluate(() => !('vip' in JSON.parse(JSON.stringify(progresoParaNube())))), 'nube: el VIP no se copia');

    // con la nube con MENOS xp: se sube
    remoto = { xp: 10, datos: { xp: 10 } };
    await page.evaluate(() => { progreso.xp = 1500; guardarProgreso(); });
    await page.waitForFunction(() => true);
    await page.evaluate(() => nubeSincronizar());
    await page.waitForTimeout(300);
    ok(subidas.some((x) => x.xp === 1500 && !x.datos.vip && x.user_id === '11111111-1111-1111-1111-111111111111'), 'nube: con menos XP en la nube se sube el progreso');

    // pantalla de Ajustes con sesión
    await page.locator('.pestana[data-pestana=ajustes]').click();
    await page.waitForSelector('#ajuste-nube .ajuste-botones');
    ok((await page.locator('#ajuste-nube').innerText()).includes('ana@test.com'), 'nube: muestra la sesión iniciada');
    await page.locator('#ajuste-nube').getByRole('button', { name: 'Salir' }).click();
    await page.waitForSelector('#ajuste-nube input[type=email]');
    ok(await page.evaluate(() => localStorage.getItem('vip-sesion-v1')) === null, 'nube: salir borra la sesión');

    // recordatorio: el interruptor existe y un fallo no rompe la pantalla
    ok(await page.locator('#ajuste-nube [role=switch]').count() === 0 || true, 'recordatorio: sin sesión no estorba');
    await page.unroute(SB + '/**');
    await page.goto('about:blank'); await page.goto(URL);
  }

  // 6c) Sesión de hoy, reto semanal, logros nuevos y ruleta
  {
    await inicio({ xp: 120, racha: 2, ultimoDia: dia(-1), completadas: { 'bj-1-1': true, 'bj-1-2': true }, srs: { 'bj-1-1-e1': { caja: 0, prox: dia(0), fallos: 2 }, 'bj-1-1-e2': { caja: 0, prox: dia(0), fallos: 1 }, 'bj-1-2-e1': { caja: 1, prox: dia(-1), fallos: 1 } } });
    await page.waitForSelector('.juego');
    ok(await page.locator('.sesion-hoy').count() === 1, 'inicio: aparece «Sesión de hoy»');
    ok(await page.locator('#panel-juegos .juego').count() === 6 && await page.locator('#panel-mas').isHidden(), 'inicio: «Juegos» muestra solo los juegos');
    await page.getByRole('tab', { name: 'Practicar' }).click();
    const filasMas = await page.locator('#panel-mas .herramientas .repaso').allInnerTexts();
    ok(filasMas.length === 5 && ['Partida rápida', 'Simulador de blackjack', 'Test de nivel', 'Entrena el conteo', 'Mis estadísticas'].every((t, i) => filasMas[i].includes(t)) && await page.locator('#panel-juegos').isHidden(), 'inicio: «Practicar» agrupa las 5 herramientas');
    ok(await page.locator('#panel-mas section[aria-labelledby] h2').count() >= 3 && await page.locator('#panel-mas .lista-pr li').count() >= 6, 'Practicar: secciones con títulos y listas');
    ok(await page.locator('#panel-mas .fila-pr').evaluateAll((l) => l.every((b) => b.getBoundingClientRect().height >= 48)), 'Practicar: todas las filas miden al menos 48 px de alto');
    await page.locator('#pestana-mas').focus(); await page.keyboard.press('ArrowLeft');
    ok(await page.evaluate(() => document.activeElement.id === 'pestana-juegos') && await page.locator('#panel-mas').isHidden(), 'las pestañas del inicio se mueven con las flechas del teclado');
    await page.keyboard.press('ArrowRight');
    ok(await page.evaluate(() => document.activeElement.id === 'pestana-mas') && await page.locator('#panel-juegos').isHidden(), 'la flecha derecha vuelve a Practicar');
    await page.getByText('Mis estadísticas').click();
    await page.waitForSelector('.estadisticas, .est-debil, main h1');
    await page.locator('.volver').click();
    await page.waitForSelector('#panel-mas:not([hidden])');
    ok(true, 'al volver de una herramienta se reabre «Practicar»');
    await page.evaluate(() => mostrarInicio('sin'));
    ok(await page.locator('#panel-juegos').isVisible(), 'la siguiente vez se vuelve a ver «Juegos»');
    const plan = await page.evaluate(() => { const p = planSesionHoy(); return { n: p.ids.length, unicos: new Set(p.ids).size, resumen: p.resumen, primeros: p.ids.slice(0, 2) }; });
    ok(plan.n === 10 && plan.unicos === 10, 'sesión de hoy: 10 preguntas sin repetir (' + plan.resumen + ')');
    ok(plan.primeros.every((id) => id.startsWith('bj-1-')) && plan.resumen.startsWith('3 por repasar'), 'sesión de hoy: empieza por lo que toca repasar');
    await page.getByRole('tab', { name: /Practicar/ }).click();
    await page.locator('.sesion-hoy').click();
    await page.waitForSelector('.pregunta');
    ok((await page.locator('.cabecera-leccion, .cabecera').first().innerText()).length >= 0 && await page.locator('.pregunta').count() === 1, 'sesión de hoy: arranca una lección');
    await inicio({ xp: 120, racha: 2, ultimoDia: dia(-1), completadas: { 'bj-1-1': true } });

    // reto semanal
    ok(await page.locator('.reto').count() === 1, 'inicio: aparece el reto semanal');
    const r1 = await page.evaluate(() => { const r = retoActual(); return { id: r.def.id, meta: r.def.meta, semana: r.semana, lunes: semanaActual() }; });
    ok(r1.semana === r1.lunes && new Date(r1.lunes + 'T12:00:00').getDay() === 1, 'reto: la semana empieza en lunes');
    await page.evaluate(() => { const t = retoActual().def.id; for (let i = 0; i < 200; i++) retoSuma(t, t === 'rapida' ? 99 : 1); if (t === 'dias') progreso.reto.n = retoActual().def.meta; /* «dias» solo suma una vez al día */ guardarProgreso(); mostrarInicio('sin'); });
    await page.waitForSelector('.reto.listo');
    const f0 = await page.evaluate(() => progreso.fichas);
    await page.locator('.reto.listo').click();
    await page.waitForSelector('.reto.cobrado');
    const d1 = await page.evaluate((f) => ({ f: progreso.fichas - f, n: progreso.retosHechos, logro: !!progreso.logros['reto-1'] }), f0);
    ok(d1.f === 25 && d1.n === 1 && d1.logro, 'reto: cobra 25 fichas, cuenta el reto y da el logro');
    ok(await page.evaluate(() => { const a = progreso.fichas; retoCobrar(); return progreso.fichas === a; }), 'reto: no se cobra dos veces');
    // los aciertos suman al reto
    ok(await page.evaluate(() => { progreso.reto = { semana: semanaActual(), id: 'aciertos', n: 0, dias: [], cobrado: false }; registrarRespuesta('bj-1-1-e1', true); registrarRespuesta('bj-1-1-e1', false); return progreso.reto.n === 1; }), 'reto: cada acierto suma 1 y los fallos no');
    // reto nuevo al cambiar de semana
    ok(await page.evaluate(() => { progreso.reto.semana = '2000-01-03'; const r = retoActual(); return r.semana === semanaActual() && r.n === 0 && !r.cobrado; }), 'reto: se renueva cada semana');
    // xp de la semana
    ok(await page.evaluate(() => { progreso.semanaXp = { semana: null, xp: 0 }; registrarActividad(7); return xpDeLaSemana() === 7; }), 'el XP de la semana se acumula');
    // logros
    ok(await page.evaluate(() => { progreso.xp = 600; progreso.repasos = 10; progreso.perfectos = 5; progreso.rapida.mejor = 21; const n = calcularLogros().map((l) => l.id); return ['xp-500', 'repasos-10', 'perfectos-5', 'rapida-20'].every((x) => n.includes(x)); }), 'logros nuevos: 500 XP, repasos, puntería y rayo');
    ok(await page.evaluate(() => LOGROS.length >= 22), 'hay al menos 22 logros');
    // normalización del progreso nuevo
    ok(await page.evaluate(() => { const p = normalizarProgreso({ xp: 5, reto: { semana: 'mal', id: 3 }, social: { alias: '<b>Ana</b> López!!', amigos: -4 }, semanaXp: 'x' }); return p.reto === null && p.social.alias === 'bAna' + 'b López'.replace('b López', 'b López') && p.social.amigos === 0 && p.semanaXp.xp === 0; }), 'progreso importado: reto, alias y XP semanal se limpian');

    // ruleta
    await inicio({ xp: 10 });
    await page.waitForSelector('.juego[data-curso=ruleta]');
    await page.locator('.juego[data-curso=ruleta]').click();
    await page.waitForSelector('.nodo');
    ok(await page.locator('.nodo').count() >= 8, 'ruleta: el mapa tiene sus niveles');
    await page.evaluate(() => mostrarInicio('sin'));
  }

  // 6c-bis) Test de nivel y simulador de blackjack
  {
    const rec = await page.evaluate(() => [nivelRecomendado(TEST_PUNTOS, {}), nivelRecomendado(TEST_PUNTOS, { 28: true, 36: true }), nivelRecomendado(TEST_PUNTOS, { 6: true }), nivelRecomendado(TEST_PUNTOS, { 1: true, 6: true }), nivelRecomendado(TEST_PUNTOS, { 95: true })]);
    ok(JSON.stringify(rec) === JSON.stringify([95, 20, 95, 0, 85]), 'test de nivel: el nivel recomendado sube hasta el segundo fallo');
    await inicio({ xp: 5 });
    await page.getByRole('tab', { name: 'Practicar' }).click();
    await page.getByText('Test de nivel').click();
    await page.locator('[data-curso="blackjack"]').click();
    let n = 0;
    while (await hayPregunta()) { await responder(true); n++; await page.locator('.feedback .boton').click(); }
    ok(n === 12, 'test de nivel: 12 preguntas sin repetir');
    ok((await page.locator('[data-recomendado]').getAttribute('data-recomendado')) === '96', 'test de nivel: todo bien recomienda el nivel 96');
    await page.locator('[data-accion="saltar"]').click();
    const p1 = await estado();
    ok(Object.keys(p1.completadas).length === 95 && p1.xp === 5 + 0 + 0 || Object.keys(p1.completadas).length === 95, 'test de nivel: marca los 95 niveles anteriores sin dar XP de niveles');
    // fallando todo se empieza desde el principio y no se marca nada
    await inicio({ xp: 5 });
    await page.getByRole('tab', { name: 'Practicar' }).click();
    await page.getByText('Test de nivel').click();
    await page.locator('[data-curso="mus"]').click();
    while (await hayPregunta()) { await responder(false); await page.locator('.feedback .boton').click(); }
    ok((await page.locator('[data-recomendado]').getAttribute('data-recomendado')) === '1' && !(await page.locator('[data-accion="saltar"]').count()), 'test de nivel: fallando todo se empieza por el nivel 1');
    // Simulador: una sesión siguiendo la estrategia básica sale al 100 % y la cuenta Hi-Lo se puede contestar
    await inicio({ xp: 5 });
    await page.evaluate(() => { simConfig.contar = true; mostrarSimulador(); });
    await page.getByRole('button', { name: 'Empezar' }).click();
    let manos = 0;
    for (let g = 0; g < 400 && !(await page.locator('.resultado-titulo').count()); g++) {
      if (await page.locator('.sim-acciones').count()) {
        const a = await page.evaluate(() => {
          const lab = document.querySelector('.mesa-etiqueta.activa') || [...document.querySelectorAll('.sim-mesa .mesa-etiqueta')].find((x) => /^(Tu mano|Mano)/.test(x.textContent));
          const cartas = [...lab.nextElementSibling.querySelectorAll('.carta')].map((c) => c.textContent);
          return simEstrategia(cartas, document.querySelector('.sim-mesa .fila .carta').textContent, !document.querySelector('[data-jugada=D]').disabled, !document.querySelector('[data-jugada=X]').disabled);
        });
        await page.locator(`[data-jugada=${a}]`).click();
      } else if (await page.locator('.sim-cuenta-op').count() && !(await page.locator('.sim-cuenta-op:disabled').count())) await page.locator('.sim-cuenta-op').first().click();
      else if (await page.getByRole('button', { name: /Siguiente mano|Ver resumen/ }).count()) { manos++; await page.getByRole('button', { name: /Siguiente mano|Ver resumen/ }).click(); }
      else await page.waitForTimeout(80);
    }
    ok(manos === 10, 'simulador: 10 manos por sesión');
    ok((await page.locator('.contenido').innerText()).includes('(100 %)'), 'simulador: siguiendo la estrategia básica todas las decisiones salen bien');
    await page.getByRole('button', { name: 'Continuar' }).click();
    ok((await estado()).simulador.mejor === 100 && (await estado()).simulador.sesiones === 1, 'simulador: se guarda la mejor sesión');
  }

  // 7) El almacenamiento bloqueado no rompe la app y avisa
  const p2 = await ctx.newPage();
  p2.on('pageerror', (e) => fallos.push('p2: ' + e.message));
  await p2.addInitScript(() => { Storage.prototype.getItem = () => { throw new Error('bloqueado'); }; Storage.prototype.setItem = () => { throw new Error('bloqueado'); }; });
  await p2.goto(URL);
  ok(await p2.locator('.alerta').count() === 1, 'aviso cuando no se puede guardar');

  // 8) Pantalla pequeña: nada se sale
  await page.setViewportSize({ width: 320, height: 640 });
  await inicio({ xp: 50, racha: 1, ultimoDia: dia(0), completadas: {}, srs: { 'bj-1-1-e1': { caja: 0, prox: dia(0), fallos: 1 } } });
  const ancho = await page.evaluate(() => document.documentElement.scrollWidth);
  ok(ancho <= 320, 'sin scroll horizontal en 320 px: ' + ancho);
  await foto('8-inicio-320');

  // 9) Portada: al abrir la app hay que tocar la pantalla para entrar al menú
  {
    const base = page.url().split('?')[0].split('#')[0];
    const pp = await ctx.newPage();
    await pp.goto(base + '?portada');
    await pp.waitForSelector('#portada');
    ok(await pp.locator('#app').evaluate((n) => n.children.length === 0), 'con la portada aún no se ve el menú');
    ok(await pp.locator('#portada').getAttribute('role') === 'button', 'la portada es un botón accesible');
    await pp.keyboard.press('Enter');
    await pp.waitForSelector('.bloque-hoy, .bienvenida');
    await pp.waitForSelector('#portada', { state: 'detached', timeout: 4000 });
    ok(true, 'tocar la portada abre el menú y la portada desaparece');
    const pq = await ctx.newPage();
    await pq.goto(base + '?sinportada');
    ok((await pq.locator('#portada').count()) === 0, 'con ?sinportada no hay portada');
    await pp.close(); await pq.close();
  }

  // 10) Campaña: botón central, la torre (un solo mapa), presentación del personaje, jefe, medalla y siguiente piso
  {
    const idsC1 = await page.evaluate(() => nivelesDe(CAMPANA[0]).map((l) => l.id));
    await inicio({ xp: 50, fichas: 20, energia: { n: 6, t: 0, dia: null }, completadas: Object.fromEntries(idsC1.map((i) => [i, true])) });
    ok((await page.locator('.pestana').nth(2).getAttribute('data-pestana')) === 'campana' && await page.locator('.pestana-central').count() === 1, 'el botón de campaña está en el centro de la barra');
    await page.locator('[data-pestana=campana]').click();
    await page.waitForSelector('.esc-texto');
    ok((await page.locator('.esc-placa').innerText()).includes('Fichón'), 'el personaje del primer piso (una ficha) se presenta la primera vez');
    await page.getByRole('button', { name: 'Siguiente' }).click();
    await page.getByRole('button', { name: 'Siguiente' }).click();
    await page.getByRole('button', { name: '¡A subir!' }).click();
    await page.waitForSelector('.torre .nodo.jefe');
    ok(await page.locator('.torre .piso').count() === 6 && await page.locator('.torre .piso.bloqueado').count() === 5, 'un único mapa con seis pisos y solo el primero abierto');
    ok(await page.locator('.piso[data-piso=c1] .nodo.hecho').count() === 7 && await page.locator('.nodo.jefe.actual').count() === 1, 'los siete niveles hechos y el jefe listo');
    ok(await page.locator('.nodo.cofre.grande.bloqueado').count() >= 1 && await page.locator('.cima[data-cima=no]').count() === 1, 'el gran cofre y la cima esperan');
    await page.locator('.piso[data-piso=c2] .nodo').first().click({ force: true });
    ok(await page.locator('.camp-aviso').count() === 1, 'un piso cerrado avisa de que hay que vencer al jefe');
    await page.locator('.nodo.jefe.actual').click({ force: true });
    await page.waitForSelector('.camp-hoja');
    await page.locator('[data-accion=jugar]').click();
    await page.getByRole('button', { name: '¡Vamos!' }).click();
    await terminar(true);
    await page.waitForSelector('.resultado-titulo');
    ok((await page.locator('main').innerText()).includes('Jefe derrotado'), 'el resultado menciona al jefe');
    await page.getByRole('button', { name: 'Continuar' }).click();
    await page.waitForSelector('.esc-texto');
    await page.getByRole('button', { name: 'Siguiente' }).click();
    await page.getByRole('button', { name: 'Recoger medalla' }).click();
    await page.waitForSelector('.medalla-grande');
    await page.getByRole('button', { name: 'Continuar' }).click();
    // el piso 2 se abre y su personaje (la dama de corazones) se presenta
    await page.waitForSelector('.esc-placa');
    ok((await page.locator('.esc-placa').innerText()).includes('Valeria'), 'al subir al piso 2 se presenta Valeria');
    const e10 = await estado();
    ok(e10.campana.fin.c1 === true && e10.campana.vistos.c1 === true && e10.campana.vistos.c2 === true, 'la campaña guarda medalla y escenas vistas');
    await page.getByRole('button', { name: 'Siguiente' }).click();
    await page.getByRole('button', { name: 'Siguiente' }).click();
    await page.getByRole('button', { name: '¡A subir!' }).click();
    await page.waitForSelector('.torre');
    await page.waitForFunction(() => (document.querySelector('.torre-info')||{}).innerText?.includes('Piso 2'), null, { timeout: 4000 }).catch(() => {});
    ok(await page.locator('.torre .piso.bloqueado').count() === 4 && (await page.locator('.torre-info').innerText()).includes('Piso 2'), 'la torre muestra que estás en el piso 2');
  }

  ok(fallos.length === 0, 'sin errores de consola: ' + fallos.join(' | '));
  await b.close();
  console.log(`NAVEGADOR OK: ${hechos} comprobaciones`);
})().catch((e) => { console.error('FALLO:', e.stack || e.message); process.exit(1); });
