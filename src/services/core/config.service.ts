export interface IConfigService {
  get(key: string, defaultValue?: string): string | undefined;

  getOrThrow(key: string): void;
}

export class ConfigService implements IConfigService {
  get(key: string, defaultValue?: string) {
    if (!Object.keys(process.env).includes(key) || !process.env[key]?.length) {
      return defaultValue;
    }
    return process.env[key];
  }

  getOrThrow(key: string) {
    const val = this.get(key);
    if (!val) {
      throw Error(`Environment variable with key ${key} was not defined.`);
    }
  }
}
