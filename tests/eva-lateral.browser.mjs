import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';

const js = await fs.readFile('eva-columna-lateral.js', 'utf8');
const css = await fs.readFile('eva-layout.css', 'utf8');
const catalog = await fs.readFile('recursos-educativos.json', 'utf8');
const browser = await chromium.launch({ headless: true });
const report = [];
const items = (count, label) => Array.from({ length: count }, (_, index) => ({
  id: count - index,
  titulo: label + ' ' + (index + 1),
  enlace_url: 'https://crebeucayali.github.io/noti-inclusivos/',
  created_at: '2026-11-10T12:00:00Z'
}));
const rows = {
  repositorio_recursos: items(12, 'Material'),
  noticias_destacadas: items(7, 'Noticia'),
  calendario_publico: Array.from({ length: 8 }, (_, i) => ({
    registro_id: i + 1,
    fecha: '2026-12-' + String(i + 1).padStart(2, '0'),
    contenido_lineas: ['Sesión ' + (i + 1)], orden: i + 1
  }))
};
const html = `<!doctype html><html lang="es"><head><meta name="viewport" content="width=device-width, initial-scale=1"></head><body>
<div id="eva-distribucion" class="eva-layout-activo">
  <div class="eva-columna-principal">Contenido principal</div>
  <aside id="eva-columna-lateral" class="eva-columna-lateral">
    <div class="eva-lateral-cabecera"><h2>Actualidad EVA</h2></div>
    <section class="eva-lateral-bloque"><h3>Recursos educativos</h3><ul id="eva-lateral-digitales" class="eva-lateral-lista"></ul></section>
    <section class="eva-lateral-bloque"><h3>Novedades institucionales</h3><ul id="eva-lateral-noticias" class="eva-lateral-lista"></ul></section>
    <section class="eva-lateral-bloque"><h3>Últimos materiales</h3><ul id="eva-lateral-recursos" class="eva-lateral-lista"></ul></section>
    <nav class="eva-lateral-bloque"><h3>Accesos rápidos</h3><ul class="eva-lateral-accesos"><li>Banco Digital Accesible</li></ul></nav>
    <section class="eva-lateral-bloque"><h3>Próximamente</h3><ul id="eva-lateral-agenda" class="eva-lateral-lista"></ul></section>
  </aside>
</div>
</body></html>`;
try {
  for (const width of [1440, 390]) {
    const page = await browser.newPage({ viewport: { width, height: 900 }, deviceScaleFactor: 1 });
    await page.route('**/*', async route => {
      const url = new URL(route.request().url());
      if (url.pathname.endsWith('/recursos-educativos.json')) {
        return route.fulfill({ status: 200, contentType: 'application/json',
          headers: { 'access-control-allow-origin': '*' }, body: catalog });
      }
      if (url.hostname === 'dteimbhwtzghhsijeeld.supabase.co') {
        if (route.request().method() === 'OPTIONS') {
          return route.fulfill({ status: 204, headers: {
            'access-control-allow-origin': '*',
            'access-control-allow-headers': 'apikey,accept,prefer',
            'access-control-allow-methods': 'GET, OPTIONS'
          } });
        }
        const table = url.pathname.split('/').at(-1);
        const records = rows[table] || [];
        const offset = Math.max(0, Number(url.searchParams.get('offset') || 0));
        const limit = Math.max(0, Number(url.searchParams.get('limit') || 3));
        const chunk = records.slice(offset, offset + limit);
        return route.fulfill({ status: 200, contentType: 'application/json',
          headers: { 'access-control-allow-origin': '*',
            'access-control-expose-headers': 'content-range',
            'content-range': chunk.length ? offset + '-' + (offset + chunk.length - 1) + '/' + records.length : '*/' + records.length
          }, body: JSON.stringify(chunk) });
      }
      return route.abort();
    });
    await page.setContent(html);
    await page.addStyleTag({ content: css });
    await page.addScriptTag({ content: js });
    await page.waitForFunction(() => document.querySelectorAll('#eva-lateral-recursos li').length === 3);
    await page.waitForFunction(() => document.querySelectorAll('#eva-lateral-noticias li').length === 3);
    assert.equal(await page.locator('#eva-lateral-digitales li').count(), 2);
    assert.equal(await page.locator('#eva-lateral-recursos li').count(), 3);
    const toggle = page.locator('#eva-lateral-recursos + .eva-lateral-controles .eva-lateral-toggle');
    await toggle.click();
    await page.waitForFunction(() => document.querySelectorAll('#eva-lateral-recursos li').length === 5);
    assert.equal(await toggle.getAttribute('aria-expanded'), 'true');
    const pagination = page.locator('#eva-lateral-recursos + .eva-lateral-controles');
    const pageTwoButton = pagination.getByRole('button', { name: 'Ir a la página 2', exact: true });
    const nextPageButton = pagination.getByRole('button', { name: 'Página siguiente', exact: true });
    assert.equal(await pageTwoButton.count(), 1, 'La página 2 debe tener un botón inequívoco');
    assert.equal(await nextPageButton.count(), 1, 'La flecha siguiente debe tener nombre accesible propio');
    await pageTwoButton.click();
    await page.waitForFunction(() => document.querySelector('#eva-lateral-recursos li a')?.textContent === 'Material 6');
    assert.equal(await page.locator('#eva-lateral-recursos li').count(), 5);
    assert.equal(await page.locator('#eva-lateral-noticias li').count(), 3);
    await toggle.click();
    await page.waitForFunction(() => document.querySelectorAll('#eva-lateral-recursos li').length === 3);
    const newsToggle = page.locator('#eva-lateral-noticias + .eva-lateral-controles .eva-lateral-toggle');
    await newsToggle.click();
    await page.waitForFunction(() => document.querySelectorAll('#eva-lateral-noticias li').length === 5);
    assert.equal(await page.locator('#eva-lateral-recursos li').count(), 3);
    assert.equal(await page.locator('#eva-lateral-agenda li').count(), 3);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 2);
    assert.equal(overflow, false, 'Desbordamiento horizontal en ' + width + 'px');
    await fs.mkdir('artifacts', { recursive: true });
    await page.screenshot({ path: 'artifacts/actualidad-eva-' + width + '.png', fullPage: true });
    report.push({ viewport: width, resultado: 'OK', recursos: 12, noticias: 7 });
    await page.close();
  }
  console.log(JSON.stringify(report, null, 2));
} finally {
  await browser.close();
}
