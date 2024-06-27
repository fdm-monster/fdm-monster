import { Request } from "express";
import { InternalServerException, ValidationException } from "@/exceptions/runtime.exceptions";
import { currentPrinterToken, printerApiToken, printerIdToken, printerLoginToken } from "@/middleware/printer";
import { normalizeUrl } from "@/utils/normalize-url";
import nodeInputValidator, { extend, extendMessages } from "node-input-validator";
import { IdType } from "@/shared.constants";
import { LoginDto } from "@/services/interfaces/login.dto";
import { CachedPrinter } from "@/state/printer.cache";
import { IPrinterApi } from "@/services/printer-api.interface";

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
  extendMessages({
    not: "The :attribute field may not be present.",
  });
  return nodeInputValidator;
}

export function getScopedPrinter(req: Request) {
  const tokens = [printerApiToken, printerLoginToken, currentPrinterToken, printerIdToken];
  let resolvedDependencies: {
    [printerApiToken]: IPrinterApi;
    [printerLoginToken]: LoginDto;
    [currentPrinterToken]: CachedPrinter;
    [printerIdToken]: IdType;
  } = {};
  let errors: any[] = [];
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
export async function validateInput<T>(data: any, rules: T): Promise<T> {
  const localNIV = getExtendedValidator();

  const v = new localNIV.Validator(data, rules as object);

  const matched = await v.check();
  if (!matched) {
    throw new ValidationException(v.errors);
  }
  return v.inputs as T;
}

/**
 * Handle API input validation
 */
export async function validateMiddleware<T>(req: Request, rules: T): Promise<any> {
  return validateInput(req.body, rules);
}
