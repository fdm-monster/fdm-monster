import { AppDataSource } from "@/data-source";
import { AppConstants } from "@/server.constants";

export function getDatasource() {
  return AppDataSource;
}

export function isSqliteModeTest() {
  return process.env[AppConstants.ENABLE_EXPERIMENTAL_TYPEORM] === "true";
}

// export async function connectDataSource() {
//   const orm = await AppDataSource.initialize();
//   await orm.runMigrations({ transaction: "all" });
//   return orm;
// }

// export function disconnectDataSource() {
//   return AppDataSource.destroy();
// }
