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
    // @Deprecated: old storage path
    defaultFileStorageFolder: "./media",
    // New place for all downloads, files etc
    defaultMediaStorage: "./media",
    defaultClientBundleStorage: "./media/client-dist",
    defaultClientBundleZipsStorage: "./media/client-dist-zips",
    defaultServerPort: 4000,
    defaultMongoStringUnauthenticated: "mongodb://127.0.0.1:27017/fdm-monster",
    apiRoute: "/api",

    defaultTestEnv: "test",
    defaultProductionEnv: "production",
    knownEnvNames: ["development", "production", "test"],
    GITHUB_PAT: "GITHUB_PAT",
    clientPackageName: "@fdm-monster/client",
    clientRepoName: "fdm-monster-client",
    clientOrgName: "fdm-monster",
    serverPath: "./",

    influxUrl: "INFLUX_URL",
    influxToken: "INFLUX_TOKEN",
    influxOrg: "INFLUX_ORG",
    influxBucket: "INFLUX_BUCKET",
  },
};
