import { AppConstants } from "@/server.constants";
import { getEnvOrDefault } from "@/utils/env.utils";

export interface IConfigService {
  get<T>(key: string, defaultValue?: T): T | undefined;

  getOrThrow(key: string): void;

  isDemoMode(): boolean;

  instanceLabel(): string | null;

  watchedFolderPath(): string | null;

  watchedFolderMode(): WatchedFolderMode;

  watchedFolderPolling(): boolean;
}

export type WatchedFolderMode = "consume" | "library";

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

  instanceLabel() {
    const raw = this.getTrimmedString(AppConstants.INSTANCE_LABEL);
    return raw.length ? raw : null;
  }

  watchedFolderPath() {
    const raw = this.getTrimmedString(AppConstants.WATCHED_FOLDER_PATH);
    return raw.length ? raw : null;
  }

  watchedFolderMode(): WatchedFolderMode {
    const raw = this.getTrimmedString(AppConstants.WATCHED_FOLDER_MODE).toLowerCase();
    return raw === "library" ? "library" : "consume";
  }

  watchedFolderPolling(): boolean {
    const raw = this.getTrimmedString(AppConstants.WATCHED_FOLDER_POLLING, "true").toLowerCase();
    return raw !== "false";
  }

  private getTrimmedString(key: string, defaultValue = ""): string {
    return (this.get<string>(key, defaultValue) ?? "").trim();
  }
}
