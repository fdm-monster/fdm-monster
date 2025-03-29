import {
  rollUpState,
  findControllers,
  HttpVerbs,
  getStateAndTarget,
  IStateAndTarget,
  IAwilixControllerBuilder,
  FindControllersOptions,
} from "awilix-router-core";
import { Router } from "express";
import { scopePerRequest } from "awilix-express";
import { asClass, AwilixContainer } from "awilix";

/**
 * Constructor type.
 */
export type ConstructorOrControllerBuilder = (new (...args: any[]) => any) | IAwilixControllerBuilder;

/**
 * Registers one or multiple decorated controller classes.
 *
 * @param container The Awilix container.
 * @param ControllerClass One or multiple "controller" classes
 */
export function controller(
  container: AwilixContainer,
  ControllerClass: ConstructorOrControllerBuilder | ConstructorOrControllerBuilder[]
): Router {
  const router = Router();
  router.use(scopePerRequest(container)); // Ensure per-request scope

  if (Array.isArray(ControllerClass)) {
    ControllerClass.forEach((c) => _registerController(router, container, getStateAndTarget(c)));
  } else {
    _registerController(router, container, getStateAndTarget(ControllerClass));
  }

  return router;
}

/**
 * Loads controllers for the given pattern.
 *
 * @param container The Awilix container.
 * @param pattern The file pattern to load controllers from.
 * @param opts Options for finding controllers.
 */
export function loadControllers2(container: AwilixContainer, pattern: string, opts?: FindControllersOptions): Router {
  const router = Router();
  router.use(scopePerRequest(container)); // Ensure per-request scope

  findControllers(pattern, {
    ...opts,
    absolute: true,
  }).forEach((c) => _registerController(router, container, c));

  return router;
}

/**
 * Reads the config state and registers the routes in the router.
 *
 * @param router The express router.
 * @param container The Awilix container.
 * @param stateAndTarget The controller class with metadata.
 */
function _registerController(router: Router, container: AwilixContainer, stateAndTarget: IStateAndTarget | null): void {
  if (!stateAndTarget) {
    return;
  }

  const { state, target } = stateAndTarget;
  const rolledUp = rollUpState(state);

  // Register controller in Awilix for CLASSIC mode
  container.register({
    [target.name]: asClass(target).scoped(),
  });

  rolledUp.forEach((methodCfg, methodName) => {
    methodCfg.verbs.forEach((httpVerb) => {
      let method = httpVerb.toLowerCase();
      if (httpVerb === HttpVerbs.ALL) {
        method = "all";
      }

      router[method](
        methodCfg.paths,
        ...methodCfg.beforeMiddleware,
        (req, res, next) => {
          // Resolve the controller from the request scope
          const controllerInstance = req.container.resolve(target.name);
          return controllerInstance[methodName](req, res, next);
        },
        ...methodCfg.afterMiddleware
      );
    });
  });
}
