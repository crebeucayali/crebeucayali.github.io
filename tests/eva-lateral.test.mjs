import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const html = fs.readFileSync('index.html', 'utf8');
const js = fs.readFileSync('eva-columna-lateral.js', 'utf8');
const css = fs.readFileSync('eva-layout.css', 'utf8');
const catalog = JSON.parse(fs.readFileSync('recursos-educativos.json', 'utf8'));

test('JavaScript sintácticamente válido', () => {
  assert.doesNotThrow(() => new vm.Script(js));
});

test('Cinco bloques presentes y ordenados', () => {
  const ids = ['eva-lateral-digitales', 'eva-lateral-noticias',
    'eva-lateral-recursos', 'eva-lateral-accesos', 'eva-lateral-agenda'];
  let previous = -1;
  for (const id of ids) {
    const current = html.indexOf('id="' + id + '"');
    assert.ok(current > previous, 'Orden inválido o ausente: ' + id);
    previous = current;
  }
  assert.match(html, /eva-columna-lateral\.js\?v=2/);
  assert.match(html, /eva-layout\.css\?v=9/);
});

test('Paginación independiente y vista inicial compacta', () => {
  assert.match(js, /const PAGE_SIZE = 5/);
  assert.match(js, /const INITIAL_SIZE = 3/);
  assert.match(js, /const state = new Map\(\)/);
  assert.match(js, /item\.page = page/);
  assert.match(js, /offset: String\(offset\)/);
  assert.match(js, /limit: String\(amount\)/);
});

test('Se conservan filtros de publicación de Supabase', () => {
  for (const table of ['repositorio_recursos', 'noticias_destacadas', 'calendario_publico'])
    assert.ok(js.includes(table), 'Tabla ausente: ' + table);
  assert.match(js, /visible: "eq\.true", estado_publicacion: "eq\.publicado"/);
  assert.match(js, /fecha: "gte\." \+ dateTodayInPeru\(\)/);
});

test('Se mantiene accesibilidad básica de controles', () => {
  for (const attr of ['aria-live', 'aria-expanded', 'aria-controls', 'aria-current', 'aria-busy'])
    assert.ok(js.includes(attr), 'Atributo faltante: ' + attr);
  assert.match(css, /eva-lateral-paginas button:disabled/);
  assert.match(css, /:focus-visible/);
});

test('Catálogo JSON válido con destinos institucionales', () => {
  assert.equal(catalog.schema_version, 1);
  assert.ok(Array.isArray(catalog.recursos));
  assert.ok(catalog.recursos.some(x => x.titulo.includes('van Dijk')));
  assert.ok(catalog.recursos.some(x => x.titulo.includes('mano bajo mano')));
  for (const item of catalog.recursos) {
    assert.equal(item.visible, true);
    assert.ok(item.titulo.trim());
    assert.equal(new URL(item.url).hostname, 'crebeucayali.github.io');
  }
});
