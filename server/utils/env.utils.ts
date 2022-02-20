import fs from "fs";
import dotenv from "dotenv";
import isDocker from 'is-docker';

import Logger from "../handlers/logger.js";

const packageJson = require('../package.json');

const logger = new Logger("OF-Utils-Env", false);

export function isPm2() {
    return ("PM2_HOME" in process.env || "PM2_JSON_PROCESSING" in process.env || "PM2_CLI" in process.env);
}

export function isNodemon() {
    return ("npm_lifecycle_script" in process.env && process.env.npm_lifecycle_script.includes("nodemon"));
}

export function isNode() {
    return "NODE" in process.env;
}

/**
 * Turn an object into an envfile string
 * Copied from https://github.com/bevry/envfile
 */
function stringifyDotEnv(obj) {
    let result = "";
    for (const [key, value] of Object.entries(obj)) {
        if (key) {
            const line = `${key}=${String(value)}`;
            result += line + "\n";
        }
    }
    return result;
}

/**
 * Write a new key-value to .env file
 * Note: assumes in Nodemon, pm2 or PKG mode.
 */
export function writeVariableToEnvFile(absoluteEnvPath, variableKey, jsonObject) {
    if (isDocker()) {
        logger.error("Tried to persist setting to .env in docker mode. Avoided that.");
        return;
    }
    const latestDotEnvConfig = dotenv.config();
    if (latestDotEnvConfig?.error) {
        logger.warning("Error occurred ready .env config. Creating .env file for you");
    } else if (!!latestDotEnvConfig.error) {
        logger.error(JSON.stringify(latestDotEnvConfig.error));
        throw new Error("Could not parse current .env file. Please ensure the file contains lines with each looking like 'MONGO=http://mongo/3pdf' and 'SERVER_PORT=4000' and so on.");
    }
    const newDotEnv = {
        ...latestDotEnvConfig.parsed,
        [variableKey]: jsonObject
    };
    const dotEnvResult = stringifyDotEnv(newDotEnv);
    fs.writeFileSync(absoluteEnvPath, dotEnvResult);
}

export function verifyPackageJsonRequirements(rootPath) {
    const dirConts = fs.readdirSync(rootPath);
    const hasPackageJson = dirConts.includes("package.json");
    if (!hasPackageJson) {
        logger.error(`FAILURE. Could not find 'package.json' in root folder ${rootPath}`);
        return false;
    } else {
        logger.debug("✓ found 'package.json'");
        const packageName = packageJson.name;
        if (!packageName) {
            logger.error("X Could not find 'name' property in package.json file. Aborting 3DH Server.");
            return false;
        } else if (packageName.toLowerCase() !== "fdm-monster") {
            logger.error(`X property 'name' in package.json file didnt equal 'fdm-monster' (found: ${packageName.toLowerCase()}). Aborting 3DH Server.`);
            return false;
        }
    }
    logger.debug("✓ Correctly validated 3DH package.json file!");
    return true;
}