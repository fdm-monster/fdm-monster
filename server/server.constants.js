class ServerConstants {
  static get apiRoute() {
    return "/api";
  }

  static get defaultMongoStringUnauthenticated() {
    return "mongodb://127.0.0.1:27017/3dhub";
  }

  static get defaultServerPort() {
    return 4000;
  }

  static get defaultFileUploadFolder() {
    return "./file-uploads";
  }

  static get defaultFileStorageFolder() {
    return "file-storage";
  }

  static get defaultServerPageTitle() {
    return "3D Hub";
  }

  static get knownEnvNames() {
    return ["development", "production", "test"];
  }

  static get defaultProductionEnv() {
    return "production";
  }

  static get defaultTestEnv() {
    return "test";
  }

  static get VERSION_KEY() {
    return "npm_package_version";
  }

  static get OVERRIDE_VUE_DIST() {
    return process.env["OVERRIDE_VUE_DIST"];
  }

  static get CONTENT_SECURITY_POLICY_ENABLED() {
    return "CONTENT_SECURITY_POLICY_ENABLED";
  }

  static get NODE_ENV_KEY() {
    return "NODE_ENV";
  }

  static get MONGO_KEY() {
    return "MONGO";
  }

  static get SERVER_PORT_KEY() {
    return "SERVER_PORT";
  }

  static get NON_NPM_MODE_KEY() {
    return "NON_NPM_MODE";
  }

  static get SERVER_SITE_TITLE_KEY() {
    return "SERVER_SITE_TITLE";
  }
}

module.exports = {
  AppConstants: Object.freeze(ServerConstants)
};
