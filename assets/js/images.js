window.SW = window.SW || {};
SW.images = {
  fallback: 'assets/images/fallback.svg',
  fallbacks: { people: 'assets/images/fallback.svg', planets: 'assets/images/planets.svg', starships: 'assets/images/starships.svg', vehicles: 'assets/images/vehicles.svg' },
  // Adicione aqui somente arquivos locais com licença verificada. Ex.: people: { '1': 'assets/images/personagens/1.webp' }
  records: { people: {}, planets: {}, starships: {}, vehicles: {} },
  id(url) {
    return String(url).match(/\/(\d+)\/?$/)?.[1] || '—';
  },
  get(category, url) {
    const id = this.id(url);
    // Galeria visual externa, associada aos IDs da SWAPI. Caso a imagem falhe,
    // app.js mantém o fallback da categoria.
    if (category === 'people' && /^\d+$/.test(id)) {
      return this.records.people[id] || `https://starwarsgallery.netlify.app/assets/people/${id}.jpg`;
    }
    return this.records[category]?.[id] || this.fallbacks[category] || this.fallback;
  }
};
