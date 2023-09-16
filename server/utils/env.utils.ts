const fs = require("fs");
const Logger = require("../handlers/logger.js");
const dotenv = require("dotenv");
const { isDocker } = require("./is-docker");
const { AppConstants } = require("../server.constants");

const logger = new Logger("Utils-Env", false);

function getEnvOrDefault(key, defaultVal) {
  const val = process.env[key];
  if (!val?.length) return defaultVal;
  return val;
}

function isTestEnvironment() {
  return process.env.NODE_ENV === AppConstants.defaultTestEnv;
}

function isProductionEnvironment() {
  return process.env.NODE_ENV === AppConstants.defaultProductionEnv;
}

function isPm2() {
  return "PM2_HOME" in process.env || "PM2_JSON_PROCESSING" in process.env || "PM2_CLI" in process.env;
}

export function isNodemon() {
  return "npm_lifecycle_script" in process.env && process.env.npm_lifecycle_script.includes("nodemon");
}

function isNode() {
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
function writeVariableToEnvFile(absoluteEnvPath, variableKey, jsonObject) {
  if (isDocker()) {
    logger.error("Tried to persist setting to .env in docker mode. Avoided that.");
    return;
  }
  const latestDotEnvConfig = dotenv.config();
  if (latestDotEnvConfig?.error?.code === "ENOENT") {
    logger.warn("Creating .env file for you as it was not found.");
  } else if (!!latestDotEnvConfig.error) {
    logger.error(JSON.stringify(latestDotEnvConfig.error));
    throw new Error(
      "Could not parse current .env file. Please ensure the file contains lines with each looking like 'MONGO=http://mongo/3pdf' and 'SERVER_PORT=4000' and so on."
    );
  }

  const newDotEnv = {
    ...latestDotEnvConfig.parsed,
    [variableKey]: jsonObject,
  };

  const dotEnvResult = stringifyDotEnv(newDotEnv);
  fs.writeFileSync(absoluteEnvPath, dotEnvResult);
}

function verifyPackageJsonRequirements(rootPath) {
  const dirConts = fs.readdirSync(rootPath);
  const hasPackageJson = dirConts.includes("package.json");
  if (!hasPackageJson) {
    logger.error(`FAILURE. Could not find 'package.json' in root folder ${rootPath}`);
    return false;
  } else {
    logger.debug("✓ found 'package.json'");
    const packageName = require("../package.json").name;
    if (!packageName) {
      logger.error("X Could not find 'name' property in package.json file. Aborting FDM Server.");
      return false;
    } else if (packageName.toLowerCase() !== "fdm-monster") {
      logger.error(
        `X property 'name' in package.json file didnt equal 'fdm-monster' (found: ${packageName.toLowerCase()}). Aborting FDM Server.`
      );
      return false;
    }
  }
  logger.debug("✓ Correctly validated FDM package.json file!");
  return true;
}

export {
  isTestEnvironment,
  isProductionEnvironment,
  isPm2,
  isNode,
  writeVariableToEnvFile,
  verifyPackageJsonRequirements,
  getEnvOrDefault,
};
