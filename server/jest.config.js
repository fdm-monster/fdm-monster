module.exports = {
  testEnvironment: "node",
  testTimeout: 5000,
  modulePathIgnorePatterns: [
    "assets",
    "coverage",
    "docker",
    "file-uploads",
    "node_modules",
    "logs",
    "views"
  ],
  globalSetup: "./test/setup-global.js",
  setupFilesAfterEnv: ["./test/setup-after-env.js"],
  collectCoverageFrom: ["**/*.js"]
};
