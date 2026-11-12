// Uma configuração de categoria alimenta a mesma interface de listagem e detalhes.
(() => {
  const category = document.body.dataset.category;
  const config = SW.categories[category];
  if (!config) return;
  const byId = id => document.getElementById(id);
  const search = byId('searchInput');
  const cards = byId('cards');
  const modalElement = byId('detailsModal');
  const modal = new bootstrap.Modal(modalElement);
  let records = [];
  let detailVersion = 0;

  function node(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  }
  function fact(key, value) {
    const wrapper = node('div');
    wrapper.append(node('dt', '', config.fields[key]), node('dd', '', SW.format(value, key)));
    return wrapper;
  }
  const normalize = text => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

  function render() {
    const query = normalize(search.value);
    const filtered = records.filter(record => normalize(record.name).includes(query));
    const fragment = document.createDocumentFragment();
    for (const record of filtered) {
      const card = node('article', 'character-card');
      const portrait = node('div', 'portrait');
      const img = node('img');
      img.src = SW.images.get(category, record.url);
      img.alt = ''; // O nome já está no título; o fallback é decorativo.
      img.loading = 'lazy';
      img.width = 500;
      img.height = 400;
      img.addEventListener('error', () => { img.src = SW.images.fallbacks[category] || SW.images.fallback; }, { once: true });
      portrait.append(img, node('span', 'record-id', 'SW / ' + SW.images.id(record.url).padStart(3, '0')), node('span', 'record-tag', 'REGISTRO GALÁCTICO'));
      const content = node('div', 'character-content');
      const facts = node('dl', 'card-facts');
      for (const key of config.summary) facts.append(fact(key, record[key]));
      const button = node('button', 'details-button', 'VER DOSSIÊ');
      button.type = 'button';
      button.setAttribute('aria-label', 'Ver detalhes de ' + record.name);
      button.addEventListener('click', () => openDetails(record, button));
      card.addEventListener('click', event => {
        if (!event.target.closest('button')) button.click();
      });
      content.append(node('h2', '', record.name), facts, button);
      card.append(portrait, content);
      fragment.append(card);
    }
    cards.replaceChildren(fragment);
    byId('emptyState').hidden = filtered.length !== 0;
    byId('clearSearch').hidden = search.value.length === 0;
    byId('resultCount').textContent = `${filtered.length} de ${records.length} ${config.label.toLowerCase()}`;
  }

  async function openDetails(record, trigger) {
    const version = ++detailVersion;
    byId('modalTitle').textContent = record.name;
    const body = byId('modalBody');
    const facts = node('dl', 'detail-grid');
    for (const key of Object.keys(config.fields)) facts.append(fact(key, record[key]));
    const relationsSection = node('section', 'detail-section');
    relationsSection.append(node('h3', '', 'Conexões na galáxia'));
    const relationList = node('dl', 'detail-grid');
    const pending = [];
    for (const [key, label] of Object.entries(config.relations)) {
      const group = node('div');
      const value = node('dd', '', 'Carregando…');
      value.setAttribute('aria-live', 'polite');
      group.append(node('dt', '', label), value);
      relationList.append(group);
      const urls = Array.isArray(record[key]) ? record[key] : record[key] ? [record[key]] : [];
      if (!urls.length) value.textContent = 'Nenhum registro associado';
      else pending.push({ urls, value });
    }
    relationsSection.append(relationList);
    const technical = node('details', 'detail-section');
    technical.append(node('summary', '', 'Informações do registro'));
    const technicalFacts = node('dl', 'detail-grid mt-3');
    for (const [key, label] of [['created', 'Criado em'], ['edited', 'Atualizado em']]) {
      const date = new Date(record[key] || NaN);
      const wrapper = node('div');
      wrapper.append(node('dt', '', label), node('dd', '', Number.isNaN(date.getTime()) ? 'Não informado' : date.toLocaleString('pt-BR')));
      technicalFacts.append(wrapper);
    }
    const source = node('a', 'small', 'Consultar registro na SWAPI ↗');
    source.href = SW.api.safeUrl(record.url);
    source.target = '_blank';
    source.rel = 'noopener noreferrer';
    technical.append(technicalFacts, source);
    body.replaceChildren(facts, relationsSection, technical);
    modal.show(trigger);
    // Resolve grupos em sequência para limitar requisições simultâneas.
    for (const { urls, value } of pending) {
      if (version !== detailVersion) return;
      const results = await Promise.allSettled(urls.map(url => SW.api.relation(url)));
      if (version !== detailVersion) return;
      value.textContent = results.map(result => result.status === 'fulfilled' ? result.value : 'Relação indisponível').join(' · ');
    }
  }

  modalElement.addEventListener('hide.bs.modal', () => { detailVersion++; });
  // O modal aberto via JavaScript devolve o foco ao botão que o abriu.
  let returnFocus;
  modalElement.addEventListener('show.bs.modal', event => { returnFocus = event.relatedTarget; });
  modalElement.addEventListener('hidden.bs.modal', () => returnFocus?.focus());

  async function load() {
    search.disabled = true;
    byId('clearSearch').disabled = true;
    byId('loadState').hidden = false;
    byId('errorState').hidden = true;
    byId('emptyState').hidden = true;
    byId('notice').hidden = true;
    byId('resultCount').textContent = 'Carregando arquivo…';
    byId('loadMessage').textContent = 'Conectando ao arquivo galáctico…';
    cards.replaceChildren();
    try {
      const result = await SW.api.load(category, (loaded, total) => {
        byId('loadMessage').textContent = `Carregando ${config.label.toLowerCase()}: ${loaded}${Number.isFinite(total) ? ' de ' + total : ''}…`;
      });
      records = result.data;
      const messages = {
        stale: 'A SWAPI está indisponível. Exibindo o último arquivo salvo; os dados podem estar desatualizados.',
        memory: 'Arquivo carregado. O navegador não permitiu salvar o cache; os dados ficarão disponíveis nesta página.'
      };
      if (messages[result.source]) {
        byId('notice').textContent = messages[result.source];
        byId('notice').hidden = false;
      }
      search.disabled = false;
      byId('clearSearch').disabled = false;
      render();
    } catch {
      byId('errorState').hidden = false;
      byId('resultCount').textContent = 'Arquivo indisponível';
    } finally {
      byId('loadState').hidden = true;
    }
  }
  function clearSearch() {
    search.value = '';
    render();
    search.focus();
  }
  search.addEventListener('input', render);
  byId('clearSearch').addEventListener('click', clearSearch);
  byId('resetSearch').addEventListener('click', clearSearch);
  byId('retryButton').addEventListener('click', load);
  load();
})();
