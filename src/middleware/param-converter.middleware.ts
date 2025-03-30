import { NextFunction, Request, Response } from "express";
import { DITokens } from "@/container.tokens";
import { validateInput } from "@/handlers/validators";
import { idRulesV2 } from "@/controllers/validation/generic.validation";
import { isString } from "lodash";

export const ParamInt = (paramName: string) => createParamDecorator(paramName, Number);
export const ParamBool = (paramName: string) => createParamDecorator(paramName, Boolean);
export const ParamString = (paramName: string) => createParamDecorator(paramName, String);
export const ParamId = (paramName: string) => createParamDecorator(paramName, "id");

function createParamDecorator(paramName: string, type: StringConstructor | NumberConstructor | BooleanConstructor | "id") {
  return async (req: Request<{ local: any; [k: string]: any }>, res: Response, next: NextFunction) => {
    const paramValue = req.params[paramName];

    if (paramValue === undefined) {
      return res.status(400).send(`Missing parameter: ${paramName}`);
    }

    let convertedValue;

    // Dynamic mapping Sqlite: number, MongoDB: string
    const isTypeormMode = req.container?.resolve(DITokens.isTypeormMode);
    let validateIdAsType = null;
    if (type === "id") {
      validateIdAsType = isTypeormMode ? Number : String;
    }

    if (type === Boolean) {
      if (paramValue.toLowerCase() === "true") {
        convertedValue = true;
      } else if (paramValue.toLowerCase() === "false") {
        convertedValue = false;
      } else {
        return res.status(400).send(`Invalid boolean: ${paramName}`);
      }
    } else if (type === Number || validateIdAsType === Number) {
      convertedValue = parseInt(paramValue, 10);
      if (isNaN(convertedValue)) {
        return res.status(400).send(`Invalid number: ${paramName}`);
      }
    } else if (type === String || validateIdAsType === String) {
      convertedValue = paramValue;
      if (!isString(convertedValue)) {
        return res.status(400).send(`Invalid string: ${paramName}`);
      }
    } else {
      // No conversion for other types
      return res.status(400).send(`Unknown type of: ${paramName}`);
    }

    // Validate an id type so it fits with the database
    if (validateIdAsType === String || validateIdAsType === Number) {
      try {
        await validateInput({ id: convertedValue }, idRulesV2(isTypeormMode));
      } catch (e) {
        return next(e);
      }
    }

    req.local = req.local || {};
    req.local[paramName] = convertedValue;

    next();
  };
}
