const nodeInputValidator = require("node-input-validator");
const { ValidationException, InternalServerException } = require("../exceptions/runtime.exceptions");
const { printerLoginToken, currentPrinterToken, printerIdToken } = require("../middleware/printer");
const { normalizeUrl } = require("../utils/normalize-url");

function getExtendedValidator() {
  nodeInputValidator.extend("wsurl", ({ value, args }, validator) => {
    if (!value) return false;
    try {
      const url = normalizeUrl(value);
      return url.startsWith("ws://") || url.startsWith("wss://");
    } catch (e) {
      return false;
    }
  });
  nodeInputValidator.extend("httpurl", ({ value, args }, validator) => {
    if (!value) return false;

    try {
      if (!value.startsWith("http://") && !value.startsWith("https://")) {
        return false;
      }
      return new URL(normalizeUrl(value));
    } catch (e) {
      return false;
    }
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

/**
 * Validate input based on rules
 * @param data
 * @param rules
 * @returns {Promise<object>}
 */
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
  validateMiddleware,
  validateInput,
  getScopedPrinter,
};
