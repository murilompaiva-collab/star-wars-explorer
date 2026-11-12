// O cache guarda apenas JSON. Uma falha no armazenamento não interrompe o site.
window.SW = window.SW || {};
SW.cache = {
  maxAge: 24 * 60 * 60 * 1000,
  read(key) {
    try {
      const entry = JSON.parse(localStorage.getItem(`swexplorer:v1:${key}`));
      if (!entry || !Number.isFinite(entry.savedAt) || !Array.isArray(entry.data)) return null;
      if (!entry.data.every(item => item && typeof item.name === 'string' && typeof item.url === 'string')) return null;
      return { ...entry, fresh: Date.now() >= entry.savedAt && Date.now() - entry.savedAt < this.maxAge };
    } catch { return null; }
  },
  write(key, data) {
    try {
      localStorage.setItem(`swexplorer:v1:${key}`, JSON.stringify({ savedAt: Date.now(), data }));
      return true;
    } catch { return false; }
  }
};
