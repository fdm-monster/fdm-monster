import { registerAs } from "@nestjs/config";

export const AUTH_OPTIONS = "AUTH_MODULE_OPTIONS";

export const AuthConfig = registerAs(AUTH_OPTIONS, () => {
  return {};
});

export const DefaultAdminPassword = "PleasePrintMeAnOctopus";
