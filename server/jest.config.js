module.exports = {
  testEnvironment: "node",
  testTimeout: 5000,
  modulePathIgnorePatterns: ["server-nest", "client-vue", "client-npm"],
  globalSetup: "./test/setup-global.js",
  setupFilesAfterEnv: ["./test/setup-after-env.js"],
  collectCoverageFrom: ["server/**/*.js"]
};
