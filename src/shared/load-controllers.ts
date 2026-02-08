import { loadControllers } from "awilix-express";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const isVitest = typeof process !== 'undefined' && process.env.VITEST === 'true';

export const loadControllersFunc = () =>
  loadControllers("./controllers/*.controller.js", {
    cwd: isVitest
      ? join(process.cwd(), 'dist')
      : join(dirname(fileURLToPath(import.meta.url)), ".."),
    ignore: ["**/*.map", "**/*.d.ts"],
    esModules: true,
  });
