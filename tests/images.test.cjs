// Execute com: node --test tests/images.test.cjs
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function loadImages() {
  const context = { window: {}, URL };
  context.window.SW = {};
  context.SW = context.window.SW;
  vm.runInNewContext(fs.readFileSync('assets/js/images.js', 'utf8'), context);
  return context.SW.images;
}
test('identifica o ID real da URL da SWAPI, inclusive IDs não sequenciais', () => {
  const images = loadImages();
  assert.equal(images.id('https://swapi.dev/api/people/1/'), '1');
  assert.equal(images.id('https://swapi.dev/api/people/83/'), '83');
  assert.equal(images.id('https://swapi.dev/api/people/35'), '35');
});
test('retrato sem validação explícita usa fallback, inclusive IDs não sequenciais', () => {
  const images = loadImages();
  assert.equal(images.get('people', 'https://swapi.dev/api/people/1/'), 'assets/images/fallback.svg');
  assert.equal(images.get('people', 'https://swapi.dev/api/people/83/'), 'assets/images/fallback.svg');
});
test('permite substituição individual por imagem local validada', () => {
  const images = loadImages();
  images.records.people['4'] = 'assets/images/people/4.webp';
  assert.equal(images.get('people', 'https://swapi.dev/api/people/4/'), 'assets/images/people/4.webp');
});
test('mantém os fallbacks das demais categorias', () => {
  const images = loadImages();
  assert.equal(images.get('planets', 'https://swapi.dev/api/planets/1/'), 'assets/images/planets.svg');
  assert.equal(images.get('starships', 'https://swapi.dev/api/starships/2/'), 'assets/images/starships.svg');
  assert.equal(images.get('vehicles', 'https://swapi.dev/api/vehicles/4/'), 'assets/images/vehicles.svg');
});
test('URL inválida não constrói um retrato externo', () => {
  const images = loadImages();
  assert.equal(images.get('people', 'not-a-swapi-url'), 'assets/images/fallback.svg');
});

test('host externo e caminho de outra API não são IDs válidos', () => {
  const images = loadImages();
  for (const url of ['https://example.com/api/people/1/', 'https://swapi.dev/other/1/', 'ftp://swapi.dev/api/people/1/', 'https://user:password@swapi.dev/api/people/1/']) {
    assert.equal(images.id(url), '—');
    assert.equal(images.get('people', url), images.fallback);
  }
});

test('não usa imagem de outro tipo de recurso com o mesmo ID', () => {
  const images = loadImages();
  images.records.people['1'] = 'assets/images/people/1.webp';
  assert.equal(images.get('people', 'https://swapi.dev/api/planets/1/'), images.fallback);
});
