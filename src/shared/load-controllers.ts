import { loadControllers } from "awilix-express";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { getDirname } from "@/utils/fs.utils";

// In test mode (CJS), use global __dirname; in ESM mode, compute it
const dirPath = typeof __dirname !== 'undefined'
  ? __dirname
  : getDirname(import.meta.url);

export const loadControllersFunc = () =>
  loadControllers("./controllers/*.controller.*", {
    cwd: join(dirPath, ".."),
    ignore: ["**/*.map", "**/*.d.ts"],
    esModules: process.env.NODE_ENV !== 'test',
  });
