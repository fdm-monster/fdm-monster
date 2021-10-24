const nodeInputValidator = require("node-input-validator");
const {
  ValidationException,
  InternalServerException
} = require("../exceptions/runtime.exceptions");
const { printerLoginToken, currentPrinterToken, printerIdToken } = require("../middleware/printer");

const arrayValidator = function arrayLengthValidator(minIncl = null, maxIncl = null) {
  return (arrayValue) => {
    let isMinLength = true;
    let isMaxLength = true;
    if (!!minIncl) {
      isMinLength = arrayValue.length >= minIncl;
    }
    if (!!maxIncl) {
      isMaxLength = arrayValue.length <= maxIncl;
    }
    return isMinLength && isMaxLength;
  };
};

function validateMongoURL(mongoURL) {
  const mongoString = mongoURL.toLowerCase();
  const hasMongoPrefix =
    mongoString.toLowerCase().includes("mongodb://") ||
    mongoString.toLowerCase().includes("mongodb+srv://");
  const isKnownDatabase = mongoString.includes("/3dhub");

  return {
    hasMongoPrefix,
    isKnownDatabase,
    isValid: isKnownDatabase || hasMongoPrefix
  };
}

function getExtendedValidator() {
  nodeInputValidator.extend("wsurl", ({ value, args }, validator) => {
    if (!value) return false;
    const url = new URL(value).href;
    return url.includes("ws://") || url.includes("wss://");
  });
  nodeInputValidator.extend("httpurl", ({ value, args }, validator) => {
    if (!value) return false;
    const url = new URL(value).href;
    return url.includes("http://") || url.includes("https://");
  });
  nodeInputValidator.extend("not", ({ value, args }, validator) => {
    return !value && value !== false;
  });
  return nodeInputValidator;
}

function getScopedPrinter(req) {
  const tokens = [printerLoginToken, currentPrinterToken, printerIdToken];
  let resolvedDependencies = {};
  let errors = [];
  tokens.forEach((t) => {
    try {
      const dependency = req.container.resolve(t);
      if (!dependency) {
        errors.push(
          `Scoped Dependency '${t}' was not resolved. Please ensure the route requires a :id param and the printerId was provided.`
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

async function validateInput(data, rules) {
  const localNIV = getExtendedValidator();

  const v = new localNIV.Validator(data, rules);

  const matched = await v.check();
  if (!matched) {
    throw new ValidationException(v.errors);
  }
  return v.inputs;
}

/**
 * Handle API input validation
 * @param req
 * @param rules
 * @returns {Promise<boolean|any>}
 */
async function validateMiddleware(req, rules) {
  return validateInput(req.body, rules);
}

module.exports = {
  arrayValidator,
  validateMiddleware,
  validateInput,
  getScopedPrinter,
  validateMongoURL
};
