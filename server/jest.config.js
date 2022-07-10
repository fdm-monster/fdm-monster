module.exports = {
  testEnvironment: "node",
  testTimeout: 5000,
  modulePathIgnorePatterns: [
    "index.js",
    "migrate-mongo-config.js",
    ".eslintrc.js",
    "jest.config.js",
    "assets",
    "coverage",
    "docker",
    "file-storage",
    "node_modules",
    "logs",
    "views"
  ],
  globalSetup: "./test/setup-global.js",
  setupFilesAfterEnv: ["./test/setup-after-env.js"],
  collectCoverageFrom: ["**/*.js"],
  coveragePathIgnorePatterns: ["node_modules", "test"]
};
