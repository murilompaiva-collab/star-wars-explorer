window.SW = window.SW || {};
SW.images = {
  fallback: 'assets/images/fallback.svg',
  fallbacks: { people: 'assets/images/fallback.svg', planets: 'assets/images/planets.svg', starships: 'assets/images/starships.svg', vehicles: 'assets/images/vehicles.svg' },
  // Adicione aqui somente arquivos locais com licença verificada. Ex.: people: { '1': 'assets/images/personagens/1.webp' }
  records: { people: {}, planets: {}, starships: {}, vehicles: {} },
  // Retratos vetoriais originais, gerados localmente sem links externos.
  portrait(id) {
    const themes = ['#d8b66b','#74a8c4','#c76b68','#8caf8a','#b998d5','#d2a278'];
    const accent = themes[(Number(id) || 0) % themes.length];
    const droid = ['2','3','8'].includes(id);
    const vader = id === '4';
    const yoda = id === '20';
    const leia = id === '5';
    const shape = droid
      ? '<path d="M145 322V170Q145 105 210 105Q275 105 275 170V322Z" fill="#c2b8a1" stroke="'+accent+'" stroke-width="7"/><circle cx="182" cy="185" r="23" fill="#263849"/><circle cx="238" cy="185" r="23" fill="#263849"/><path d="M167 245h86v42h-86z" fill="'+accent+'"/>'
      : vader
      ? '<path d="M120 330Q122 255 151 231Q127 103 210 92Q293 103 269 231Q298 255 300 330Z" fill="#161b24" stroke="'+accent+'" stroke-width="6"/><path d="M155 174l48 18-34 20zm110 0-48 18 34 20z" fill="#070a0f" stroke="#a5afb8" stroke-width="4"/><path d="M185 237h50l-9 43h-32z" fill="#65717c"/>'
      : yoda
      ? '<path d="M125 325Q130 253 210 248Q290 253 295 325Z" fill="#bcb5a0"/><path d="M157 173L92 135L112 210L160 213M263 173L328 135L308 210L260 213" fill="#89a978"/><ellipse cx="210" cy="192" rx="57" ry="65" fill="#89a978"/><path d="M179 190h20m22 0h20" stroke="#405d3c" stroke-width="5"/>'
      : '<path d="M125 325Q136 260 210 250Q284 260 295 325Z" fill="'+accent+'" opacity=".6"/><ellipse cx="210" cy="187" rx="55" ry="67" fill="#bfa18a"/><path d="M155 176Q145 101 210 102Q275 101 265 176Q215 130 155 176Z" fill="#4b4140"/>'+(leia?'<circle cx="150" cy="182" r="31" fill="#4b4140"/><circle cx="270" cy="182" r="31" fill="#4b4140"/>':'')+'<path d="M181 187h18m22 0h18" stroke="#353137" stroke-width="4"/>';
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 360"><defs><radialGradient id="g"><stop stop-color="#2b3b4a"/><stop offset="1" stop-color="#0d141e"/></radialGradient></defs><rect width="420" height="360" fill="url(#g)"/><g fill="none" stroke="'+accent+'" stroke-opacity=".2"><circle cx="210" cy="180" r="140"/><circle cx="210" cy="180" r="164" stroke-dasharray="4 14"/></g>'+shape+'<rect y="331" width="420" height="29" fill="#0b1019" fill-opacity=".8"/><text x="210" y="350" text-anchor="middle" fill="'+accent+'" font-family="sans-serif" font-size="11" letter-spacing="3">ARQUIVO GALÁCTICO</text></svg>';
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  },
  id(url) {
    return String(url).match(/\/(\d+)\/?$/)?.[1] || '—';
  },
  get(category, url) {
    return this.records[category]?.[this.id(url)] || (category === 'people' ? this.portrait(this.id(url)) : this.fallbacks[category] || this.fallback);
  }
};
