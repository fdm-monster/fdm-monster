import { NextFunction, Request, Response } from "express";
import { validateInput } from "@/handlers/validators";
import { idRulesV2 } from "@/controllers/validation/generic.validation";

export const ParamInt = (paramName: string) => createParamDecorator(paramName, Number);
export const ParamBool = (paramName: string) => createParamDecorator(paramName, Boolean);
export const ParamString = (paramName: string) => createParamDecorator(paramName, String);
export const ParamId = (paramName: string) => createParamDecorator(paramName, "id");

function createParamDecorator(
  paramName: string,
  type: StringConstructor | NumberConstructor | BooleanConstructor | "id",
) {
  return async (req: Request<{ local: any; [k: string]: any }>, res: Response, next: NextFunction) => {
    const paramValue = req.params[paramName];

    if (paramValue === undefined) {
      return res.status(400).send(`Missing parameter: ${paramName}`);
    }

    let convertedValue;

    let validateIdAsType = null;
    if (type === "id") {
      validateIdAsType = Number;
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
      convertedValue = Number.parseInt(paramValue, 10);
      if (Number.isNaN(convertedValue)) {
        return res.status(400).send(`Invalid number: ${paramName}`);
      }
    } else {
      // No conversion for other types
      return res.status(400).send(`Unknown type of: ${paramName}`);
    }

    // Validate an id type so it fits with the database
    if (validateIdAsType === Number) {
      try {
        await validateInput({ id: convertedValue }, idRulesV2);
      } catch (e) {
        return next(e);
      }
    }

    req.local = req.local || {};
    req.local[paramName] = convertedValue;

    next();
  };
}
