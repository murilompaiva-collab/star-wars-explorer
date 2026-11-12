window.SW = window.SW || {};
SW.images = {
  fallback: 'assets/images/fallback.svg',
  // Adicione aqui somente arquivos locais com licença verificada. Ex.: people: { '1': 'assets/images/personagens/1.webp' }
  records: { people: {}, planets: {}, starships: {}, vehicles: {} },
  id(url) {
    return String(url).match(/\/(\d+)\/?$/)?.[1] || '—';
  },
  get(category, url) {
    return this.records[category]?.[this.id(url)] || this.fallback;
  }
};
