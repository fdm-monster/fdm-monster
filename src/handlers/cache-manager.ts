import { createCache } from "cache-manager";

export function configureCacheManager() {
  return createCache({
    ttl: 100,
  });
}
