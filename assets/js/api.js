window.SW = window.SW || {};
SW.api = {
  base: 'https://swapi.dev/api/',
  related: new Map(),
  pendingRelations: new Map(),
  // Somente URLs da SWAPI são consultadas, sempre usando HTTPS.
  safeUrl(value) {
    const url = new URL(value, this.base);
    if (!['http:', 'https:'].includes(url.protocol) || url.hostname !== 'swapi.dev' || !url.pathname.startsWith('/api/') || url.username || url.password || url.port) {
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
    let expectedCount;
    const visited = new Set();
    while (next) {
      next = this.safeUrl(next);
      if (visited.has(next)) throw new Error('Paginação repetida na API.');
      visited.add(next);
      const page = await this.request(next);
      if (!Array.isArray(page.results) || !page.results.every(item => item && typeof item.name === 'string' && typeof item.url === 'string')) {
        throw new Error('Resposta inesperada da SWAPI.');
      }
      if (Number.isInteger(page.count) && page.count >= 0) expectedCount = page.count;
      if (page.next != null && (typeof page.next !== 'string' || !page.next)) {
        throw new Error('Próxima página inválida.');
      }
      records.push(...page.results);
      onProgress?.(records.length, page.count);
      next = page.next;
    }
    if (expectedCount !== undefined && records.length !== expectedCount) {
      throw new Error('Listagem incompleta da SWAPI.');
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
    const memory = this.related.get(key);
    if (memory && Date.now() >= memory.savedAt && Date.now() - memory.savedAt < SW.cache.maxAge) return memory.name;
    if (this.pendingRelations.has(key)) return this.pendingRelations.get(key);
    // Cada relação tem seu próprio prazo: salvar outra não renova dados antigos.
    const cacheKey = 'relation:' + key;
    const cached = SW.cache.read(cacheKey);
    const match = cached?.data[0];
    if (cached?.fresh && match) {
      this.related.set(key, { name: match.name, savedAt: cached.savedAt });
      return match.name;
    }
    const request = (async () => {
      try {
        const item = await this.request(key);
        const name = item.name || item.title;
        if (typeof name !== 'string') throw new Error('Relação sem nome.');
        this.related.set(key, { name, savedAt: Date.now() });
        SW.cache.write(cacheKey, [{ name, url: key }]);
        return name;
      } catch (error) {
        if (match) return match.name + ' (salvo)';
        throw error;
      }
    })();
    this.pendingRelations.set(key, request);
    try { return await request; }
    finally { this.pendingRelations.delete(key); }
  }
};
