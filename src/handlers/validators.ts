import { Request } from "express";
import { InternalServerException, ValidationException } from "@/exceptions/runtime.exceptions";
import { currentPrinterToken, printerIdToken, printerLoginToken } from "@/middleware/printer";
import { normalizeUrl } from "@/utils/normalize-url";
import nodeInputValidator, { extend } from "node-input-validator";

export function getExtendedValidator() {
  extend("wsurl", ({ value, args }, validator) => {
    if (!value) return false;
    try {
      const url = normalizeUrl(value);
      return url.startsWith("ws://") || url.startsWith("wss://");
    } catch (e) {
      return false;
    }
  });
  extend("httpurl", ({ value, args }, validator) => {
    if (!value) return false;

    try {
      if (!value.startsWith("http://") && !value.startsWith("https://")) {
        return false;
      }
      return new URL(normalizeUrl(value));
    } catch (e) {
      return false;
    }
  });
  extend("not", ({ value, args }, validator) => {
    return !value && value !== false;
  });
  return nodeInputValidator;
}

export function getScopedPrinter(req: Request) {
  const tokens = [printerLoginToken, currentPrinterToken, printerIdToken];
  let resolvedDependencies = {};
  let errors = [];
  tokens.forEach((t) => {
    try {
      const dependency = req.container.resolve(t);
      if (!dependency) {
        errors.push(
          `Scoped Dependency '${t}' was not resolved. Please ensure the route requires a :id param and the printerId was provided.`
        );
      }
      resolvedDependencies[t] = dependency;
    } catch (e) {
      throw new InternalServerException(`Dependency ${t} could not be resolved. Aborted request.`);
    }
  });

  if (errors.length > 0) {
    throw new ValidationException(errors);
  }

  return resolvedDependencies;
}

/**
 * Validate input based on rules
 */
export async function validateInput(data: any, rules: object): Promise<object> {
  const localNIV = getExtendedValidator();

  const v = new localNIV.Validator(data, rules);

  const matched = await v.check();
  if (!matched) {
    throw new ValidationException(v.errors);
  }
  return v.inputs;
}

/**
 * Handle API input validation
 */
export async function validateMiddleware(req: Request, rules: object): Promise<any> {
  return validateInput(req.body, rules);
}
