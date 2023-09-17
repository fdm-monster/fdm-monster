import { asValue } from "awilix";
import { DITokens } from "../container.tokens";

export const printerIdToken = "currentPrinterId";
export const currentPrinterToken = "currentPrinter";
export const printerLoginToken = "printerLogin";

export const printerResolveMiddleware = (key = "id") => {
  return (req, res, next) => {
    /** @type {PrinterCache} */
    const printerCache = req.container.resolve(DITokens.printerCache);

    let scopedPrinter = undefined;
    let loginDto = undefined;

    const printerId = req.params[key];
    if (printerId) {
      scopedPrinter = printerCache.getCachedPrinterOrThrow(printerId);
      loginDto = printerCache.getLoginDto(printerId);
    }

    req.container.register({
      [currentPrinterToken]: asValue(scopedPrinter),
      [printerLoginToken]: asValue(loginDto),
      [printerIdToken]: asValue(printerId),
    });

    next();
  };
};
