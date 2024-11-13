import { AppConstants } from "@/server.constants";
import { idRuleV2 } from "./generic.validation";

export const registerUserRules = {
  username: `required|string|minLength:${AppConstants.DEFAULT_USERNAME_MINLEN}`,
  password: `required|string|minLength:${AppConstants.DEFAULT_PASSWORD_MINLEN}`,
};

export const registerUserWithRolesRules = (isSqlite: boolean) => ({
  username: `required|string|minLength:${AppConstants.DEFAULT_USERNAME_MINLEN}`,
  password: `required|string|minLength:${AppConstants.DEFAULT_PASSWORD_MINLEN}`,
  roleIds: "array",
  "roleIds.*": idRuleV2(isSqlite),
});
