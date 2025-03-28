import { NextFunction, Request, Response } from "express";
import { DITokens } from "@/container.tokens";

export const ParamInt = (paramName: string) => createParamDecorator(paramName, Number);
export const ParamBool = (paramName: string) => createParamDecorator(paramName, Boolean);
export const ParamString = (paramName: string) => createParamDecorator(paramName, String);
export const ParamId = (paramName: string) => createParamDecorator(paramName, "id");

function createParamDecorator(paramName: string, type: StringConstructor | NumberConstructor | BooleanConstructor | "id") {
  return function (req: Request<{ local: any; [k: string]: any }>, res: Response, next: NextFunction) {
    const paramValue = req.params[paramName];

    if (paramValue === undefined) {
      return res.status(400).send(`Missing parameter: ${paramName}`);
    }

    let convertedValue;

    // Dynamic mapping Sqlite: number, MongoDB: string
    if (type === "id") {
      type = req.container?.resolve(DITokens.isTypeormMode) ? Number : String;
    }

    if (type === Number) {
      convertedValue = parseInt(paramValue, 10);
      if (isNaN(convertedValue)) {
        return res.status(400).send(`Invalid number: ${paramName}`);
      }
    } else if (type === Boolean) {
      if (paramValue.toLowerCase() === "true") {
        convertedValue = true;
      } else if (paramValue.toLowerCase() === "false") {
        convertedValue = false;
      } else {
        return res.status(400).send(`Invalid boolean: ${paramName}`);
      }
    } else {
      convertedValue = paramValue; // No conversion for other types
    }

    req.local = req.local || {};
    req.local[paramName] = convertedValue;

    next();
  };
}
