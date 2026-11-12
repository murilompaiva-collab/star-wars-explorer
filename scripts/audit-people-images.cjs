#!/usr/bin/env node
// node scripts/audit-people-images.cjs
// Requer Node 18+ e acesso à SWAPI e à galeria externa.
const fs = require('node:fs');
const path = require('node:path');
const base = 'https://swapi.dev/api/people/';
const gallery = 'https://starwarsgallery.netlify.app/assets/people/';
const output = path.join(__dirname, '..', 'reports', 'people-images.csv');
const escape = value => '"' + String(value ?? '').replaceAll('"', '""') + '"';
const idOf = url => String(url).match(/\/(\d+)\/?$/)?.[1];
async function request(url, method = 'GET') {
  const response = await fetch(url, { method, signal: AbortSignal.timeout(12000) });
  return response;
}
async function main() {
  let next = base;
  const people = [];
  const seen = new Set();
  while (next) {
    if (seen.has(next)) throw new Error('Paginação circular: ' + next);
    seen.add(next);
    const response = await request(next);
    if (!response.ok) throw new Error('SWAPI ' + response.status + ' em ' + next);
    const page = await response.json();
    people.push(...page.results);
    next = page.next;
  }
  const rows = [];
  for (const person of people) {
    const id = idOf(person.url);
    const url = id ? gallery + id + '.jpg' : '';
    let status = '', contentType = '', bytes = '', error = '';
    try {
      let response = await request(url, 'HEAD');
      if (response.status === 405) response = await request(url);
      status = response.status;
      contentType = response.headers.get('content-type') || '';
      bytes = response.headers.get('content-length') || '';
      if (!response.ok) error = 'Imagem não disponível';
      else if (!contentType.startsWith('image/')) error = 'Resposta não é imagem';
    } catch (e) { error = e.message; }
    rows.push({ id, name: person.name, url, status, contentType, bytes, error,
      visualMatch: 'NÃO VERIFICADO', rights: 'NÃO VERIFICADO', notes: '' });
    process.stdout.write(id + ' ' + person.name + ': ' + (error || status) + '\n');
  }
  fs.mkdirSync(path.dirname(output), { recursive: true });
  const columns = ['id','name','url','status','contentType','bytes','error','visualMatch','rights','notes'];
  fs.writeFileSync(output, [columns.join(','), ...rows.map(row => columns.map(c => escape(row[c])).join(','))].join('\n') + '\n');
  console.log('Relatório:', output, '| registros:', rows.length);
  console.log('ATENÇÃO: disponibilidade HTTP NÃO confirma correspondência visual nem licença de uso.');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
