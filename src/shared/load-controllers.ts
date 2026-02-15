import {
  FindControllersResult,
  getStateAndTarget, HttpVerbs, IStateAndTarget,
  makeInvoker,
  rollUpState
} from "awilix-express";
import { Router } from "express";
import { ClassOrFunctionReturning } from "awilix";
import glob from "fast-glob";
import { pathToFileURL, fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

async function globImport(pattern: string, baseDir: string) {
  const files = await glob(pattern, { cwd: baseDir, absolute: true });

  const imports: Record<string, () => Promise<any>> = {};
  for (const file of files) {
    imports[file] = () => import(pathToFileURL(file).href);
  }

  return imports;
}

export async function loadControllersFunc(): Promise<Router> {
  const result = findControllers()

  const found = await result;
  const router = Router();
  found.forEach(_registerController.bind(null, router));
  return router;
}

export async function findControllers(): Promise<FindControllersResult> {
  let result: Record<string, () => Promise<any>>;

  if (process.env.VITEST === 'true') {
    // @ts-ignore - Vite feature
    result = import.meta.glob("@/controllers/*.controller.*");
  } else {
    const baseDir = join(dirname(fileURLToPath(import.meta.url)), '..');
    result = await globImport('controllers/*.controller.js', baseDir);
  }

  const paths = Object.keys(result);
  const controllers = await Promise.all(
    paths.map((path) => result[path]().then(extractStateAndTargetFromExports))
  );
  return controllers.flat();
}

function extractStateAndTargetFromExports(exports: any): FindControllersResult {
  const items: FindControllersResult = []

  if (exports) {
    const stateAndTarget = getStateAndTarget(exports)
    if (stateAndTarget) {
      items.push(stateAndTarget)
      return items
    }

    // loop through exports - this will cover named as well as a default export
    for (const key of Object.keys(exports)) {
      const stateAndTarget = getStateAndTarget(exports[key])
      if (stateAndTarget) {
        items.push(stateAndTarget)
      }
    }
  }

  return items
}

function _registerController(
  router: Router,
  stateAndTarget: IStateAndTarget | null,
): void {
  if (!stateAndTarget) {
    return
  }

  const { state, target } = stateAndTarget
  const rolledUp = rollUpState(state)
  rolledUp.forEach((methodCfg, methodName) => {
    methodCfg.verbs.forEach((httpVerb) => {
      let method = httpVerb.toLowerCase()
      if (httpVerb === HttpVerbs.ALL) {
        method = 'all'
      }

      ;(router as any)[method](
        methodCfg.paths,
        ...methodCfg.beforeMiddleware,
        /*tslint:disable-next-line*/
        makeInvoker(target as ClassOrFunctionReturning<any>)(methodName as any),
        ...methodCfg.afterMiddleware,
      )
    })
  })
}
