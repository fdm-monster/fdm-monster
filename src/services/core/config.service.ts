import { AppConstants } from "@/server.constants";

export interface IConfigService {
  get<T>(key: string, defaultValue?: T): T | undefined;

  getOrThrow(key: string): void;

  isDemoMode(): boolean;
}

export class ConfigService implements IConfigService {
  get<T>(key: string, defaultValue?: T) {
    if (!Object.keys(process.env).includes(key) || !process.env[key]?.length) {
      return defaultValue;
    }
    return process.env[key] as T;
  }

  getOrThrow(key: string) {
    const val = this.get(key);
    if (!val) {
      throw Error(`Environment variable with key ${key} was not defined.`);
    }
  }

  isDemoMode() {
    return this.get<string>(AppConstants.OVERRIDE_IS_DEMO_MODE, "false") === "true";
  }
}
