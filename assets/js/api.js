window.SW = window.SW || {};
SW.api = {
  base: 'https://swapi.dev/api/',
  related: new Map(),
  // Somente URLs da SWAPI são consultadas, sempre usando HTTPS.
  safeUrl(value) {
    const url = new URL(value, this.base);
    if (url.hostname !== 'swapi.dev' || !url.pathname.startsWith('/api/') || url.username || url.password || url.port) {
      throw new Error('Endereço da API inválido.');
    }
    url.protocol = 'https:';
    return url.href;
  },
  async request(url) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    try {
      const response = await fetch(this.safeUrl(url), { signal: controller.signal });
      if (!response.ok) throw new Error(`A SWAPI respondeu com status ${response.status}.`);
      return await response.json();
    } finally { clearTimeout(timeout); }
  },
  async all(category, onProgress) {
    let next = this.base + category + '/';
    const records = [];
    const visited = new Set();
    while (next) {
      next = this.safeUrl(next);
      if (visited.has(next)) throw new Error('Paginação repetida na API.');
      visited.add(next);
      const page = await this.request(next);
      if (!Array.isArray(page.results) || !page.results.every(item => item && typeof item.name === 'string' && typeof item.url === 'string')) {
        throw new Error('Resposta inesperada da SWAPI.');
      }
      records.push(...page.results);
      onProgress?.(records.length, page.count);
      next = page.next;
    }
    return records;
  },
  async load(category, onProgress) {
    const cached = SW.cache.read(category);
    if (cached?.fresh) return { data: cached.data, source: 'cache' };
    try {
      const data = await this.all(category, onProgress);
      const saved = SW.cache.write(category, data);
      return { data, source: saved ? 'api' : 'memory' };
    } catch (error) {
      if (cached) return { data: cached.data, source: 'stale' };
      throw error;
    }
  },
  async relation(url) {
    const key = this.safeUrl(url);
    if (this.related.has(key)) return this.related.get(key);
    const cached = SW.cache.read('relations')?.data || [];
    const match = cached.find(item => item.url === key);
    if (match && SW.cache.read('relations')?.fresh) {
      this.related.set(key, match.name);
      return match.name;
    }
    try {
      const item = await this.request(key);
      const name = item.name || item.title;
      if (typeof name !== 'string') throw new Error('Relação sem nome.');
      this.related.set(key, name);
      // Relê depois da requisição para preservar consultas concorrentes.
      const entries = SW.cache.read('relations')?.data || [];
      SW.cache.write('relations', [...entries.filter(entry => entry.url !== key), { name, url: key }]);
      return name;
    } catch (error) {
      if (match) return match.name + ' (salvo)';
      throw error;
    }
  }
};
