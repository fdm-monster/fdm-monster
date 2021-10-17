const DITokens = require("../container.tokens");
const { asValue } = require("awilix");

const currentPrinterToken = "currentPrinter";
const printerLoginToken = "printerLogin";

const printerMiddleware = () => {
  return (req, res, next) => {
    const printersStore = req.container.resolve(DITokens.printersStore);

    let scopedPrinter = undefined;

    if (req.params.id) {
      scopedPrinter = printersStore.getPrinterState(req.params.id);
    }

    req.container.register({
      [currentPrinterToken]: asValue(scopedPrinter),
      [printerLoginToken]: asValue(scopedPrinter?.getLoginDetails())
    });

    next();
  };
};

module.exports = {
  printerResolveMiddleware: printerMiddleware,
  currentPrinterToken,
  printerLoginToken
};
