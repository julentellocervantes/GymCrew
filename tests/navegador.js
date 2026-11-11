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
    const ej = todos.find((e) => e.pregunta === q);
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
    } else {
      const t = await textosOp();
      const buena = ej.opciones[ej.correcta];
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
    const ej = todos.find((e) => e.pregunta === q);
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
  await page.getByText('Mis errores').click();
  ok(await page.locator('.pregunta').count() === 1, 'empieza el repaso de errores');
  await terminar(true);
  await page.waitForSelector('.resultado-titulo');
  await page.getByRole('button', { name: 'Continuar' }).click();
  await page.waitForSelector('.meta');
  ok(await page.locator('h1', { hasText: 'Elige un juego' }).count() === 1, 'el repaso global vuelve a inicio');
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
  await page.locator('.ajustes-btn').click();
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
    const ej = todos.find((e) => e.pregunta === q);
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
    const ej = todos.find((e) => e.pregunta === q);
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
    const ej = todos.find((e) => e.pregunta === q);
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
  await page.locator('.ajustes-btn').click();
  await page.getByRole('switch', { name: /Efectos de sonido/ }).click();
  ok((await estado()).ajustes.sonido === false, 'el sonido se desactiva en Ajustes');
  await page.evaluate(() => (sonido.registro.length = 0));
  await abrirNivel('bj-1-1');
  await responder(true);
  await page.mouse.click(10, 10);
  ok((await page.evaluate(() => sonido.registro.length)) === 0, 'con el sonido desactivado no suena nada');
  await page.reload();
  await page.locator('.ajustes-btn').click();
  ok(await page.getByRole('switch', { name: /Efectos de sonido/ }).getAttribute('aria-checked') === 'false', 'el ajuste de sonido se recuerda');
  await page.getByRole('switch', { name: /Efectos de sonido/ }).click();
  ok((await estado()).ajustes.sonido === true, 'y se puede volver a activar');

  // 6d) Bienvenida, barra inferior y pestaña Útil
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForSelector('.bienvenida');
  ok((await page.locator('main').innerText()).includes('Bienvenido al Entrenador de cartas'), 'un usuario nuevo ve la bienvenida');
  ok(await page.locator('#barra').isHidden(), 'la bienvenida no muestra la barra inferior');
  await foto('11-bienvenida');
  await page.getByRole('button', { name: 'Empezar' }).click();
  await page.waitForSelector('.juego');
  ok((await estado()).bienvenida === true, 'la bienvenida se recuerda');
  ok(await page.locator('#barra').isVisible(), 'la barra aparece en Juegos');
  ok(await page.locator('.pestana').count() === 3, 'tres pestañas: Juegos, Útil y Ajustes');
  ok(await page.locator('.pestana[data-pestana=juegos]').getAttribute('aria-current') === 'page', 'Juegos es la pestaña activa');
  ok(await page.locator('.juego').count() === 3, 'los tres juegos están en la misma pestaña');
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
  ok(await page.locator('.util-bloque').count() === 9, 'Útil tiene 4 calculadoras y 5 chuletas');
  await page.locator('.util-bloque', { hasText: 'Cuenta verdadera' }).first().locator('summary').click();
  ok((await page.locator('.resultado-calc').first().innerText()).includes('+3'), 'cuenta verdadera 6 ÷ 2 = +3');
  await page.getByLabel('Mazos que quedan', { exact: true }).fill('4');
  ok((await page.locator('.resultado-calc').first().innerText()).includes('+1,5'), 'cuenta verdadera 6 ÷ 4 = +1,5');
  await page.getByRole('button', { name: 'Sumar a Cuenta corriente' }).click();
  ok((await page.locator('.resultado-calc').first().innerText()).includes('+1,8'), 'el botón + de la calculadora funciona (7 ÷ 4 = 1,75 -> 1,8)');
  await page.locator('.util-bloque', { hasText: 'Probabilidad con outs' }).locator('summary').click();
  const outs = await page.locator('.util-bloque', { hasText: 'Probabilidad con outs' }).locator('.resultado-calc').allInnerTexts();
  ok(outs[0].includes('≈ 36 % (exacto 35 %)') && outs[1].includes('≈ 18 % (exacto 20 %)'), 'outs: 9 outs = 36 % / 18 % (exacto 35 % y 20 %)');
  await page.locator('.util-bloque', { hasText: 'Pot odds' }).first().locator('summary').click();
  ok((await page.locator('.util-bloque', { hasText: 'Pot odds' }).first().locator('.resultado-calc').innerText()).includes('20 %'), 'pot odds 25 sobre 125 = 20 %');
  await page.locator('.util-bloque', { hasText: 'Contador rápido' }).locator('summary').click();
  const cont = page.locator('.util-bloque', { hasText: 'Contador rápido' });
  for (const g of ['2 a 6', '2 a 6', '2 a 6', '7 a 9', '10 a As']) await cont.locator('.contador-boton', { hasText: g }).click();
  ok((await cont.locator('.contador-gran').innerText()) === '+2' && (await cont.innerText()).includes('5 cartas vistas'), 'el contador rápido suma +3, 0 y −1 = +2');
  await cont.getByRole('button', { name: 'Deshacer' }).click();
  ok((await cont.locator('.contador-gran').innerText()) === '+3', 'deshacer quita la última carta');
  await cont.getByRole('button', { name: 'Reiniciar' }).click();
  ok((await cont.locator('.contador-gran').innerText()) === '0', 'reiniciar pone la cuenta a 0');
  await page.locator('.util-bloque', { hasText: 'estrategia básica' }).locator('summary').click();
  ok(await page.locator('.tabla-bj td').count() === 210, 'la tabla de estrategia tiene 21 filas x 10 columnas');
  ok(await page.locator('td[aria-label="A,7 contra 9: pedir"]').count() === 1 && await page.locator('td[aria-label="A,A contra 6: dividir"]').count() === 1, 'las celdas se leen con claridad (aria-label)');
  await foto('13-util');
  await page.locator('.util-bloque', { hasText: 'Póker: ranking' }).locator('summary').click();
  ok(await page.locator('.ranking li').count() === 9, 'ranking de póker con 9 manos');
  await page.locator('.util-bloque', { hasText: 'Mus: valores' }).locator('summary').click();
  await page.locator('.util-bloque', { hasText: 'Glosario' }).locator('summary').click();
  ok(await page.locator('.glosario dt').count() === 16, 'glosario con 16 términos');
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
  await page.locator('.pestana[data-pestana=util]').click();
  await page.locator('.util-bloque', { hasText: 'estrategia básica' }).locator('summary').click();
  await page.locator('.util-bloque', { hasText: 'Contador rápido' }).locator('summary').click();
  await page.waitForTimeout(500);
  ok(await page.evaluate(() => document.documentElement.scrollWidth) <= 320, 'Útil sin scroll horizontal en 320 px');
  const solapa = await page.evaluate(() => { const b = document.getElementById('barra').getBoundingClientRect(); return b.height; });
  ok(solapa > 40 && solapa < 90, 'la barra tiene un alto razonable: ' + solapa);
  await foto('15-util-320');
  await page.setViewportSize({ width: 390, height: 844 });

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

  ok(fallos.length === 0, 'sin errores de consola: ' + fallos.join(' | '));
  await b.close();
  console.log(`NAVEGADOR OK: ${hechos} comprobaciones`);
})().catch((e) => { console.error('FALLO:', e.message); process.exit(1); });
