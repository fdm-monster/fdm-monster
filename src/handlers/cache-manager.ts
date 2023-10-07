import cacheManager from "cache-manager";

export function configureCacheManager() {
  return cacheManager.caching({ store: "memory", max: 100, ttl: 100 });
}
