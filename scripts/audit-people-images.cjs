#!/usr/bin/env node
// Auditoria de candidatos, sem aprovar identidade visual ou direitos de uso.
const fs = require('node:fs');
const path = require('node:path');
const base = 'https://swapi.dev/api/people/';
const gallery = 'https://starwarsgallery.netlify.app/assets/people/';
const escape = value => '"' + String(value ?? '').replaceAll('"', '""') + '"';
const idOf = value => {
  const url = new URL(value);
  if (url.hostname !== 'swapi.dev' || url.username || url.password || url.port || !['http:', 'https:'].includes(url.protocol)) throw new Error('URL SWAPI inválida');
  const id = url.pathname.match(/^\/api\/people\/(\d+)\/?$/)?.[1];
  if (!id) throw new Error('ID de personagem inválido');
  return id;
};
const request = url => fetch(url, { signal: AbortSignal.timeout(20000) });
async function enumerate(fetcher = request) {
  let next = base;
  let count;
  const people = [], pages = new Set(), ids = new Set();
  while (next) {
    const url = new URL(next);
    if (url.hostname !== 'swapi.dev' || url.username || url.password || url.port || url.pathname !== '/api/people/' || !['http:', 'https:'].includes(url.protocol)) throw new Error('Paginação fora da SWAPI');
    url.protocol = 'https:';
    next = url.href;
    if (pages.has(next)) throw new Error('Paginação circular');
    pages.add(next);
    const response = await fetcher(next);
    if (!response.ok) throw new Error('SWAPI ' + response.status);
    const page = await response.json();
    if (!Array.isArray(page.results)) throw new Error('Resultados inválidos');
    if (Number.isInteger(page.count)) count = page.count;
    for (const person of page.results) {
      if (!person || typeof person.name !== 'string') throw new Error('Personagem inválido');
      const id = idOf(person.url);
      if (ids.has(id)) throw new Error('ID duplicado: ' + id);
      ids.add(id); people.push(person);
    }
    if (page.next != null && (typeof page.next !== 'string' || !page.next)) throw new Error('Próxima página inválida');
    next = page.next;
  }
  if (count !== undefined && people.length !== count) throw new Error('Listagem incompleta');
  return people;
}
function imageFormat(bytes) {
  if (bytes.length >= 3 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) return 'jpeg';
  if (bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) return 'png';
  if (/^GIF8[79]a/.test(bytes.subarray(0,6).toString())) return 'gif';
  if (bytes.subarray(0,4).toString() === 'RIFF' && bytes.subarray(8,12).toString() === 'WEBP') return 'webp';
  return '';
}
async function audit({ fetcher = request, out = path.join(__dirname, '..', 'reports') } = {}) {
  const people = await enumerate(fetcher);
  fs.mkdirSync(path.join(out, 'image-files'), { recursive: true });
  fs.writeFileSync(path.join(out, 'people-snapshot.json'), JSON.stringify({ capturedAt: new Date().toISOString(), source: base, people }, null, 2));
  const rows = [];
  for (const person of people) {
    const id = idOf(person.url), url = gallery + id + '.jpg';
    const row = { id, name: person.name, birth_year: person.birth_year, height: person.height, url, status: '', contentType: '', bytes: '', format: '', error: '', visualMatch: 'NÃO VERIFICADO', rights: 'NÃO VERIFICADO', notes: '' };
    // Nunca reutilizar bytes de uma execução anterior se o download atual falhar.
    const target = path.join(out, 'image-files', id + '.img');
    fs.rmSync(target, { force: true });
    try {
      const response = await fetcher(url);
      row.status = response.status;
      row.contentType = response.headers.get('content-type') || '';
      if (!response.ok) throw new Error('Imagem não disponível');
      const bytes = Buffer.from(await response.arrayBuffer());
      row.bytes = bytes.length; row.format = imageFormat(bytes);
      if (!row.contentType.startsWith('image/') || !row.format) throw new Error('Formato de imagem inválido');
      fs.writeFileSync(target, bytes);
    } catch (error) { row.error = error.message; }
    rows.push(row);
    console.log(id + ' ' + person.name + ': ' + (row.error || row.status));
  }
  const columns = Object.keys(rows[0] || { id: '', name: '' });
  fs.writeFileSync(path.join(out, 'people-images.csv'), [columns.join(','), ...rows.map(row => columns.map(key => escape(row[key])).join(','))].join('\n') + '\n');
  console.log('Registros:', people.length, '| falhas:', rows.filter(row => row.error).length);
  console.log('HTTP, hashes e dimensões não aprovam identidade nem direitos.');
  return rows;
}
module.exports = { enumerate, imageFormat, audit };
if (require.main === module) audit().then(rows => { if (rows.some(row => row.error)) process.exitCode = 1; }).catch(error => { console.error(error.message); process.exitCode = 1; });
