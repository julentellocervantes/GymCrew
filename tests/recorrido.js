// Recorre TODOS los niveles respondiendo bien cada pregunta (test, ordenar, tocar cartas, cifra y parejas)
// y comprueba que cada nivel termina y que no hay errores. Uso: node tests/recorrido.js [url]  (SOLO_NUEVAS=1: solo los niveles con clasificar, deslizador o rellenar)
const { chromium } = require('playwright');
const URL = process.argv[2] || 'http://localhost:8123/index.html';
const esc = (t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
  await ctx.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  const page = await ctx.newPage();
  const fallos = [];
  page.on('pageerror', (e) => fallos.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) fallos.push(m.text()); });
  await page.goto(URL);
  // los niveles normales y, a continuación, los niveles Oro de la ruta dorada
  let lecciones = await page.evaluate(() => CURSOS.flatMap((c) => niveles(c).concat(niveles(c).map((l) => ORO[l.id]).filter(Boolean)).map((l) => ({ curso: c.id, id: l.id, n: l.ejercicios.length, nueva: l.ejercicios.some((e) => ['clasificar', 'deslizador', 'rellenar', 'relampago', 'vf', 'duelo', 'eliminar', 'reloj', 'construir', 'memoria', 'errata'].includes(e.tipo)) }))));
  if (process.env.SOLO_CURSO) lecciones = lecciones.filter((l) => l.curso === process.env.SOLO_CURSO);
  if (process.env.SOLO_ID) lecciones = lecciones.filter((l) => new RegExp(process.env.SOLO_ID).test(l.id)); // p. ej. SOLO_ID='^oro-pk-5-'
  if (process.env.SOLO_NUEVAS) lecciones = lecciones.filter((l) => l.nueva); // node tests/recorrido.js con SOLO_NUEVAS=1
  const porTipo = {};
  for (const lec of lecciones) {
    if (process.env.PROGRESO) console.log('nivel', lec.id);
    await page.evaluate(([cid, id]) => { const c = CURSOS.find((x) => x.id === cid); mostrarLeccion(c, niveles(c).concat(Object.values(ORO)).find((l) => l.id === id)); }, [lec.curso, lec.id]);
    await page.waitForTimeout(150);
    if (await page.getByRole('button', { name: '¡Vamos!' }).count()) await page.getByRole('button', { name: '¡Vamos!' }).click();
    const vistos = [];
    // si todo se responde bien, las preguntas salen en el mismo orden que en los datos
    const orden = await page.evaluate(([cid, id]) => niveles(CURSOS.find((x) => x.id === cid)).concat(Object.values(ORO)).find((l) => l.id === id).ejercicios, [lec.curso, lec.id]);
    for (let paso = 0; paso < lec.n + 2; paso++) {
      if (!(await page.locator('.pregunta').count())) break;
      const q = await page.locator('.pregunta').first().innerText();
      const ej = orden[paso];
      if (!ej || ej.pregunta !== q) throw new Error(`${lec.id}: la pregunta ${paso + 1} no coincide: «${q}»`);
      vistos.push(ej.tipo);
      porTipo[ej.tipo] = (porTipo[ej.tipo] || 0) + 1;
      if (ej.tipo === 'ordenar') {
        for (const t of ej.elementos) await page.locator('.ordenar-banco .ficha', { hasText: new RegExp('^\\s*' + esc(t) + '\\s*$') }).click();
        await page.getByRole('button', { name: 'Comprobar' }).click();
      } else if (ej.tipo === 'seleccionar') {
        for (const i of ej.correctas) await page.locator('.carta-pick').nth(i).click();
        await page.getByRole('button', { name: 'Comprobar' }).click();
      } else if (ej.tipo === 'numero') {
        await page.locator('.numero-entrada').fill(String(ej.respuesta));
        await page.keyboard.press('Enter');
      } else if (ej.tipo === 'emparejar') {
        for (const [a, d] of ej.pares) {
          await page.locator('.parejas-col').first().locator('.par', { hasText: new RegExp('^' + esc(a) + '$') }).click();
          await page.locator('.parejas-col').nth(1).locator('.par', { hasText: new RegExp('^' + esc(d) + '$') }).click();
        }
        await page.waitForSelector('.feedback');
      } else if (ej.tipo === 'clasificar') {
        for (let k = 0; k < ej.elementos.length; k++) {
          const cajon = ej.elementos[Number(await page.locator('.clas-ficha').getAttribute('data-clas'))][1];
          await page.locator('.clas-cajon').nth(cajon).click();
        }
        await page.waitForSelector('.feedback');
      } else if (ej.tipo === 'deslizador') {
        await page.locator('.desliz-control').evaluate((c, v) => { c.value = v; c.dispatchEvent(new Event('input', { bubbles: true })); }, String(ej.respuesta));
        await page.getByRole('button', { name: 'Comprobar' }).click();
      } else if (ej.tipo === 'relampago') {
        while (!(await page.locator('.feedback').count())) {
          await page.waitForSelector('.feedback, .rel-opcion:not([disabled])');
        if (await page.locator('.feedback').count()) break;
        const i = Number(await page.locator('.rel-item').getAttribute('data-rel'));
          await page.locator('.rel-opcion').nth(ej.items[i][1]).click();
        }
      } else if (ej.tipo === 'rellenar') {
        for (const h of ej.huecos) await page.locator('.rell-palabra:not(:disabled)', { hasText: new RegExp('^\\s*' + esc(h) + '\\s*$') }).click();
        await page.getByRole('button', { name: 'Comprobar' }).click();
      } else if (ej.tipo === 'vf') {
        await page.locator(`.vf-boton[data-vf="${ej.verdadero ? 'v' : 'f'}"]`).click();
      } else if (ej.tipo === 'duelo') {
        const t = await page.locator('.duelo-carta').evaluateAll((els) => els.map((e) => e.lastChild.textContent.trim()));
        await page.locator('.duelo-carta').nth(t.indexOf(ej.acierto)).click();
      } else if (ej.tipo === 'eliminar') {
        const t = await page.locator('.elim-texto').allInnerTexts();
        const buena = ej.base.opciones[ej.base.correcta];
        for (let i = 0; i < t.length; i++) if (t[i].trim() !== buena) await page.locator('.elim-opcion').nth(i).click();
        await page.waitForSelector('.feedback');
      } else if (ej.tipo === 'construir') {
        for (const w of ej.palabras) await page.locator('.construir .ordenar-banco .ficha', { hasText: new RegExp('^\\s*' + esc(w) + '\\s*$') }).first().click();
        await page.getByRole('button', { name: 'Comprobar' }).click();
      } else if (ej.tipo === 'memoria') {
        for (let i = 0; i < ej.pares.length; i++) {
          await page.locator(`.mem-carta[data-par="${i}"]:not(:disabled)`).nth(0).click();
          await page.locator(`.mem-carta[data-par="${i}"]:not(.abierta):not(:disabled)`).nth(0).click();
        }
        await page.waitForSelector('.feedback');
      } else if (ej.tipo === 'errata') {
        await page.locator(`.errata-ficha[data-errata="${ej.intruso}"]`).click();
      } else {
        const base = ej.tipo === 'reloj' ? ej.base : ej;
        const t = await page.locator('.opcion').evaluateAll((els) => els.map((e) => e.innerText.replace(/^\s*\d+\s*/, '').trim()));
        await page.locator('.opcion').nth(t.indexOf(base.opciones[base.correcta])).click();
      }
      if (!(await page.locator('.feedback.bien').count())) throw new Error(`${lec.id}: la respuesta correcta no se aceptó en «${q}»`);
      await page.locator('.feedback .boton').click();
      await page.waitForFunction(() => !document.querySelector('.feedback'), null, { timeout: 5000 }).catch(() => {}); // espera a que salga la pantalla anterior (con la máquina cargada tarda)
    }
    await page.waitForSelector('.resultado-titulo', { timeout: 5000 }).catch(() => { throw new Error(lec.id + ': no llegó al resultado'); });
    if (new Set(vistos).size < 3) throw new Error(lec.id + ': menos de 3 tipos de pregunta: ' + [...new Set(vistos)]);
  }
  if (fallos.length) throw new Error('errores de consola: ' + fallos.join(' | '));
  await b.close();
  console.log(`RECORRIDO OK: ${lecciones.length} niveles, preguntas por tipo`, JSON.stringify(porTipo));
})().catch((e) => { console.error('FALLO:', e.message); process.exit(1); });
