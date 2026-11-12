window.SW = window.SW || {};
SW.images = {
  fallback: 'assets/images/fallback.svg',
  fallbacks: { people: 'assets/images/fallback.svg', planets: 'assets/images/planets.svg', starships: 'assets/images/starships.svg', vehicles: 'assets/images/vehicles.svg' },
  // Somente arquivos locais com identidade e direitos registrados em docs/IMAGENS.md.
  records: { people: {}, planets: {}, starships: {}, vehicles: {} },
  id(value, category) {
    try {
      const url = new URL(value);
      if (!['https:', 'http:'].includes(url.protocol) || url.hostname !== 'swapi.dev' || url.username || url.password || url.port) return '—';
      const match = url.pathname.match(/^\/api\/(people|planets|starships|vehicles)\/(\d+)\/?$/);
      return match && (!category || match[1] === category) ? match[2] : '—';
    } catch { return '—'; }
  },
  get(category, url) {
    const id = this.id(url, category);
    // IDs iguais em fontes diferentes não comprovam correspondência fotográfica.
    // A galeria candidata continua na auditoria, mas não é publicada automaticamente.
    return this.records[category]?.[id] || this.fallbacks[category] || this.fallback;
  }
};
