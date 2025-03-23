import { join } from "path";
import * as Sentry from "@sentry/node";
import { config } from "dotenv";
import { AppConstants } from "./server.constants";
import { LoggerService as Logger } from "./handlers/logger";
import { getEnvOrDefault, isProductionEnvironment } from "./utils/env.utils";
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

function ensurePackageVersionSet() {
  const packageJsonVersion = require(packageJsonPath).version;
  if (!process.env[AppConstants.VERSION_KEY]) {
    process.env[AppConstants.VERSION_KEY] = packageJsonVersion;
  }

  logger.log(`✓ Running server version ${process.env[AppConstants.VERSION_KEY]}`);
}

function printInstructionsURL() {
  logger.log(`Please make sure to read ${instructionsReferralURL} for more information.`);
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

export function setupEnvConfig(skipDotEnv = false) {
  if (!skipDotEnv) {
    // This needs to be CWD of app.js, so be careful not to move this call.
    config({ path: dotEnvPath });
    logger.log("✓ Parsed environment and (optional) .env file");
  }

  ensureNodeEnvSet();
  ensurePackageVersionSet();
  setupSentry();
  ensurePortSet();
}
