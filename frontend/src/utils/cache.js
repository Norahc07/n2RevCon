/**
 * API Response Cache Utility
 * Implements intelligent caching for API responses to reduce loading times
 */

const CACHE_PREFIX = 'n2revcon_cache_';
const CACHE_VERSION = 'v1';
const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes default TTL

// In-memory cache for faster access
const memoryCache = new Map();

/**
 * Generate cache key from URL and params
 */
const generateCacheKey = (url, params = {}) => {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}=${JSON.stringify(params[key])}`)
    .join('&');
  return `${CACHE_PREFIX}${CACHE_VERSION}_${url}${sortedParams ? `?${sortedParams}` : ''}`;
};

/**
 * Get cache entry
 */
const getCache = (key) => {
  // Check memory cache first
  if (memoryCache.has(key)) {
    const entry = memoryCache.get(key);
    if (entry.expiresAt > Date.now()) {
      return entry.data;
    }
    // Expired, remove from memory
    memoryCache.delete(key);
  }

  // Check localStorage
  try {
    const cached = localStorage.getItem(key);
    if (cached) {
      const entry = JSON.parse(cached);
      if (entry.expiresAt > Date.now()) {
        // Restore to memory cache
        memoryCache.set(key, entry);
        return entry.data;
      } else {
        // Expired, remove from localStorage
        localStorage.removeItem(key);
      }
    }
  } catch (error) {
    console.error('Error reading from cache:', error);
  }

  return null;
};

/**
 * Set cache entry
 */
const setCache = (key, data, ttl = DEFAULT_TTL) => {
  const entry = {
    data,
    expiresAt: Date.now() + ttl,
    cachedAt: Date.now(),
  };

  // Store in memory cache
  memoryCache.set(key, entry);

  // Store in localStorage (with size limit check)
  try {
    const serialized = JSON.stringify(entry);
    // Check if localStorage has enough space (rough estimate)
    if (serialized.length < 5 * 1024 * 1024) { // 5MB limit per entry
      localStorage.setItem(key, serialized);
    }
  } catch (error) {
    // localStorage might be full, just use memory cache
    console.warn('Could not store in localStorage, using memory cache only:', error);
  }
};

/**
 * Remove cache entry
 */
const removeCache = (key) => {
  memoryCache.delete(key);
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Error removing from cache:', error);
  }
};

/**
 * Clear all cache entries matching a pattern
 */
const clearCachePattern = (pattern) => {
  // Clear from memory
  for (const key of memoryCache.keys()) {
    if (key.includes(pattern)) {
      memoryCache.delete(key);
    }
  }

  // Clear from localStorage
  try {
    const keys = Object.keys(localStorage);
    for (const key of keys) {
      if (key.startsWith(CACHE_PREFIX) && key.includes(pattern)) {
        localStorage.removeItem(key);
      }
    }
  } catch (error) {
    console.error('Error clearing cache pattern:', error);
  }
};

/**
 * Clear all expired cache entries
 */
const clearExpiredCache = () => {
  const now = Date.now();

  // Clear from memory
  for (const [key, entry] of memoryCache.entries()) {
    if (entry.expiresAt <= now) {
      memoryCache.delete(key);
    }
  }

  // Clear from localStorage
  try {
    const keys = Object.keys(localStorage);
    for (const key of keys) {
      if (key.startsWith(CACHE_PREFIX)) {
        try {
          const entry = JSON.parse(localStorage.getItem(key));
          if (entry.expiresAt <= now) {
            localStorage.removeItem(key);
          }
        } catch (error) {
          // Invalid entry, remove it
          localStorage.removeItem(key);
        }
      }
    }
  } catch (error) {
    console.error('Error clearing expired cache:', error);
  }
};

/**
 * Clear all cache
 */
const clearAllCache = () => {
  memoryCache.clear();
  try {
    const keys = Object.keys(localStorage);
    for (const key of keys) {
      if (key.startsWith(CACHE_PREFIX)) {
        localStorage.removeItem(key);
      }
    }
  } catch (error) {
    console.error('Error clearing all cache:', error);
  }
};

/**
 * Get cache statistics
 */
const getCacheStats = () => {
  let memoryCount = memoryCache.size;
  let localStorageCount = 0;
  let totalSize = 0;

  try {
    const keys = Object.keys(localStorage);
    for (const key of keys) {
      if (key.startsWith(CACHE_PREFIX)) {
        localStorageCount++;
        const item = localStorage.getItem(key);
        if (item) {
          totalSize += item.length;
        }
      }
    }
  } catch (error) {
    console.error('Error getting cache stats:', error);
  }

  return {
    memoryEntries: memoryCount,
    localStorageEntries: localStorageCount,
    totalSize: totalSize,
    totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
  };
};

// Clean up expired cache on load and periodically
if (typeof window !== 'undefined') {
  clearExpiredCache();
  // Clean up expired cache every 10 minutes
  setInterval(clearExpiredCache, 10 * 60 * 1000);
}

export {
  generateCacheKey,
  getCache,
  setCache,
  removeCache,
  clearCachePattern,
  clearAllCache,
  getCacheStats,
  DEFAULT_TTL,
};

