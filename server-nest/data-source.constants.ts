import { config } from "dotenv";
import { isE2eEnv } from "./src/utils/env.utils";
import { Logger } from "@nestjs/common";
import { PostgresConnectionOptions } from "typeorm/driver/postgres/PostgresConnectionOptions";
import { version } from "./package.json";

export const POSTGRES_DATABASE_URL = "POSTGRES_DATABASE_URL";
export const TYPEORM_DATABASE = "TYPEORM_DATABASE";
export const TYPEORM_USERNAME = "TYPEORM_USERNAME";
export const TYPEORM_PASSWORD = "TYPEORM_PASSWORD";
export const TYPEORM_PORT = "TYPEORM_PORT";
export const defaultDatabaseName = "fdm-monster";

export function loadDotEnvConfig() {
  // Temporary provide the CLI with similar values the server has
  if (isE2eEnv()) {
    let logger = new Logger("DataSource.constants");
    logger.log("Initiating E2E database mode");
    config({
      path: ".env.test-e2e",
      override: false,
    });
  } else {
    config({
      override: false,
    });
  }
}

export function processTypeOrmConfig(commonConfig: PostgresConnectionOptions) {
  if (isE2eEnv()) {
    Object.assign(commonConfig, {
      database: `test-e2e-${version}`,
      autoLoadEntities: true,
    });
  }

  return commonConfig;
}
