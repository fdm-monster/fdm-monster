import {UUID_LENGTH} from "../../constants/service.constants.js";

const createPrinterRules = {
    _id: "not",
    apiKey: `required|length:${UUID_LENGTH},${UUID_LENGTH}|alphaNumeric`,
    printerURL: "required|httpurl",
    webSocketURL: "required|wsurl",
    enabled: "boolean",
    settingsAppearance: "object",
    "settingsAppearance.name": "string",
    camURL: "httpurl"
};
const updatePrinterEnabledRule = {
    enabled: "required|boolean"
};
export {createPrinterRules};
export {updatePrinterEnabledRule};
export default {
    createPrinterRules,
    updatePrinterEnabledRule
};
