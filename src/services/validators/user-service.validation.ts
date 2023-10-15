import { AppConstants } from "@/server.constants";

export const registerUserRules = {
  username: `required|string|minLength:${AppConstants.DEFAULT_USERNAME_MINLEN}`,
  password: `required|string|minLength:${AppConstants.DEFAULT_PASSWORD_MINLEN}`,
  needsPasswordChange: "boolean",
  roles: "required|array",
  isDemoUser: "boolean",
  isRootUser: "boolean",
  "roles.*": "required|mongoId",
  isVerified: "boolean",
};

export const newPasswordRules = {
  password: `required|string|minLength:${AppConstants.DEFAULT_PASSWORD_MINLEN}`,
};
