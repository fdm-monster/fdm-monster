const cacheManager = require("cache-manager");

function configureCacheManager() {
  return cacheManager.caching({ store: "memory", max: 100, ttl: 100 });
}

module.exports = {
  configureCacheManager,
};
