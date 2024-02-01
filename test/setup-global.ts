import { AppConstants } from "@/server.constants";
import { closeDatabase } from "./mongo-memory.handler";
import { isSqliteModeTest } from "./typeorm.manager";

module.exports = async () => {
  process.env.TZ = "UTC";
  process.env[AppConstants.VERSION_KEY] = "1.0.0";
  process.env[AppConstants.ENABLE_EXPERIMENTAL_WHITELIST_SETTINGS] = "true";
  process.env[AppConstants.OVERRIDE_IS_DEMO_MODE] = "false";
  process.env[AppConstants.DATABASE_FILE] = ":memory:";
  process.env[AppConstants.ENABLE_EXPERIMENTAL_TYPEORM] = process.env["SQLITE_MODE"] || "false";
};
