const MONGO_KEY = "MONGO";
const SERVER_PORT_KEY = "SERVER_PORT";
const NON_NPM_MODE_KEY = "NON_NPM_MODE";
const SERVER_SITE_TITLE_KEY = "SERVER_SITE_TITLE";
const NODE_ENV_KEY = "NODE_ENV";

const VERSION_KEY = "npm_package_version";

const defaultMongoStringUnauthenticated = "mongodb://127.0.0.1:27017/octofarm";
const defaultServerPort = 4000;
const defaultServerPageTitle = "OctoFarm";
const defaultProductionEnv = "production";
const defaultTestEnv = "test";
const knownEnvNames = ["development", "production", "test"];

// Make sure the client is up to date with this
const jsonStringify = true;

const apiRoute = "/api";

class AppConstants {
  static get jsonStringify() {
    return jsonStringify;
  }

  static get apiRoute() {
    return apiRoute;
  }

  static get defaultMongoStringUnauthenticated() {
    return defaultMongoStringUnauthenticated;
  }

  static get defaultServerPort() {
    return defaultServerPort;
  }

  static get defaultServerPageTitle() {
    return defaultServerPageTitle;
  }

  static get knownEnvNames() {
    return knownEnvNames;
  }

  static get defaultProductionEnv() {
    return defaultProductionEnv;
  }

  static get defaultTestEnv() {
    return defaultTestEnv;
  }

  static get VERSION_KEY() {
    return VERSION_KEY;
  }

  static get NODE_ENV_KEY() {
    return NODE_ENV_KEY;
  }

  static get MONGO_KEY() {
    return MONGO_KEY;
  }

  static get SERVER_PORT_KEY() {
    return SERVER_PORT_KEY;
  }

  static get NON_NPM_MODE_KEY() {
    return NON_NPM_MODE_KEY;
  }

  static get SERVER_SITE_TITLE_KEY() {
    return SERVER_SITE_TITLE_KEY;
  }
}

module.exports = {
  AppConstants
};
