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
  let lecciones = await page.evaluate(() => CURSOS.flatMap((c) => niveles(c).concat(niveles(c).map((l) => ORO[l.id]).filter(Boolean)).map((l) => ({ curso: c.id, id: l.id, n: l.ejercicios.length, nueva: l.ejercicios.some((e) => ['clasificar', 'deslizador', 'rellenar'].includes(e.tipo)) }))));
  if (process.env.SOLO_NUEVAS) lecciones = lecciones.filter((l) => l.nueva); // node tests/recorrido.js con SOLO_NUEVAS=1
  const porTipo = {};
  for (const lec of lecciones) {
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
          const txt = (await page.locator('.clas-ficha').innerText()).trim();
          const cajon = ej.elementos.find((x) => x[0] === txt)[1];
          await page.locator('.clas-cajon').nth(cajon).click();
        }
        await page.waitForSelector('.feedback');
      } else if (ej.tipo === 'deslizador') {
        await page.locator('.desliz-control').evaluate((c, v) => { c.value = v; c.dispatchEvent(new Event('input', { bubbles: true })); }, String(ej.respuesta));
        await page.getByRole('button', { name: 'Comprobar' }).click();
      } else if (ej.tipo === 'rellenar') {
        for (const h of ej.huecos) await page.locator('.rell-palabra:not(:disabled)', { hasText: new RegExp('^\\s*' + esc(h) + '\\s*$') }).click();
        await page.getByRole('button', { name: 'Comprobar' }).click();
      } else {
        const t = await page.locator('.opcion').evaluateAll((els) => els.map((e) => e.innerText.replace(/^\s*\d+\s*/, '').trim()));
        await page.locator('.opcion').nth(t.indexOf(ej.opciones[ej.correcta])).click();
      }
      if (!(await page.locator('.feedback.bien').count())) throw new Error(`${lec.id}: la respuesta correcta no se aceptó en «${q}»`);
      await page.locator('.feedback .boton').click();
    }
    await page.waitForSelector('.resultado-titulo', { timeout: 5000 }).catch(() => { throw new Error(lec.id + ': no llegó al resultado'); });
    if (new Set(vistos).size < 3) throw new Error(lec.id + ': menos de 3 tipos de pregunta: ' + [...new Set(vistos)]);
  }
  if (fallos.length) throw new Error('errores de consola: ' + fallos.join(' | '));
  await b.close();
  console.log(`RECORRIDO OK: ${lecciones.length} niveles, preguntas por tipo`, JSON.stringify(porTipo));
})().catch((e) => { console.error('FALLO:', e.message); process.exit(1); });
