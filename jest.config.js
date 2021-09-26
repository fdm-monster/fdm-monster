module.exports = {
  testEnvironment: "node",
  testTimeout: 5000,
  modulePathIgnorePatterns: ["server_2x", "client-octofarm"],
  globalSetup: "./test/setup-global.js",
  setupFilesAfterEnv: ["./test/setup-after-env.js"]
};
