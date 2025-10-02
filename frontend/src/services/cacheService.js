class CacheService {
  constructor() {
    this.cache = new Map();
    this.defaultTTL = 5 * 60 * 1000; // 5 minutes
  }

  set(key, value, ttl = this.defaultTTL) {
    const expiresAt = Date.now() + ttl;
    this.cache.set(key, { value, expiresAt });
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value;
  }

  delete(key) {
    this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
  }

  // Cache keys for different data types
  static KEYS = {
    PROFILES: 'profiles',
    PROGRESS: (type, id) => `progress_${type}_${id}`,
    QUESTIONS: (type, id) => `questions_${type}_${id}`,
    POSTS: 'posts',
    COMPANIES: 'companies',
    PERSONS: 'persons'
  };
}

const cacheService = new CacheService();
export default cacheService;
export { CacheService };
