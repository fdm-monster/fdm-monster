const DITokens = require("../container.tokens");
const { asValue } = require("awilix");

const printerIdToken = "currentPrinterId";
const currentPrinterToken = "currentPrinter";
const printerLoginToken = "printerLogin";

const printerResolveMiddleware = (key = "id") => {
  return (req, res, next) => {
    const loggerFactory = req.container.resolve(DITokens.loggerFactory);
    const printersStore = req.container.resolve(DITokens.printersStore);
    const logger = loggerFactory("PrinterResolverMiddleware");

    let scopedPrinter = undefined;

    if (req.params[key]) {
      scopedPrinter = printersStore.getPrinterState(req.params[key]);
    } else {
      logger.warn(`Could not resolve printer with id ${key}:${req.params[key]}`);
    }

    req.container.register({
      [currentPrinterToken]: asValue(scopedPrinter),
      [printerLoginToken]: asValue(scopedPrinter?.getLoginDetails()),
      [printerIdToken]: asValue(req.params[key])
    });

    next();
  };
};

module.exports = {
  printerResolveMiddleware,
  currentPrinterToken,
  printerLoginToken,
  printerIdToken
};
