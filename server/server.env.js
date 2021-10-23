const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const envUtils = require("./utils/env.utils");
const dotenv = require("dotenv");
const { AppConstants } = require("./server.constants");

const { status, up } = require("migrate-mongo");
const isDocker = require("is-docker");
const Logger = require("./handlers/logger.js");
const logger = new Logger("3DPF-Environment", false);

// Constants and definition
const instructionsReferralURL = "https://github.com/davidzwa/3d-print-farm/blob/master/README.md";
const packageJsonPath = path.join(__dirname, "../package.json");
const dotEnvPath = path.join(__dirname, "../.env");

function isEnvProd() {
  return process.env[AppConstants.NODE_ENV_KEY] === AppConstants.defaultProductionEnv;
}

/**
 * Set and write the environment name to file, if applicable
 * @returns {*}
 */
function ensureNodeEnvSet() {
  const environment = process.env[AppConstants.NODE_ENV_KEY];
  if (!environment || !AppConstants.knownEnvNames.includes(environment)) {
    const newEnvName = AppConstants.defaultProductionEnv;
    process.env[AppConstants.NODE_ENV_KEY] = newEnvName;
    logger.warning(
      `NODE_ENV=${environment} was not set, or not known. Defaulting to NODE_ENV=${newEnvName}`
    );

    // Avoid writing to .env in case of docker
    if (isDocker()) return;

    envUtils.writeVariableToEnvFile(
      path.resolve(dotEnvPath),
      AppConstants.NODE_ENV_KEY,
      newEnvName
    );
  } else {
    logger.info(`✓ NODE_ENV variable correctly set (${environment})!`);
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
    logger.info(`✓ Running 3DPF version ${process.env[AppConstants.VERSION_KEY]} in non-NPM mode!`);
  } else {
    logger.debug(`✓ Running 3DPF version ${process.env[AppConstants.VERSION_KEY]} in NPM mode!`);
  }

  if (process.env[AppConstants.VERSION_KEY] !== packageJsonVersion) {
    process.env[AppConstants.VERSION_KEY] = packageJsonVersion;
    logger.warning(
      `~ Had to synchronize 3DPF version to '${packageJsonVersion}' as it was outdated.`
    );
  }
}

function removePm2Service(reason) {
  logger.error(`Removing PM2 service as Server failed to start: ${reason}`);
  execSync("pm2 delete 3DPF");
}

function setupPackageJsonVersionOrThrow() {
  const result = envUtils.verifyPackageJsonRequirements(path.join(__dirname, "../"));
  if (!result) {
    if (envUtils.isPm2()) {
      // TODO test this works under docker as well
      removePm2Service("didnt pass startup validation (package.json)");
    }
    throw new Error("Aborting 3DPF server.");
  }
}

/**
 * Print out instructions URL
 */
function printInstructionsURL() {
  logger.info(
    `Please make sure to read ${instructionsReferralURL} on how to configure your environment correctly.`
  );
}

function fetchMongoDBConnectionString(persistToEnv = false) {
  if (!process.env[AppConstants.MONGO_KEY]) {
    logger.warning(
      `~ ${AppConstants.MONGO_KEY} environment variable is not set. Assuming default: ${AppConstants.MONGO_KEY}=${AppConstants.defaultMongoStringUnauthenticated}`
    );
    printInstructionsURL();
    process.env[AppConstants.MONGO_KEY] = AppConstants.defaultMongoStringUnauthenticated;

    // is not isDocker just to be sure, also checked in writeVariableToEnvFile
    if (persistToEnv && !isDocker()) {
      envUtils.writeVariableToEnvFile(
        path.resolve(dotEnvPath),
        AppConstants.MONGO_KEY,
        AppConstants.defaultMongoStringUnauthenticated
      );
    }
  }
  return process.env[AppConstants.MONGO_KEY];
}

function fetchServerPort() {
  let port = process.env[AppConstants.SERVER_PORT_KEY];
  if (Number.isNaN(parseInt(port))) {
    logger.warning(
      `~ The ${AppConstants.SERVER_PORT_KEY} setting was not a correct port number: >= 0 and < 65536. Actual value: ${port}.`
    );

    // is not isDocker just to be sure, also checked in writeVariableToEnvFile
    if (!isDocker()) {
      envUtils.writeVariableToEnvFile(
        path.resolve(dotEnvPath),
        AppConstants.SERVER_PORT_KEY,
        AppConstants.defaultServerPort
      );
      logger.info(
        `~ Written ${AppConstants.SERVER_PORT_KEY}=${AppConstants.defaultServerPort} setting to .env file.`
      );
    }

    // Update config immediately
    process.env[AppConstants.SERVER_PORT_KEY] = AppConstants.defaultServerPort.toString();
    port = process.env[AppConstants.SERVER_PORT_KEY];
  }
  return port;
}

/**
 * Make sure that we have a valid MongoDB connection string to work with.
 */
function ensureMongoDBConnectionStringSet() {
  let dbConnectionString = process.env[AppConstants.MONGO_KEY];
  if (!dbConnectionString) {
    // In docker we better not write to .env
    const persistDbString = !isDocker();

    fetchMongoDBConnectionString(persistDbString);
  } else {
    logger.info(`✓ ${AppConstants.MONGO_KEY} environment variable set!`);
  }
}

function ensurePortSet() {
  fetchServerPort();

  if (!process.env[AppConstants.SERVER_PORT_KEY]) {
    logger.info(
      `~ ${AppConstants.SERVER_PORT_KEY} environment variable is not set. Assuming default: ${AppConstants.SERVER_PORT_KEY}=${AppConstants.defaultServerPort}.`
    );
    printInstructionsURL();
    process.env[AppConstants.SERVER_PORT_KEY] = AppConstants.defaultServerPort.toString();
  }
}

/**
 * Parse and consume the .env file. Validate everything before starting the server.
 * Later this will switch to parsing a `config.yaml` file.
 */
function setupEnvConfig(skipDotEnv = false) {
  if (!skipDotEnv) {
    // This needs to be CWD of app.js, so be careful not to move this call.
    dotenv.config({ path: dotEnvPath });
    logger.info("✓ Parsed environment and (optional) .env file");
  }

  ensureNodeEnvSet();
  setupPackageJsonVersionOrThrow();
  ensureEnvNpmVersionSet();
  ensureMongoDBConnectionStringSet();
  ensurePortSet();
  ensurePageTitle();
}

function getAppDistPath() {
  const clientPackage = "@3d-print-farm/client";
  let appDistPath;
  try {
    appDistPath = require(clientPackage).getAppDistPath();
  } catch (e) {
    logger.error(
      `~ The client package for 3DPF '${clientPackage}' was not installed. Can not load frontend app`
    );
    return;
  }

  if (AppConstants.OVERRIDE_VUE_DIST) {
    appDistPath = AppConstants.OVERRIDE_VUE_DIST;
  }

  if (!fs.existsSync(appDistPath)) {
    const errorMessagePrefix = `Could not find Vue app path at ${appDistPath}`;

    if (isEnvProd() && envUtils.isPm2() && !isDocker()) {
      const message = `${errorMessagePrefix} when running in non-dockerized PM2 mode. Removing pm2 3DPF service.`;
      removePm2Service(message);
    } else {
      throw new Error(
        `${errorMessagePrefix}. 3DPF server aborting in docker|nodemon or other mode.`
      );
    }
  }

  logger.info(`✓ Vue dist folder found: ${appDistPath}`);

  return appDistPath;
}

/**
 * Checks and runs database migrations
 * @param db
 * @param client
 * @returns {Promise<void>}
 */
async function runMigrations(db, client) {
  const migrationsStatus = await status(db);
  const pendingMigrations = migrationsStatus.filter((m) => m.appliedAt === "PENDING");

  if (pendingMigrations.length) {
    logger.info(
      `! MongoDB has ${pendingMigrations.length} migrations left to run (${migrationsStatus.length} are already applied)`
    );
  } else {
    logger.info(`✓ Mongo Database is up to date [${migrationsStatus.length} migration applied]`);
  }

  const migrationResult = await up(db, client);

  if (migrationResult > 0) {
    logger.info(`Applied ${migrationResult.length} migrations successfully`, migrationResult);
  }
}

function ensurePageTitle() {
  if (!process.env[AppConstants.SERVER_SITE_TITLE_KEY]) {
    process.env[AppConstants.SERVER_SITE_TITLE_KEY] =
      AppConstants.defaultServerPageTitle?.toString();
  }
}

module.exports = {
  isEnvProd,
  setupEnvConfig,
  runMigrations,
  fetchMongoDBConnectionString,
  fetchServerPort,
  getAppDistPath
};
