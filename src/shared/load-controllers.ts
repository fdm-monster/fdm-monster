import { loadControllers } from "awilix-express";
import { join } from "node:path";
import { getDirname } from "@/utils/fs.utils";

const __dirname = getDirname(import.meta.url);

export const loadControllersFunc = () =>
  loadControllers("./controllers/*.controller.*", {
    cwd: join(__dirname, ".."),
    ignore: ["**/*.map", "**/*.d.ts"],
    esModules: true,
  });
