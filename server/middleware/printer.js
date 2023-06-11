const DITokens = require("../container.tokens");
const { asValue } = require("awilix");

const printerIdToken = "currentPrinterId";
const currentPrinterToken = "currentPrinter";
const printerLoginToken = "printerLogin";

const printerResolveMiddleware = (key = "id") => {
  return async (req, res, next) => {
    /** @type {PrinterCache} */
    const printerCache = req.container.resolve(DITokens.printerCache);

    let scopedPrinter = undefined;
    let loginDto = undefined;

    const printerId = req.params[key];
    if (printerId) {
      scopedPrinter = await printerCache.getCachedPrinterOrThrow(printerId);
      loginDto = await printerCache.getLoginDto(printerId);
    }

    req.container.register({
      [currentPrinterToken]: asValue(scopedPrinter),
      [printerLoginToken]: asValue(loginDto),
      [printerIdToken]: asValue(printerId),
    });

    next();
  };
};

module.exports = {
  printerResolveMiddleware,
  currentPrinterToken,
  printerLoginToken,
  printerIdToken,
};
