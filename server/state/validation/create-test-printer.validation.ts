import {UUID_LENGTH} from "../../constants/service.constants.js";

const createTestPrinterRules = {
    apiKey: `required|length:${UUID_LENGTH},${UUID_LENGTH}|alphaNumeric`,
    correlationToken: "required|string",
    printerURL: "required|httpurl",
    webSocketURL: "required|wsurl",
    camURL: "httpurl"
};
export {createTestPrinterRules};
export default {
    createTestPrinterRules
};
