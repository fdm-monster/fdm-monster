import { status, up } from "migrate-mongo";
import { join } from "path";
import { execSync } from "child_process";
import * as Sentry from "@sentry/node";
import { config } from "dotenv";
import { AppConstants } from "./server.constants";
import { LoggerService as Logger } from "./handlers/logger";
import { getEnvOrDefault, isPm2, isProductionEnvironment, verifyPackageJsonRequirements } from "./utils/env.utils";
import { errorSummary } from "./utils/error.utils";
import { superRootPath } from "@/utils/fs.utils";

const logger = new Logger("FDM-Environment", false);

// Constants and definition
const instructionsReferralURL = "https://docs.fdm-monster.net";
const packageJsonPath = join(superRootPath(), "./package.json");
const dotEnvPath = join(superRootPath(), "./.env");

function isEnvTest() {
  return process.env[AppConstants.NODE_ENV_KEY] === AppConstants.defaultTestEnv;
}

export function isEnvProd() {
  return process.env[AppConstants.NODE_ENV_KEY] === AppConstants.defaultProductionEnv;
}

/**
 * Set and write the environment name to file, if applicable

 */
function ensureNodeEnvSet() {
  const environment = process.env[AppConstants.NODE_ENV_KEY];
  if (!environment || !AppConstants.knownEnvNames.includes(environment)) {
    const newEnvName = AppConstants.defaultProductionEnv;
    process.env[AppConstants.NODE_ENV_KEY] = newEnvName;
    logger.warn(`NODE_ENV=${environment} was not set, or not known. Defaulting to NODE_ENV=${newEnvName}`);
  } else {
    logger.log(`✓ NODE_ENV variable correctly set (${environment})!`);
  }
}

/**
 * Ensures that `process.env[AppConstants.VERSION_KEY]` is never undefined
 */
function ensureEnvNpmVersionSet() {
  const packageJsonVersion = require(packageJsonPath).version;
  if (!process.env[AppConstants.VERSION_KEY]) {
    process.env[AppConstants.VERSION_KEY] = packageJsonVersion;
    process.env[AppConstants.NON_NPM_MODE_KEY] = "true";
    logger.log(`✓ Running server version ${process.env[AppConstants.VERSION_KEY]} in non-NPM mode!`);
  } else {
    logger.debug(`✓ Running server version ${process.env[AppConstants.VERSION_KEY]} in NPM mode!`);
  }

  if (process.env[AppConstants.VERSION_KEY] !== packageJsonVersion) {
    process.env[AppConstants.VERSION_KEY] = packageJsonVersion;
    logger.debug(`~ Had to synchronize FDM version to '${packageJsonVersion}' as it was outdated.`);
  }
}

function removePm2Service(reason: string) {
  logger.error(`Removing PM2 service as Server failed to start: ${reason}`);
  execSync(`pm2 delete ${AppConstants.pm2ServiceName}`);
}

function setupPackageJsonVersionOrThrow() {
  const result = verifyPackageJsonRequirements(superRootPath());
  if (!result) {
    if (isPm2()) {
      // TODO test this works under docker as well
      removePm2Service("didnt pass startup validation (package.json)");
    }
    throw new Error("Aborting server.");
  }
}

/**
 * Print out instructions URL
 */
function printInstructionsURL() {
  logger.log(`Please make sure to read ${instructionsReferralURL} for more information.`);
}

export function fetchMongoDBConnectionString() {
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

/**
 * Make sure that we have a valid MongoDB connection string to work with.
 */
export function ensureMongoDBConnectionStringSet() {
  let dbConnectionString = process.env[AppConstants.MONGO_KEY];
  if (!dbConnectionString) {
    fetchMongoDBConnectionString();
  } else {
    logger.log(`✓ ${AppConstants.MONGO_KEY} environment variable set!`);
  }
}

export function setupSentry() {
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
  fetchServerPort();

  if (!process.env[AppConstants.SERVER_PORT_KEY]) {
    logger.log(`~ ${AppConstants.SERVER_PORT_KEY} environment variable is not set`);
    printInstructionsURL();
    process.env[AppConstants.SERVER_PORT_KEY] = AppConstants.defaultServerPort.toString();
  }
}

/**
 * Parse and consume the .env file. Validate everything before starting the server.
 * Later this will switch to parsing a `config.yaml` file.
 */
export function setupEnvConfig(skipDotEnv = false) {
  if (!skipDotEnv) {
    // This needs to be CWD of app.js, so be careful not to move this call.
    config({ path: dotEnvPath });
    logger.log("✓ Parsed environment and (optional) .env file");
  }

  ensureNodeEnvSet();
  setupPackageJsonVersionOrThrow();
  ensureEnvNpmVersionSet();
  setupSentry();
  ensureMongoDBConnectionStringSet();
  ensurePortSet();
}

/**
 * Checks and runs database migrations
 **/
export async function runMigrations(db: any, client: any): Promise<void> {
  const migrationsStatus = await status(db);
  const pendingMigrations = migrationsStatus.filter((m) => m.appliedAt === "PENDING");

  if (pendingMigrations.length) {
    logger.log(
      `! MongoDB has ${pendingMigrations.length} migrations left to run (${migrationsStatus.length} migrations in total)`
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
