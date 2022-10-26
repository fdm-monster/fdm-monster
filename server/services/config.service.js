class ConfigService {
  get(key) {
    return process.env[key];
  }

  getOrThrow(key) {
    const val = this.get(key);
    if (!val) {
      throw Error(`Environment variable with key ${key} was not defined.`);
    }
  }
}

module.exports = {
  ConfigService,
};
