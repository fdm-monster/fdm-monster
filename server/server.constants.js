module.exports = {
  AppConstants: {
    NON_NPM_MODE_KEY: "NON_NPM_MODE",
    NODE_ENV_KEY: "NODE_ENV",
    VERSION_KEY: "npm_package_version",
    SERVER_PORT_KEY: "SERVER_PORT",
    MONGO_KEY: "MONGO",

    pm2ServiceName: "FDM",

    SERVER_SITE_TITLE_KEY: "SERVER_SITE_TITLE",
    titleShort: "FDM",
    defaultServerPageTitle: "FDM Monster",
    defaultFileStorageFolder: "./file-storage",
    defaultServerPort: 4000,
    defaultMongoStringUnauthenticated: "mongodb://127.0.0.1:27017/fdm-monster",
    apiRoute: "/api",
    CONTENT_SECURITY_POLICY_ENABLED: "CONTENT_SECURITY_POLICY_ENABLED",
    OVERRIDE_VUE_DIST: process.env["OVERRIDE_VUE_DIST"],

    defaultTestEnv: "test",
    defaultProductionEnv: "production",
    knownEnvNames: ["development", "production", "test"],
    clientPackageName: "@fdm-monster/client",
    serverPath: "./",

    influxUrl: "INFLUX_URL",
    influxToken: "INFLUX_TOKEN",
    influxOrg: "INFLUX_ORG",
    influxBucket: "INFLUX_BUCKET",
  },
};
