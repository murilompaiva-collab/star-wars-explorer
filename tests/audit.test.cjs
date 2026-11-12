const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { enumerate, imageFormat, audit } = require('../scripts/audit-people-images.cjs');
const fixture = require('./fixtures/people-enumeration.json').people;
const response = data => ({ ok: true, json: async () => data });

test('auditoria enumera os 82 IDs reais dos logs, sem inventar ID 17', async () => {
  let calls = 0;
  const people = await enumerate(async url => {
    assert.match(url, /^https:\/\/swapi.dev/);
    calls++;
    const page = Number(new URL(url).searchParams.get('page') || 1);
    return response({ count: 82, results: fixture.slice((page - 1) * 10, page * 10), next: page < 9 ? `http://swapi.dev/api/people/?page=${page + 1}` : null });
  });
  assert.equal(calls, 9);
  assert.equal(people.length, 82);
  assert.equal(people.some(person => person.url.endsWith('/17/')), false);
  assert.ok(people.at(-1).url.endsWith('/83/'));
});
test('auditoria rejeita circularidade, contagem parcial e IDs repetidos', async () => {
  await assert.rejects(enumerate(async () => response({ results: [], next: 'http://swapi.dev/api/people/' })), /circular/);
  await assert.rejects(enumerate(async () => response({ count: 82, results: fixture.slice(0, 1), next: null })), /incompleta/);
  await assert.rejects(enumerate(async () => response({ results: [fixture[0], fixture[0]], next: null })), /duplicado/);
});
test('auditoria usa GET, reconhece assinatura e registra falha sem aprovar identidade', async () => {
  const out = fs.mkdtempSync(path.join(os.tmpdir(), 'sw-audit-'));
  const bytes = Buffer.from([255,216,255,224,0,0]);
  try {
    fs.mkdirSync(path.join(out, 'image-files'));
    fs.writeFileSync(path.join(out, 'image-files', '2.img'), 'stale image');
    const rows = await audit({ out, fetcher: async url => {
      if (url.startsWith('https://swapi.dev')) return response({ count: 2, results: fixture.slice(0, 2), next: null });
      return { ok: true, status: 200, headers: new Headers({ 'content-type': 'image/jpeg' }), arrayBuffer: async () => url.endsWith('/1.jpg') ? bytes : Buffer.from('<html>not an image</html>') };
    } });
    assert.equal(rows[0].format, 'jpeg');
    assert.equal(rows[0].visualMatch, 'NÃO VERIFICADO');
    assert.equal(rows[0].rights, 'NÃO VERIFICADO');
    assert.match(rows[1].error, /Formato/);
    assert.equal(fs.existsSync(path.join(out, 'image-files', '2.img')), false);
    assert.equal(JSON.parse(fs.readFileSync(path.join(out, 'people-snapshot.json'))).people.length, 2);
    assert.ok(fs.readFileSync(path.join(out, 'people-images.csv'), 'utf8').includes('birth_year'));
    assert.equal(imageFormat(Buffer.from('<html>')), '');
  } finally { fs.rmSync(out, { recursive: true, force: true }); }
});
