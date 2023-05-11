const AppConstants = {
  NON_NPM_MODE_KEY: "NON_NPM_MODE",
  NODE_ENV_KEY: "NODE_ENV",
  VERSION_KEY: "npm_package_version",
  SERVER_PORT_KEY: "SERVER_PORT",
  MONGO_KEY: "MONGO",

  pm2ServiceName: "FDM",

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

  // Future experimental feature
  enableMqttAutoDiscoveryToken: "ENABLE_MQTT_AUTODISCOVERY",
  enableMqttAutoDiscoveryDefault: "false",
  mqttUrlToken: "MQTT_HOST",
  mqttPortToken: "MQTT_PORT",
  mqttPortDefault: 1883,
  mqttUsernameToken: "MQTT_USERNAME",
  mqttPasswordToken: "MQTT_PASSWORD",

  // Sentry
  sentryEnabledToken: "SENTRY_ENABLED",
  sentryEnabledDefault: "false",
  sentryCustomDsnToken: "SENTRY_CUSTOM_DSN",
  sentryCustomDsnDefault: "https://164b8028a8a745bba3dbcab991b84ae7@o4503975545733120.ingest.sentry.io/4505101598261248",
};

module.exports = {
  AppConstants,
};
