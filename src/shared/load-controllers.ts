import { loadControllers } from "awilix-express";
import { join } from "path";

export const loadControllersFunc = () =>
  loadControllers("./controllers/*.controller.*", {
    cwd: join(__dirname, ".."),
    ignore: ["**/*.map", "**/*.d.ts"],
  });
