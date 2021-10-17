const DITokens = require("../container.tokens");
const { asValue } = require("awilix");

const currentPrinterToken = "currentPrinter";
const printerLoginToken = "printerLogin";

const printerMiddleware = () => {
  return (req, res, next) => {
    const printersStore = req.container.resolve(DITokens.printersStore);

    let scopedPrinter = undefined;

    if (req.query.printerId) {
      scopedPrinter = printersStore.getPrinterState(req.query.printer);
    } else if (req.headers.printerid) {
      scopedPrinter = printersStore.getPrinterState(req.headers.printerid);
    }

    req.container.register({
      [currentPrinterToken]: asValue(scopedPrinter),
      [printerLoginToken]: asValue(scopedPrinter?.getLoginDetails())
    });

    next();
  };
};

module.exports = {
  printerMiddleware,
  currentPrinterToken,
  printerLoginToken
};
