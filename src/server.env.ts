import { status, up } from "migrate-mongo";
import { join } from "path";
import * as Sentry from "@sentry/node";
import { AppConstants } from "./server.constants";
import { LoggerService as Logger } from "./handlers/logger";
import { getEnvOrDefault, isProductionEnvironment } from "./utils/env.utils";
import { errorSummary } from "./utils/error.utils";
import { superRootPath } from "@/utils/fs.utils";
import { collectDefaultMetrics, register } from "prom-client";

const instructionsReferralURL = "https://docs.fdm-monster.net";
const packageJsonPath = join(superRootPath(), "./package.json");

function isEnvTest() {
  return process.env[AppConstants.NODE_ENV_KEY] === AppConstants.defaultTestEnv;
}

export function isEnvProd() {
  return process.env[AppConstants.NODE_ENV_KEY] === AppConstants.defaultProductionEnv;
}

function ensureNodeEnvSet() {
  const logger = new Logger("FDM-Environment");

  const environment = process.env[AppConstants.NODE_ENV_KEY];
  if (!environment || !AppConstants.knownEnvNames.includes(environment)) {
    const newEnvName = AppConstants.defaultProductionEnv;
    process.env[AppConstants.NODE_ENV_KEY] = newEnvName;
    logger.warn(`NODE_ENV=${environment} was not set, or not known. Defaulting to NODE_ENV=${newEnvName}`);
  } else {
    logger.log(`✓ NODE_ENV variable correctly set (${environment})!`);
  }
}

function ensurePackageVersionSet() {
  const logger = new Logger("FDM-Environment");
  const packageJsonVersion = require(packageJsonPath).version;
  process.env[AppConstants.VERSION_KEY] ??= packageJsonVersion;

  logger.log(`✓ Running server version ${process.env[AppConstants.VERSION_KEY]}`);
}

function printInstructionsURL() {
  const logger = new Logger("FDM-Environment");
  logger.log(`Please make sure to read ${instructionsReferralURL} for more information.`);
}

export function fetchMongoDBConnectionString() {
  const logger = new Logger("FDM-Environment");
  if (!process.env[AppConstants.MONGO_KEY]) {
    logger.debug(`~ ${AppConstants.MONGO_KEY} environment variable is not set. Assuming default`);
    printInstructionsURL();
    process.env[AppConstants.MONGO_KEY] = AppConstants.defaultMongoStringUnauthenticated;
  }
  return process.env[AppConstants.MONGO_KEY];
}

export function fetchServerPort() {
  let port = process.env[AppConstants.SERVER_PORT_KEY];
  if (Number.isNaN(parseInt(port!))) {
    // Update config immediately
    process.env[AppConstants.SERVER_PORT_KEY] = AppConstants.defaultServerPort.toString();
    port = process.env[AppConstants.SERVER_PORT_KEY];
  }
  return port;
}

export function ensureMongoDbConnectionStringSet() {
  const logger = new Logger("FDM-Environment");
  const dbConnectionString = process.env[AppConstants.MONGO_KEY];
  if (!dbConnectionString) {
    fetchMongoDBConnectionString();
  } else {
    logger.log(`✓ ${AppConstants.MONGO_KEY} environment variable set!`);
  }
}

export function setupSentry() {
  const logger = new Logger("FDM-Environment");
  const sentryDsnToken = getEnvOrDefault(AppConstants.sentryCustomDsnToken, AppConstants.sentryCustomDsnDefault);

  Sentry.init({
    dsn: sentryDsnToken,
    environment: process.env.NODE_ENV,
    release: process.env.npm_package_version,
    enabled: !isEnvTest(),
    tracesSampleRate: isProductionEnvironment() ? 0.25 : 1.0,
  });

  process.on("unhandledRejection", (e) => {
    const message = `Unhandled rejection error - ${errorSummary(e)}`;
    logger.error(message);

    // The server must not crash
    Sentry.captureException(e);
  });
}

export function ensurePortSet() {
  const logger = new Logger("FDM-Environment");
  fetchServerPort();

  if (!process.env[AppConstants.SERVER_PORT_KEY]) {
    logger.log(`~ ${AppConstants.SERVER_PORT_KEY} environment variable is not set`);
    printInstructionsURL();
    process.env[AppConstants.SERVER_PORT_KEY] = AppConstants.defaultServerPort.toString();
  }
}

export function setupEnvConfig() {
  ensureNodeEnvSet();
  ensurePackageVersionSet();
  setupSentry();
  ensureMongoDbConnectionStringSet();
  ensurePortSet();

  // Optional: Enable collection of default metrics like memory, CPU, etc.
  if (process.env[AppConstants.ENABLE_PROMETHEUS_METRICS] === "true") {
    collectDefaultMetrics({ register });
    register.removeSingleMetric("nodejs_version_info");
  }
}

export async function runMigrations(db: any, client: any): Promise<void> {
  const logger = new Logger("FDM-Environment");
  const migrationsStatus = await status(db);
  const pendingMigrations = migrationsStatus.filter((m) => m.appliedAt === "PENDING");

  if (pendingMigrations.length) {
    logger.log(
      `! MongoDB has ${pendingMigrations.length} migrations left to run (${migrationsStatus.length} migrations in total)`,
    );
  } else {
    logger.log(`✓ Mongo Database is up to date [${migrationsStatus.length} migration applied]`);
  }

  const migrationResult = await up(db, client);
  if (migrationResult?.length > 0) {
    logger.log(`Applied ${migrationResult.length} migrations successfully`, migrationResult);
  } else {
    logger.log("No migrations were run");
  }
}
