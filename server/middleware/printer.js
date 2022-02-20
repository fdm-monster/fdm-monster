const DITokens = require("../container.tokens");
const { asValue } = require("awilix");

const printerIdToken = "currentPrinterId";
const currentPrinterToken = "currentPrinter";
const printerLoginToken = "printerLogin";

const printerResolveMiddleware = () => {
  return (req, res, next) => {
    const printersStore = req.container.resolve(DITokens.printersStore);

    let scopedPrinter = undefined;

    if (req.params.id) {
      scopedPrinter = printersStore.getPrinterState(req.params.id);
    }

    req.container.register({
      [currentPrinterToken]: asValue(scopedPrinter),
      [printerLoginToken]: asValue(scopedPrinter?.getLoginDetails()),
      [printerIdToken]: asValue(req.params.id)
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
