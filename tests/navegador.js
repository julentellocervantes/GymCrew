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
  const inicio = async (p) => { await guardar(p); await page.reload(); };

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
  await page.getByRole('switch').click();
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
  await page.locator('.enlace', { hasText: 'Ajustes' }).click();
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
  await page.getByRole('button', { name: 'Empezar' }).click();
  const vistas = [];
  const t0 = Date.now();
  while (Date.now() - t0 < 14000 && !(await page.locator('.conteo-selector').count())) {
    const c = await page.locator('.conteo-zona .carta').first().textContent().catch(() => null);
    const n = await page.locator('.conteo-contador').textContent().catch(() => '');
    if (c && n && vistas.length < parseInt(n)) { vistas.push(c); }
    await page.waitForTimeout(40);
  }
  await page.waitForSelector('.conteo-selector');
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
  await page.getByRole('button', { name: 'Empezar' }).click();
  const vistas2 = [];
  const t1 = Date.now();
  while (Date.now() - t1 < 14000 && !(await page.locator('.conteo-selector').count())) {
    const c = await page.locator('.conteo-zona .carta').first().textContent().catch(() => null);
    const n = await page.locator('.conteo-contador').textContent().catch(() => '');
    if (c && n && vistas2.length < parseInt(n)) vistas2.push(c);
    await page.waitForTimeout(40);
  }
  await page.waitForSelector('.conteo-selector');
  const esp2 = vistas2.reduce((s, c) => s + hiLo(c), 0);
  for (let i = 0; i < Math.abs(esp2); i++) await page.getByRole('button', { name: esp2 > 0 ? 'Sumar uno' : 'Restar uno' }).click();
  await page.getByRole('button', { name: 'Comprobar' }).click();
  await page.waitForSelector('.conteo-lista');
  ok((await page.locator('main').innerText()).includes('Bien contado'), 'cuenta correcta detectada (' + esp2 + ')');
  p = await estado();
  ok(p.conteo.mejor === Math.round(60000 / 700) && p.conteo.sesiones === 2 && p.logros.contador, 'récord y logro de contador');

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
