import service from "../../constants/service.constants";
const { UUID_LENGTH } = service;
const stepSizeRules = {
    stepSize: "required|in:0.1,1,10,100|numeric"
};
const flowRateRules = {
    flowRate: "required|between:75,125|integer"
};
const feedRateRules = {
    feedRate: "required|between:10,200|integer"
};
const updateSortIndexRules = {
    sortList: "required|array|minLength:1",
    "sortList.*": "required|mongoId"
};
const updatePrinterEnabledRule = {
    enabled: "required|boolean"
};
const updatePrinterConnectionSettingRules = {
    printerURL: "required|httpurl",
    webSocketURL: "required|wsurl",
    camURL: "httpurl",
    apiKey: `required|minLength:${UUID_LENGTH}|maxLength:${UUID_LENGTH}`
};
export { stepSizeRules };
export { feedRateRules };
export { flowRateRules };
export { updateSortIndexRules };
export { updatePrinterEnabledRule };
export { updatePrinterConnectionSettingRules };
export default {
    stepSizeRules,
    feedRateRules,
    flowRateRules,
    updateSortIndexRules,
    updatePrinterEnabledRule,
    updatePrinterConnectionSettingRules
};
