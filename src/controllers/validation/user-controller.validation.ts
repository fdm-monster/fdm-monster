import { AppConstants } from "@/server.constants";

export const registerUserRules = {
  username: `required|string|minLength:${AppConstants.DEFAULT_USERNAME_MINLEN}`,
  password: `required|string|minLength:${AppConstants.DEFAULT_PASSWORD_MINLEN}`,
};
