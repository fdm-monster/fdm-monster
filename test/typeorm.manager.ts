import { AppDataSource } from "@/data-source";

export function getDatasource() {
  return AppDataSource;
}

export async function connectDataSource() {
  const orm = await AppDataSource.initialize();
  await orm.runMigrations({ transaction: "all" });
  return orm;
}

export function disconnectDataSource() {
  return AppDataSource.destroy();
}
