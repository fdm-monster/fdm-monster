import { AppConstants } from "@/server.constants";
import { getEnvOrDefault } from "@/utils/env.utils";

export interface IConfigService {
  get<T>(key: string, defaultValue?: T): T | undefined;

  getOrThrow(key: string): void;

  isDemoMode(): boolean;
}

export class ConfigService implements IConfigService {
  get<T>(key: string, defaultValue?: T) {
    return getEnvOrDefault(key, defaultValue);
  }

  getOrThrow(key: string) {
    const val = this.get(key);
    if (!val) {
      throw new Error(`Environment variable with key ${key} was not defined.`);
    }
  }

  isDemoMode() {
    return this.get<string>(AppConstants.OVERRIDE_IS_DEMO_MODE, "false") === "true";
  }
}
