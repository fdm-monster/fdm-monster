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

const controllerModules = import.meta.glob("@/controllers/*.controller.ts");

export async function loadControllersFunc(): Promise<Router> {
  const found = await findControllers();
  const router = Router();
  found.forEach(_registerController.bind(null, router));
  return router;
}

export async function findControllers(): Promise<FindControllersResult> {
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
