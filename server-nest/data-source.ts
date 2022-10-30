import { DataSource } from "typeorm";
import { MysqlConnectionOptions } from "typeorm/driver/mysql/MysqlConnectionOptions";
import { config } from "dotenv";
import {
  MONGO_DATABASE_URL,
  TYPEORM_DATABASE,
  TYPEORM_PASSWORD,
  TYPEORM_USERNAME
} from "./data-source.constants";
import { MongoConnectionOptions } from "typeorm/driver/mongodb/MongoConnectionOptions";

// @todo this does not allow dynamic reconfiguration of datasource
config();

const mongoDbUrl = process.env[MONGO_DATABASE_URL];
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
export const AppOrmConfig: MongoConnectionOptions = !!mongoDbUrl?.length
  ? {
      type: "mongodb",
      url: mongoDbUrl,
      ...commonConfig
    }
  : {
      type: "mongodb",
      database: process.env[TYPEORM_DATABASE] || defaultDatabaseName,
      username: process.env[TYPEORM_USERNAME] || "root",
      password: process.env[TYPEORM_PASSWORD] || "",
      ...commonConfig
    };

export const AppDataSource = new DataSource(AppOrmConfig);
