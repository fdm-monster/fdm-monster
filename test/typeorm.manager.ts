import { AppDataSource } from "@/data-source";
import { AppConstants } from "@/server.constants";

export function getDatasource() {
  return AppDataSource;
}

export function isSqliteModeTest() {
  return process.env[AppConstants.ENABLE_EXPERIMENTAL_TYPEORM] === "true";
}
