import nodeInputValidator from "node-input-validator";

import {InternalServerException, ValidationException} from "../exceptions/runtime.exceptions.js";
import {currentPrinterToken, printerIdToken, printerLoginToken} from "../middleware/printer.js";

export const arrayValidator = function arrayLengthValidator(minIncl = null, maxIncl = null) {
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

export function validateMongoURL(mongoURL) {
    const mongoString = mongoURL.toLowerCase();
    const hasMongoPrefix = mongoString.toLowerCase().includes("mongodb://") ||
        mongoString.toLowerCase().includes("mongodb+srv://");
    const isKnownDatabase = mongoString.includes("/fdm-monster");
    return {
        hasMongoPrefix,
        isKnownDatabase,
        isValid: isKnownDatabase || hasMongoPrefix
    };
}

export function getExtendedValidator() {
    nodeInputValidator.extend("wsurl", ({value, args}, validator) => {
        if (!value)
            return false;
        const url = new URL(value).href;
        return url.includes("ws://") || url.includes("wss://");
    });
    nodeInputValidator.extend("httpurl", ({value, args}, validator) => {
        if (!value)
            return false;
        const url = new URL(value).href;
        return url.includes("http://") || url.includes("https://");
    });
    nodeInputValidator.extend("not", ({value, args}, validator) => {
        return !value && value !== false;
    });
    return nodeInputValidator;
}

export function getScopedPrinter(req) {
    const tokens = [printerLoginToken, currentPrinterToken, printerIdToken];
    let resolvedDependencies: any = {};
    let errors = [];
    tokens.forEach((t) => {
        try {
            const dependency = req.container.resolve(t);
            if (!dependency) {
                errors.push(`Scoped Dependency '${t}' was not resolved. Please ensure the route requires a :id param and the printerId was provided.`);
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

export async function validateInput(data, rules) {
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
export async function validateMiddleware(req, rules) {
    return validateInput(req.body, rules);
}