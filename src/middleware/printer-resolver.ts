import type { Request } from "express";
import { currentPrinterToken, printerApiToken, printerIdToken, printerLoginToken } from "@/middleware/printer";
import type { IPrinterApi } from "@/services/printer-api.interface";
import type { LoginDto } from "@/services/interfaces/login.dto";
import { InternalServerException, ValidationException } from "@/exceptions/runtime.exceptions";
import type { PrinterDto } from "@/services/interfaces/printer.dto";

export function getScopedPrinter(req: Request) {
  const errors: string[] = [];

  const resolve = <T>(token: any): T => {
    try {
      const dep = req.container.resolve<T>(token);
      if (!dep) errors.push(`Scoped Dependency '${token}' was not resolved.`);
      return dep;
    } catch {
      throw new InternalServerException(`Dependency ${token} could not be resolved. Aborted request.`);
    }
  };

  const printerApi = resolve<IPrinterApi>(printerApiToken);
  const loginDto = resolve<LoginDto>(printerLoginToken);
  const printerDto = resolve<PrinterDto>(currentPrinterToken);
  const printerId = resolve<number>(printerIdToken);

  if (errors.length) throw new ValidationException(errors);

  return {
    [printerApiToken]: printerApi,
    [printerLoginToken]: loginDto,
    [currentPrinterToken]: printerDto,
    [printerIdToken]: printerId,
  };
}
