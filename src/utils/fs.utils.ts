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

/**
 * Resolves the installed client package path using Node's module resolution.
 * This handles cases where FDM Monster is installed as a package and the client
 * is in node_modules at various levels (hoisted, peer dependencies, etc.)
 * @param packageName The npm package name (e.g., '@fdm-monster/client-next')
 * @returns The path to the client package dist folder, or null if not found
 */
export function resolveInstalledClientPath(packageName: string): string | null {
  try {
    // Try to resolve the package.json of the client package
    const clientPackageJsonPath = require.resolve(`${packageName}/package.json`, {
      paths: [superRootPath(), __dirname],
    });

    // The dist folder is typically at the same level as package.json
    const clientPackageRoot = join(clientPackageJsonPath, "..");
    const distPath = join(clientPackageRoot, "dist");

    return distPath;
  } catch (error) {
    // Package not found in node_modules, return null
    return null;
  }
}
