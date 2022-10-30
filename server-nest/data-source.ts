import { DataSource } from "typeorm";
import { config } from "dotenv";
import {
  POSTGRES_DATABASE_URL,
  TYPEORM_DATABASE,
  TYPEORM_PASSWORD,
  TYPEORM_USERNAME
} from "./data-source.constants";
import { PostgresConnectionOptions } from "typeorm/driver/postgres/PostgresConnectionOptions";

// @todo this does not allow dynamic reconfiguration of datasource
config();

const postgresUrl = process.env[POSTGRES_DATABASE_URL];
const defaultDatabaseName = "fdm-monster";

const commonConfig = {
  database: process.env[TYPEORM_DATABASE] || defaultDatabaseName,
  entities: ["dist/**/*.entity{.ts,.js}"],
  subscribers: ["dist/**/*.subscriber{.ts,.js}"],
  migrations: ["dist/**/migrations/*{.ts,.js}"],
  synchronize: false,
  migrationsRun: true,
  extra: {
    charset: "utf8mb4_0900_ai_ci"
  }
};
export const AppOrmConfig: PostgresConnectionOptions = !!postgresUrl?.length
  ? {
      type: "postgres",
      url: postgresUrl,
      ...commonConfig
    }
  : {
      type: "postgres",
      database: process.env[TYPEORM_DATABASE] || defaultDatabaseName,
      username: process.env[TYPEORM_USERNAME] || "root",
      password: process.env[TYPEORM_PASSWORD] || "",
      ...commonConfig
    };

export const AppDataSource = new DataSource(AppOrmConfig);
