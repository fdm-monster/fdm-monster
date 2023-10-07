import { existsSync, mkdirSync } from "node:fs";
import { join } from "path";

export function superRootPath() {
  return join(__dirname, "../..");
}

export function rootPath() {
  return join(__dirname, "..");
}

export function ensureDirExists(dir: string) {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}
