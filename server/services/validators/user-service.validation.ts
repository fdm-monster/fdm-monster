import { AppConstants } from "../../server.constants";

export const registerUserRules = {
  username: "required|string",
  password: `required|string|minLength:${AppConstants.DEFAULT_PASSWORD_MINLEN}`,
  needsPasswordChange: "boolean",
  roles: "required|array",
  isDemoUser: "boolean",
  isRootUser: "boolean",
  "roles.*": "required|mongoId",
};

export const newPasswordRules = {
  password: `required|string|minLength:${AppConstants.DEFAULT_PASSWORD_MINLEN}`,
};
