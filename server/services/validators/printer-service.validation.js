import service from "../../constants/service.constants";
const { UUID_LENGTH } = service;
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
export { createPrinterRules };
export { updatePrinterEnabledRule };
export default {
    createPrinterRules,
    updatePrinterEnabledRule
};
