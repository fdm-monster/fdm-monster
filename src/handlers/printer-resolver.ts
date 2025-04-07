import { Request } from "express";
import { currentPrinterToken, printerApiToken, printerIdToken, printerLoginToken } from "@/middleware/printer";
import { IPrinterApi } from "@/services/printer-api.interface";
import { LoginDto } from "@/services/interfaces/login.dto";
import { CachedPrinter } from "@/state/printer.cache";
import { IdType } from "@/shared.constants";
import { InternalServerException, ValidationException } from "@/exceptions/runtime.exceptions";

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
          `Scoped Dependency '${t}' was not resolved. Please ensure the route requires a :id param and the printerId was provided.`,
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
