import { existsSync, mkdirSync, readdirSync, statSync } from "node:fs";

export function ensureDirExists(dir) {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  return;
}

export function getFileSize(file: string) {
  const { size } = statSync(file);
  return size;
}

export function getDirFiles(dir) {
  return readdirSync(dir);
}
