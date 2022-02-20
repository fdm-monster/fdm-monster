import fs from "fs";
import path, {resolve} from "path";
import dotenv from "dotenv";
import {status, up} from "migrate-mongo";
import isDocker from "is-docker";
import {execSync} from "child_process";

import Logger from "./handlers/logger";
import {AppConstants} from "./server.constants";
import * as envUtils from "./utils/env.utils";
import * as packageJson from './package.json';

const logger = new Logger("FDN-Environment", false);
const instructionsReferralURL = "https://github.com/fdm-monster/fdm-monster/blob/master/README.md";
const dotEnvPath = path.join(resolve(".env"));

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
        logger.warning(`NODE_ENV=${environment} was not set, or not known. Defaulting to NODE_ENV=${newEnvName}`);
        // Avoid writing to .env in case of docker
        if (isDocker())
            return;
        envUtils.writeVariableToEnvFile(path.resolve(dotEnvPath), AppConstants.NODE_ENV_KEY, newEnvName);
    } else {
        logger.info(`✓ NODE_ENV variable correctly set (${environment})!`);
    }
}

/**
 * Ensures that `process.env[AppConstants.VERSION_KEY]` is never undefined
 */
function ensureEnvNpmVersionSet() {
    if (!process.env[AppConstants.VERSION_KEY]) {
        process.env[AppConstants.VERSION_KEY] = packageJson.version;
        process.env[AppConstants.NON_NPM_MODE_KEY] = "true";
        logger.info(`✓ Running ${AppConstants.titleShort} version ${process.env[AppConstants.VERSION_KEY]} in non-NPM mode!`);
    } else {
        logger.debug(`✓ Running ${AppConstants.titleShort} version ${process.env[AppConstants.VERSION_KEY]} in NPM mode!`);
    }
    if (process.env[AppConstants.VERSION_KEY] !== packageJson.version) {
        process.env[AppConstants.VERSION_KEY] = packageJson.version;
        logger.warning(`~ Had to synchronize 3DH version to '${packageJson.version}' as it was outdated.`);
    }
}

function removePm2Service(reason) {
    logger.error(`Removing PM2 service as Server failed to start: ${reason}`);
    execSync(`pm2 delete ${AppConstants.pm2ServiceName}`);
}

function setupPackageJsonVersionOrThrow() {
    const result = envUtils.verifyPackageJsonRequirements(path.join(path.resolve(), AppConstants.serverPath));
    if (!result) {
        if (envUtils.isPm2()) {
            // TODO test this works under docker as well
            removePm2Service("didnt pass startup validation (package.json)");
        }
        throw new Error(`Aborting server.`);
    }
}

/**
 * Print out instructions URL
 */
function printInstructionsURL() {
    logger.info(`Please make sure to read ${instructionsReferralURL} on how to configure your environment correctly.`);
}

export function fetchMongoDBConnectionString(persistToEnv = false) {
    if (!process.env[AppConstants.MONGO_KEY]) {
        logger.warning(`~ ${AppConstants.MONGO_KEY} environment variable is not set. Assuming default: ${AppConstants.MONGO_KEY}=${AppConstants.defaultMongoStringUnauthenticated}`);
        printInstructionsURL();
        process.env[AppConstants.MONGO_KEY] = AppConstants.defaultMongoStringUnauthenticated;
        // is not isDocker just to be sure, also checked in writeVariableToEnvFile
        if (persistToEnv && !isDocker()) {
            envUtils.writeVariableToEnvFile(path.resolve(dotEnvPath), AppConstants.MONGO_KEY, AppConstants.defaultMongoStringUnauthenticated);
        }
    }
    return process.env[AppConstants.MONGO_KEY];
}

export function fetchServerPort() {
    let port = process.env[AppConstants.SERVER_PORT_KEY];
    if (Number.isNaN(parseInt(port))) {
        logger.warning(`~ The ${AppConstants.SERVER_PORT_KEY} setting was not a correct port number: >= 0 and < 65536. Actual value: ${port}.`);
        // is not isDocker just to be sure, also checked in writeVariableToEnvFile
        if (!isDocker()) {
            envUtils.writeVariableToEnvFile(path.resolve(dotEnvPath), AppConstants.SERVER_PORT_KEY, AppConstants.defaultServerPort);
            logger.info(`~ Written ${AppConstants.SERVER_PORT_KEY}=${AppConstants.defaultServerPort} setting to .env file.`);
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
        logger.info(`~ ${AppConstants.SERVER_PORT_KEY} environment variable is not set. Assuming default: ${AppConstants.SERVER_PORT_KEY}=${AppConstants.defaultServerPort}.`);
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
        dotenv.config({path: dotEnvPath});
        logger.info("✓ Parsed environment and (optional) .env file");
    }
    ensureNodeEnvSet();
    setupPackageJsonVersionOrThrow();
    ensureEnvNpmVersionSet();
    ensureMongoDBConnectionStringSet();
    ensurePortSet();
    ensurePageTitle();
}

export function getAppDistPath() {
    const clientPackage = AppConstants.clientPackageName;
    let appDistPath;
    try {
        appDistPath = require(clientPackage).getAppDistPath();
    } catch (e) {
        logger.error(`~ The client package for 3DH '${clientPackage}' was not installed. Can not load frontend app`);
        return;
    }
    if (AppConstants.OVERRIDE_VUE_DIST) {
        appDistPath = AppConstants.OVERRIDE_VUE_DIST;
    }
    if (!fs.existsSync(appDistPath)) {
        const errorMessagePrefix = `Could not find Vue app path at ${appDistPath}`;
        if (isEnvProd() && envUtils.isPm2() && !isDocker()) {
            const message = `${errorMessagePrefix} when running in non-dockerized PM2 mode. Removing pm2 3DH service.`;
            removePm2Service(message);
        } else {
            throw new Error(`${errorMessagePrefix}. ${AppConstants.titleShort} server aborting in docker|nodemon or other mode.`);
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
export async function runMigrations(db, client) {
    const migrationsStatus = await status(db);
    const pendingMigrations = migrationsStatus.filter((m) => m.appliedAt === "PENDING");
    if (pendingMigrations.length) {
        logger.info(`! MongoDB has ${pendingMigrations.length} migrations left to run (${migrationsStatus.length} migrations in total)`);
    } else {
        logger.info(`✓ Mongo Database is up to date [${migrationsStatus.length} migration applied]`);
    }
    const migrationResult = await up(db, client);
    if (migrationResult.length > 0) {
        logger.info(`Applied ${migrationResult.length} migrations successfully`, migrationResult);
    }
}

export function ensurePageTitle() {
    if (!process.env[AppConstants.SERVER_SITE_TITLE_KEY]) {
        process.env[AppConstants.SERVER_SITE_TITLE_KEY] =
            AppConstants.defaultServerPageTitle?.toString();
    }
}