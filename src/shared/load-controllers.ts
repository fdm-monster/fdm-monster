import {
  FindControllersResult,
  getStateAndTarget,
  HttpVerbs,
  IStateAndTarget,
  makeInvoker,
  rollUpState,
} from "awilix-express";
import { Router } from "express";
import { ClassOrFunctionReturning } from "awilix";
import { readdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function getControllerModules(): Promise<Record<string, () => Promise<unknown>>> {
  const controllersPath = join(__dirname, "../controllers");

  if (!existsSync(controllersPath)) {
    return {};
  }

  const files = readdirSync(controllersPath).filter(
    (file) => file.endsWith(".controller.js") || file.endsWith(".controller.ts"),
  );

  const modules: Record<string, () => Promise<unknown>> = {};
  for (const file of files) {
    const modulePath = join(controllersPath, file);
    modules[file] = () => import(modulePath);
  }
  return modules;
}

export async function loadControllersFunc(): Promise<Router> {
  const found = await findControllers();
  const router = Router();
  found.forEach(_registerController.bind(null, router));
  return router;
}

export async function findControllers(): Promise<FindControllersResult> {
  const controllerModules = await getControllerModules();
  const modules = await Promise.all(
    Object.values(controllerModules).map((load) =>
      (load as () => Promise<unknown>)().then(extractStateAndTargetFromExports),
    ),
  );
  return modules.flat();
}

function extractStateAndTargetFromExports(exports: unknown): FindControllersResult {
  const items: FindControllersResult = [];

  if (exports) {
    const stateAndTarget = getStateAndTarget(exports);
    if (stateAndTarget) {
      items.push(stateAndTarget);
      return items;
    }

    for (const key of Object.keys(exports as object)) {
      const stateAndTarget = getStateAndTarget((exports as Record<string, unknown>)[key]);
      if (stateAndTarget) {
        items.push(stateAndTarget);
      }
    }
  }

  return items;
}

function _registerController(router: Router, stateAndTarget: IStateAndTarget | null): void {
  if (!stateAndTarget) {
    return;
  }

  const { state, target } = stateAndTarget;
  const rolledUp = rollUpState(state);
  rolledUp.forEach((methodCfg, methodName) => {
    methodCfg.verbs.forEach((httpVerb) => {
      let method = httpVerb.toLowerCase();
      if (httpVerb === HttpVerbs.ALL) {
        method = "all";
      }

      (router as any)[method](
        methodCfg.paths,
        ...methodCfg.beforeMiddleware,
        makeInvoker(target as ClassOrFunctionReturning<any>)(methodName as any),
        ...methodCfg.afterMiddleware,
      );
    });
  });
}
