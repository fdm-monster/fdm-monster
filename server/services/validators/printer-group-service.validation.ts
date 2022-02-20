import {minPrinterGroupNameLength} from "../../constants/service.constants.js";

const printerIdRules = {
    printerId: "required|mongoId"
};
const printerInGroupRules = {
    printerId: "required|mongoId",
    location: "required|string"
};
const updatePrinterGroupNameRules = {
    name: `required|minLength:${minPrinterGroupNameLength}`
};
const createPrinterGroupRules = {
    name: `required|minLength:${minPrinterGroupNameLength}`,
    printers: "array",
    "printers.*": "required|object",
    "printers.*.printerId": "required|mongoId",
    "printers.*.location": "string"
};
export {createPrinterGroupRules};
export {updatePrinterGroupNameRules};
export {printerIdRules};
export {printerInGroupRules};
export default {
    createPrinterGroupRules,
    updatePrinterGroupNameRules,
    printerIdRules,
    printerInGroupRules
};
