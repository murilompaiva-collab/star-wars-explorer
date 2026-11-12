import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { JSDOM } from 'jsdom';

const pages = { people: 'personagens', planets: 'planetas', starships: 'naves', vehicles: 'veiculos' };
const labels = { people: 'Personagens', planets: 'Planetas', starships: 'Naves', vehicles: 'Veículos' };
const scripts = ['cache', 'api', 'images', 'categories', 'app'];
const tick = () => new Promise(resolve => setTimeout(resolve, 10));
async function until(check) {
  for (let i = 0; i < 100; i++) { if (check()) return; await tick(); }
  assert.fail('A interface não atingiu o estado esperado.');
}
function setup(category, { offline = false, cached, relationsDelayed = false } = {}) {
  const dom = new JSDOM(readFileSync(`${pages[category]}.html`, 'utf8'), {
    url: 'http://localhost/' + pages[category] + '.html', runScripts: 'outside-only', pretendToBeVisual: true
  });
  const w = dom.window;
  const calls = [];
  let fail = offline;
  let release;
  const waiting = new Promise(resolve => { release = resolve; });
  w.eval(readFileSync('assets/vendor/bootstrap/bootstrap.bundle.min.js', 'utf8'));
  for (const name of scripts.slice(0, -1)) w.eval(readFileSync(`assets/js/${name}.js`, 'utf8'));
  const config = w.SW.categories[category];
  const record = { name: 'Álpha ' + labels[category], url: `https://swapi.dev/api/${category}/1/`, created: null, edited: '2014-12-09T13:50:49.641000Z' };
  for (const key of Object.keys(config.fields)) record[key] = '12';
  for (const key of Object.keys(config.relations)) record[key] = key === 'homeworld' ? 'https://swapi.dev/api/planets/99/' : [];
  record.films = ['https://swapi.dev/api/films/1/', 'https://swapi.dev/api/films/2/'];
  const second = { ...record, name: 'Beta', url: `https://swapi.dev/api/${category}/2/` };
  if (cached) w.localStorage.setItem('swexplorer:v1:' + category, JSON.stringify({ savedAt: Date.now() - (cached === 'stale' ? 90000000 : 0), data: [record, second] }));
  w.fetch = async url => {
    calls.push(url);
    if (fail) throw new Error('offline');
    if (url.includes('/films/2/')) return { ok: false, status: 503 };
    if (url.includes('/films/') || url.includes('/planets/99/')) {
      if (relationsDelayed) await waiting;
      return { ok: true, json: async () => url.includes('/films/') ? { title: 'Uma Nova Esperança' } : { name: 'Tatooine' } };
    }
    const page2 = url.includes('page=2');
    return { ok: true, json: async () => ({ count: 2, next: page2 ? null : `http://swapi.dev/api/${category}/?page=2`, results: [page2 ? second : record] }) };
  };
  w.eval(readFileSync('assets/js/app.js', 'utf8'));
  return { dom, w, doc: w.document, calls, record, release, online() { fail = false; } };
}

for (const category of Object.keys(pages)) {
  test(`${category}: paginação, pesquisa, cards, modal Bootstrap e relações`, async () => {
    const h = setup(category);
    const { w, doc, calls } = h;
    try {
      await until(() => !doc.getElementById('searchInput').disabled);
      assert.equal(doc.querySelectorAll('.character-card').length, 2);
      assert.equal(calls.length, 2);
      assert.ok(calls.every(url => url.startsWith('https://swapi.dev/')));
      assert.equal(w.SW.cache.read(category).data.length, 2);
      assert.match(doc.getElementById('resultCount').textContent, new RegExp(labels[category].toLowerCase()));
      const input = doc.getElementById('searchInput');
      input.value = 'ALPHA'; input.dispatchEvent(new w.Event('input'));
      assert.equal(doc.querySelectorAll('.character-card').length, 1);
      input.value = 'não existe'; input.dispatchEvent(new w.Event('input'));
      assert.equal(doc.getElementById('emptyState').hidden, false);
      doc.getElementById('resetSearch').click();
      assert.equal(doc.querySelectorAll('.character-card').length, 2);
      assert.equal(doc.activeElement, input);
      assert.equal(calls.length, 2, 'A pesquisa não consulta a API');
      const trigger = doc.querySelector('.details-button');
      trigger.click();
      await until(() => !doc.getElementById('modalBody').textContent.includes('Carregando…'));
      await until(() => doc.getElementById('detailsModal').classList.contains('show'));
      for (const label of Object.values(w.SW.categories[category].fields)) assert.ok([...doc.querySelectorAll('#modalBody dt')].some(el => el.textContent === label));
      for (const label of Object.values(w.SW.categories[category].relations)) assert.ok([...doc.querySelectorAll('#modalBody dt')].some(el => el.textContent === label));
      assert.match(doc.getElementById('modalBody').textContent, /Uma Nova Esperança · Relação indisponível/);
      assert.match(doc.getElementById('modalBody').textContent, /Nenhum registro associado/);
      assert.equal([...doc.querySelectorAll('#modalBody dt')].find(el => el.textContent === 'Criado em').nextElementSibling.textContent, 'Não informado');
      if (category === 'people') assert.match(doc.getElementById('modalBody').textContent, /Tatooine/);
      await tick(); await tick();
      doc.querySelector('#detailsModal [data-bs-dismiss]').click();
      await until(() => !doc.getElementById('detailsModal').classList.contains('show'));
      await until(() => doc.activeElement === trigger);
      const before = calls.length;
      await w.SW.api.load(category);
      assert.equal(calls.length, before, 'Cache evita nova paginação');
    } finally { h.dom.window.close(); }
  });
  test(`${category}: cache persistente e vencido, erro sem cache e nova tentativa`, async () => {
    for (const cached of ['fresh', 'stale', undefined]) {
      const h = setup(category, { offline: true, cached });
      try {
        await until(() => h.doc.getElementById('loadState').hidden);
        if (cached) {
          assert.equal(h.doc.querySelectorAll('.character-card').length, 2);
          assert.equal(h.doc.getElementById('notice').hidden, cached !== 'stale');
          assert.equal(h.calls.length, cached === 'fresh' ? 0 : 1);
        } else {
          assert.equal(h.doc.getElementById('errorState').hidden, false);
          h.online(); h.doc.getElementById('retryButton').click();
          await until(() => !h.doc.getElementById('searchInput').disabled);
          assert.equal(h.doc.getElementById('errorState').hidden, true);
          assert.equal(h.doc.querySelectorAll('.character-card').length, 2);
        }
      } finally { h.dom.window.close(); }
    }
  });
  test(`${category}: fechar modal durante requisição não atualiza conteúdo antigo`, async () => {
    const h = setup(category, { relationsDelayed: true });
    try {
      await until(() => !h.doc.getElementById('searchInput').disabled);
      h.doc.querySelector('.details-button').click();
      await until(() => h.doc.getElementById('detailsModal').classList.contains('show'));
      await tick(); await tick();
      h.w.bootstrap.Modal.getInstance(h.doc.getElementById('detailsModal')).hide();
      const before = h.doc.getElementById('modalBody').textContent;
      h.release(); await tick(); await tick();
      assert.equal(h.doc.getElementById('modalBody').textContent, before);
    } finally { h.dom.window.close(); }
  });
}

test('Navegação, recursos e referências acessíveis das cinco páginas', () => {
  const expected = { 'index.html': 'Início', ...Object.fromEntries(Object.entries(pages).map(([key, page]) => [page + '.html', labels[key]])) };
  for (const page of Object.keys(expected)) {
    const dom = new JSDOM(readFileSync(page, 'utf8'));
    const doc = dom.window.document;
    try {
      assert.equal(doc.documentElement.lang, 'pt-BR');
      assert.ok(doc.querySelector('meta[name="viewport"]'));
      assert.equal(doc.querySelectorAll('h1').length, 1);
      assert.equal(doc.querySelectorAll('[aria-current="page"]').length, 1);
      assert.equal(doc.querySelector('[aria-current="page"]').getAttribute('href'), page);
      for (const [href, label] of Object.entries(expected)) assert.equal(doc.querySelector(`nav a[href="${href}"]:not(.brand)`).textContent, label);
      const ids = [...doc.querySelectorAll('[id]')].map(el => el.id);
      assert.equal(new Set(ids).size, ids.length);
      for (const el of doc.querySelectorAll('[aria-controls],[aria-labelledby],[for]')) {
        for (const attr of ['aria-controls', 'aria-labelledby', 'for']) {
          for (const id of (el.getAttribute(attr) || '').split(' ').filter(Boolean)) assert.ok(doc.getElementById(id));
        }
      }
      for (const el of doc.querySelectorAll('[src],link[href],a[href]')) {
        const url = el.getAttribute('src') || el.getAttribute('href');
        if (url.startsWith('https:')) continue;
        if (url.startsWith('#')) assert.ok(doc.getElementById(url.slice(1)));
        else assert.ok(existsSync(url), `${page}: ${url}`);
      }
    } finally { dom.window.close(); }
  }
});

test('Unidades, valores ausentes e cache independente dos relacionamentos', async () => {
  const h = setup('planets');
  try {
    await until(() => !h.doc.getElementById('searchInput').disabled);
    const { SW } = h.w;
    for (const [key, unit] of Object.entries({ rotation_period: 'h', orbital_period: 'dias', diameter: 'km', length: 'm', cargo_capacity: 'kg', cost_in_credits: 'créditos', surface_water: '%' })) assert.equal(SW.format('12', key), `12 ${unit}`);
    assert.equal(SW.format('unknown', 'length'), 'Não informado');
    assert.equal(SW.format('n/a', 'length'), 'Não se aplica');
    assert.equal(SW.format('unlimited', 'max_atmosphering_speed'), 'unlimited');
    assert.throws(() => SW.api.safeUrl('ftp://swapi.dev/api/people/1/'));
    const key = 'https://swapi.dev/api/films/1/';
    await Promise.all([SW.api.relation(key), SW.api.relation(key)]);
    assert.equal(h.calls.filter(url => url === key).length, 1, 'Consultas concorrentes são compartilhadas');
    SW.api.related.clear();
    await SW.api.relation(key);
    assert.equal(h.calls.filter(url => url === key).length, 1, 'Cache persistente da relação');
    const oldKey = 'relation:https://swapi.dev/api/planets/99/';
    h.w.localStorage.setItem('swexplorer:v1:' + oldKey, JSON.stringify({ savedAt: Date.now() - 90000000, data: [{ name: 'Antigo', url: 'https://swapi.dev/api/planets/99/' }] }));
    await SW.api.relation('https://swapi.dev/api/films/3/');
    assert.equal(SW.cache.read(oldKey).fresh, false, 'Salvar outra relação não renova dados antigos');
    SW.api.request = async () => ({ count: 3, next: null, results: [{ name: 'Parcial', url: 'https://swapi.dev/api/planets/1/' }] });
    await assert.rejects(SW.api.all('planets'), /incompleta/);
  } finally { h.dom.window.close(); }
});

// O DOM simulado verifica semântica; contraste e geometria exigem navegador real.
const axeSource = readFileSync('node_modules/axe-core/axe.min.js', 'utf8');
for (const category of Object.keys(pages)) {
  test(`${category}: acessibilidade automatizada da listagem e modal`, async () => {
    const h = setup(category);
    try {
      await until(() => !h.doc.getElementById('searchInput').disabled);
      h.w.eval(axeSource);
      const options = { rules: { 'color-contrast': { enabled: false } } };
      let results = await h.w.axe.run(h.doc, options);
      assert.equal(results.violations.length, 0, JSON.stringify(results.violations.map(item => item.id)));
      h.doc.querySelector('.details-button').click();
      await until(() => !h.doc.getElementById('modalBody').textContent.includes('Carregando…'));
      await tick(); await tick();
      results = await h.w.axe.run(h.doc, options);
      assert.equal(results.violations.length, 0, JSON.stringify(results.violations.map(item => item.id)));
    } finally { h.dom.window.close(); }
  });
}

const schema = {
  people: ['birth_year','height','mass','gender','hair_color','skin_color','eye_color'],
  planets: ['rotation_period','orbital_period','diameter','climate','gravity','terrain','surface_water','population'],
  starships: ['model','manufacturer','cost_in_credits','length','max_atmosphering_speed','crew','passengers','cargo_capacity','consumables','hyperdrive_rating','MGLT','starship_class'],
  vehicles: ['model','manufacturer','cost_in_credits','length','max_atmosphering_speed','crew','passengers','cargo_capacity','consumables','vehicle_class']
};
const relationships = {
  people: ['homeworld','films','species','starships','vehicles'], planets: ['residents','films'],
  starships: ['pilots','films'], vehicles: ['pilots','films']
};
for (const category of Object.keys(pages)) {
  test(`${category}: esquema completo, fallback e rejeição de paginação incompleta`, async () => {
    const h = setup(category);
    try {
      await until(() => !h.doc.getElementById('searchInput').disabled);
      const { SW } = h.w;
      assert.deepEqual(Object.keys(SW.categories[category].fields), schema[category]);
      assert.deepEqual(Object.keys(SW.categories[category].relations), relationships[category]);
      const img = h.doc.querySelector('.portrait img');
      img.src = 'missing.webp'; img.dispatchEvent(new h.w.Event('error'));
      assert.ok(img.src.endsWith(SW.images.fallbacks[category]));
      h.w.localStorage.clear();
      SW.api.request = async () => ({ count: 3, next: null, results: [h.record] });
      await assert.rejects(SW.api.load(category), /incompleta/);
      assert.equal(SW.cache.read(category), null);
      SW.api.request = async () => ({ results: [h.record], next: 42 });
      await assert.rejects(SW.api.load(category), /página inválida/);
      assert.equal(SW.cache.read(category), null);
    } finally { h.dom.window.close(); }
  });
}

test('paginação completa de 82 pessoas preserva IDs e rejeita duplicatas', async () => {
  const fixture = JSON.parse(readFileSync('tests/fixtures/people-enumeration.json')).people;
  const h = setup('people');
  try {
    await until(() => !h.doc.getElementById('searchInput').disabled);
    h.w.localStorage.clear();
    let calls = 0;
    h.w.SW.api.request = async url => {
      calls++;
      const page = Number(new URL(url).searchParams.get('page') || 1);
      return { count: 82, results: fixture.slice((page - 1) * 10, page * 10), next: page < 9 ? `https://swapi.dev/api/people/?page=${page + 1}` : null };
    };
    const result = await h.w.SW.api.load('people');
    assert.equal(result.data.length, 82);
    assert.equal(calls, 9);
    assert.equal(h.w.SW.images.id(result.data.at(-1).url), '83');
    await h.w.SW.api.load('people');
    assert.equal(calls, 9);
    h.w.SW.api.request = async () => ({ count: 2, results: [fixture[0], fixture[0]], next: null });
    await assert.rejects(h.w.SW.api.all('people'), /repetido/);
    h.w.SW.api.request = async () => ({ results: [fixture[0]], next: null });
    await assert.rejects(h.w.SW.api.all('planets'), /categoria inesperada/);
    assert.match(h.doc.querySelector('.record-tag').textContent, /FOTO NÃO VALIDADA/);
  } finally { h.dom.window.close(); }
});

test('cache adulterado com URL externa ou registros duplicados é ignorado', async () => {
  const h = setup('people');
  try {
    await until(() => !h.doc.getElementById('searchInput').disabled);
    for (const data of [[{ name: 'Falso', url: 'https://example.com/api/people/1/' }], [h.record, h.record]]) {
      h.w.localStorage.setItem('swexplorer:v1:people', JSON.stringify({ savedAt: Date.now(), data }));
      const before = h.calls.length;
      const result = await h.w.SW.api.load('people');
      assert.equal(result.source, 'api');
      assert.equal(h.calls.length - before, 2);
    }
  } finally { h.dom.window.close(); }
});
