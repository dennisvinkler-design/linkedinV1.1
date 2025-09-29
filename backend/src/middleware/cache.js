const NodeCache = require('node-cache');

// Create cache instance with 5 minute TTL
const cache = new NodeCache({ 
  stdTTL: 300, // 5 minutes
  checkperiod: 60, // Check for expired keys every minute
  useClones: false // Don't clone objects for better performance
});

const cacheMiddleware = (ttl = 300) => {
  return (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Create cache key from URL and query params
    const cacheKey = `${req.originalUrl}`;
    
    // Check if data exists in cache
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      console.log(`Cache hit for ${cacheKey}`);
      return res.json(cachedData);
    }

    // Store original res.json method
    const originalJson = res.json.bind(res);

    // Override res.json to cache the response
    res.json = (data) => {
      // Cache the response
      cache.set(cacheKey, data, ttl);
      console.log(`Cached response for ${cacheKey}`);
      
      // Call original json method
      return originalJson(data);
    };

    next();
  };
};

// Function to invalidate cache by pattern
const invalidateCache = (pattern) => {
  const keys = cache.keys();
  const matchingKeys = keys.filter(key => key.includes(pattern));
  
  if (matchingKeys.length > 0) {
    cache.del(matchingKeys);
    console.log(`Invalidated ${matchingKeys.length} cache entries for pattern: ${pattern}`);
  }
};

// Function to clear all cache
const clearCache = () => {
  cache.flushAll();
  console.log('All cache cleared');
};

module.exports = {
  cacheMiddleware,
  invalidateCache,
  clearCache,
  cache
};
