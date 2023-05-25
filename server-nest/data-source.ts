import {
  defaultDatabaseName,
  loadDotEnvConfig,
  POSTGRES_DATABASE_URL,
  processTypeOrmConfig,
  TYPEORM_DATABASE,
  TYPEORM_PASSWORD,
  TYPEORM_PORT,
  TYPEORM_USERNAME,
} from "./data-source.constants";
import { TypeOrmModuleOptions } from "@nestjs/typeorm";
import { PostgresConnectionOptions } from "typeorm/driver/postgres/PostgresConnectionOptions";
import { DataSource, DataSourceOptions } from "typeorm";

loadDotEnvConfig();

const postgresUrl = process.env[POSTGRES_DATABASE_URL];
const commonConfig = {
  type: "postgres",
  database: process.env[TYPEORM_DATABASE] || defaultDatabaseName,
  entities: ["dist/**/*.entity{.ts,.js}"],
  subscribers: ["dist/**/*.subscriber{.ts,.js}"],
  migrations: ["dist/**/migrations/*{.ts,.js}"],
  synchronize: false,
  logging: ["error", "warn"],
  logger: "simple-console",
  connectTimeoutMS: 500,
  // To differentiate with Server's connection
  applicationName: "FDM Monster CLI",
  // Manually run at runtime
  migrationsRun: false,
  // No point in reconnecting often, slowly
  retryAttempts: 1,
  retryDelay: 100,
} as PostgresConnectionOptions;

export const appOrmConfig: TypeOrmModuleOptions = !!postgresUrl?.length
  ? processTypeOrmConfig({
      url: postgresUrl,
      ...commonConfig,
    })
  : processTypeOrmConfig({
      database: process.env[TYPEORM_DATABASE] || defaultDatabaseName,
      username: process.env[TYPEORM_USERNAME] || "postgres",
      password: process.env[TYPEORM_PASSWORD] || "",
      port: parseInt(process.env[TYPEORM_PORT], 10) || 5432,
      ...commonConfig,
    });

// Required for CLI interop, not for runtime
export const appDataSource = new DataSource(appOrmConfig as DataSourceOptions);
