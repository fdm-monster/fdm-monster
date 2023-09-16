export class ConfigService {
  get(key, defaultValue) {
    if (!Object.keys(process.env).includes(key) || !process.env[key]?.length) {
      return defaultValue;
    }
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
