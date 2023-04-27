const DITokens = require("../container.tokens");
const { asValue } = require("awilix");

const printerIdToken = "currentPrinterId";
const currentPrinterToken = "currentPrinter";
const printerLoginToken = "printerLogin";

const printerResolveMiddleware = (key = "id") => {
  return (req, res, next) => {
    const printerStore = req.container.resolve(DITokens.printerStore);

    let scopedPrinter = undefined;

    if (req.params[key]) {
      scopedPrinter = printerStore.getPrinterState(req.params[key]);
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
