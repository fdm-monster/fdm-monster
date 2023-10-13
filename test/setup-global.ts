import { AppConstants } from "@/server.constants";
module.exports = async () => {
  process.env.TZ = "UTC";
  process.env[AppConstants.VERSION_KEY] = "1.0.0";
  process.env[AppConstants.ENABLE_EXPERIMENTAL_WHITELIST_SETTINGS] = "true";
};
