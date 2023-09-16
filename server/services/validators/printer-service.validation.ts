import { UUID_LENGTH } from "../../constants/service.constants";

export const createPrinterRules = {
  _id: "not",
  apiKey: `required|length:${UUID_LENGTH},${UUID_LENGTH}|alphaNumeric`,
  printerURL: "required|httpurl",
  enabled: "boolean",
  settingsAppearance: "object",
  "settingsAppearance.name": "string",
};

export const updatePrinterEnabledRule = {
  enabled: "required|boolean",
};

export const updateApiUsernameRule = {
  currentUser: "required|string",
};

export const updatePrinterDisabledReasonRule = {
  disabledReason: "required|nullable|string",
  enabled: "boolean",
};
