import { AppConstants } from "@/server.constants";

export interface IConfigService {
  get(key: string, defaultValue?: string): string | undefined;

  getOrThrow(key: string): void;

  isDemoMode(): boolean;
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

  isDemoMode() {
    return this.get(AppConstants.OVERRIDE_IS_DEMO_MODE, "false") === "true";
  }
}
