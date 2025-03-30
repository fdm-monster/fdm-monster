import { Request } from "express";
import { InternalServerException, ValidationException } from "@/exceptions/runtime.exceptions";
import { currentPrinterToken, printerApiToken, printerIdToken, printerLoginToken } from "@/middleware/printer";
import { normalizeUrl } from "@/utils/normalize-url";
import nodeInputValidator, { extend, extendMessages } from "node-input-validator";
import { IdType } from "@/shared.constants";
import { LoginDto } from "@/services/interfaces/login.dto";
import { CachedPrinter } from "@/state/printer.cache";
import { IPrinterApi } from "@/services/printer-api.interface";
import { defaultHttpProtocol } from "@/utils/url.utils";

export function getExtendedValidator() {
  extend("wsurl", ({ value, args }: { value: any; args: any }, validator: any) => {
    if (!value) return false;

    try {
      const url = new URL(normalizeUrl(value, { defaultProtocol: "wss" }));
      return url.protocol === "ws:" || url.protocol === "wss:";
    } catch (e) {
      return false;
    }
  });

  extend("httpurl", ({ value, args }: { value: any; args: any }, validator: any) => {
    if (!value) return false;

    try {
      const url = new URL(normalizeUrl(value, { defaultProtocol: defaultHttpProtocol }));
      return url.protocol === "http:" || url.protocol === "https:";
    } catch (e) {
      return false;
    }
  });

  extend("not", ({ value, args }: { value: any; args: any }, validator: any) => {
    return !value && value !== false;
  });

  extendMessages({
    not: "The :attribute field may not be present.",
  });

  return nodeInputValidator;
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
