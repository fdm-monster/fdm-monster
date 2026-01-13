import { existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { AppConstants } from "@/server.constants";
import { getEnvOrDefault } from "@/utils/env.utils";

export function getDatabaseFilePath() {
  const dbFile = getEnvOrDefault(AppConstants.DATABASE_FILE, AppConstants.defaultDatabaseFile);
  if (dbFile === ":memory:") {
    return dbFile;
  }

  const dbFolder = getDatabaseFolder();
  return join(dbFolder, dbFile);
}

export function getDatabaseFolder() {
  return getEnvOrDefault(AppConstants.DATABASE_PATH, join(superRootPath(), AppConstants.defaultDatabasePath));
}

export function getMediaPath() {
  return getEnvOrDefault(AppConstants.MEDIA_PATH, join(superRootPath(), AppConstants.defaultBaseMediaPath));
}

export function packageJsonPath() {
  return join(superRootPath(), "./package.json");
}

export function ensureDirExists(dir: string) {
  if (existsSync(dir)) {
    return;
  }

  mkdirSync(dir, { recursive: true });
}

/**
 * Root where code is hosted, avoid using excessively
 */
export function superRootPath() {
  return join(__dirname, "../..");
}
