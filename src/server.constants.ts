export const AppConstants = {
  NON_NPM_MODE_KEY: "NON_NPM_MODE",
  NODE_ENV_KEY: "NODE_ENV",
  VERSION_KEY: "npm_package_version",
  SERVER_PORT_KEY: "SERVER_PORT",
  MONGO_KEY: "MONGO",

  pm2ServiceName: "FDM",
  logAppName: "fdm-monster",

  // @Deprecated: old storage path
  defaultFileStorageFolder: "./media",
  defaultLogsFolder: "./media/logs",
  defaultLogZipsFolder: "./media/log-zips",
  // New place for all downloads, files etc
  defaultClientBundleStorage: "./media/client-dist",
  defaultClientBundleZipsStorage: "./media/client-dist-zips",
  defaultServerPort: 4000,
  defaultMongoStringUnauthenticated: "mongodb://127.0.0.1:27017/fdm-monster",
  apiRoute: "/api",
  enableClientDistAutoUpdateKey: "ENABLE_CLIENT_DIST_AUTO_UPDATE",

  // Boolean string (true/false), persisted always
  OVERRIDE_LOGIN_REQUIRED: "OVERRIDE_LOGIN_REQUIRED",
  // Boolean string (true/false), persisted always
  OVERRIDE_REGISTRATION_ENABLED: "OVERRIDE_REGISTRATION_ENABLED",
  // Number
  DEFAULT_PASSWORD_MINLEN: 8,
  // String, persisted always
  OVERRIDE_JWT_SECRET: "OVERRIDE_JWT_SECRET",
  // Number, Seconds, persisted always
  OVERRIDE_JWT_EXPIRES_IN: "OVERRIDE_JWT_EXPIRES_IN",
  DEFAULT_JWT_EXPIRES_IN: 60 * 60, // 1 hour
  // Number
  DEFAULT_REFRESH_TOKEN_ATTEMPTS: 50, // 50 attempts, 50 hours
  // Number, Milli-seconds
  DEFAULT_REFRESH_TOKEN_EXPIRY: 1000 * 60 * 60 * 24 * 14, // 14 days (in ms)
  // String, not persisted
  OVERRIDE_JWT_ISSUER: "OVERRIDE_JWT_ISSUER",
  DEFAULT_JWT_ISSUER: "fdm-monster-server",
  // String, not persisted
  OVERRIDE_JWT_AUDIENCE: "OVERRIDE_JWT_AUDIENCE",
  DEFAULT_JWT_AUDIENCE: "fdm-monster-client",

  OVERRIDE_IS_DEMO_MODE: "OVERRIDE_IS_DEMO_MODE",
  OVERRIDE_DEMO_USERNAME: "OVERRIDE_DEMO_USERNAME",
  DEFAULT_DEMO_USERNAME: "demo",
  OVERRIDE_DEMO_PASSWORD: "OVERRIDE_DEMO_PASSWORD",
  DEFAULT_DEMO_PASSWORD: "demo2023",
  OVERRIDE_DEMO_ROLE: "OVERRIDE_DEMO_ROLE",
  DEFAULT_DEMO_ROLE: "ADMIN",

  defaultTestEnv: "test",
  defaultProductionEnv: "production",
  knownEnvNames: ["development", "production", "test"],
  GITHUB_PAT: "GITHUB_PAT",
  serverPackageName: "@fdm-monster/server",
  clientPackageName: "@fdm-monster/client",
  clientRepoName: "fdm-monster-client",
  serverRepoName: "fdm-monster",
  orgName: "fdm-monster",
  // Wizard version changes will trigger a re-run of the wizard
  currentWizardVersion: 1,
  defaultClientMinimum: "1.3.4",

  influxUrl: "INFLUX_URL",
  influxToken: "INFLUX_TOKEN",
  influxOrg: "INFLUX_ORG",
  influxBucket: "INFLUX_BUCKET",

  // Websocket values
  defaultWebsocketHandshakeTimeout: 2000,
  defaultSocketThrottleRate: 1,
  debugSocketStatesKey: "DEBUG_SOCKET_STATES",
  defaultDebugSocketStates: "false",

  // Future experimental feature
  enableMqttAutoDiscoveryToken: "ENABLE_MQTT_AUTODISCOVERY",
  enableMqttAutoDiscoveryDefault: "false",
  mqttUrlToken: "MQTT_HOST",
  mqttPortToken: "MQTT_PORT",
  mqttPortDefault: 1883,
  mqttUsernameToken: "MQTT_USERNAME",
  mqttPasswordToken: "MQTT_PASSWORD",

  // Sentry
  sentryCustomDsnToken: "SENTRY_CUSTOM_DSN",
  sentryCustomDsnDefault: "https://164b8028a8a745bba3dbcab991b84ae7@o4503975545733120.ingest.sentry.io/4505101598261248",
};
