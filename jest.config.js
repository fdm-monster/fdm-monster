module.exports = {
  transform: {
    "^.+\\.(t|j)sx?$": "@swc/jest",
  },
  testEnvironment: "node",
  testTimeout: 2500,
  rootDir: "./test",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/../server/$1",
  },
  modulePathIgnorePatterns: [
    "server/migrate-mongo-config.ts",
    ".eslintrc.js",
    "server/assets",
    "coverage",
    "server/docker",
    "node_modules",
    "media",
    "installations",
  ],
  globalSetup: "./setup-global.ts",
  setupFilesAfterEnv: ["jest-27-expect-message", "./setup-after-env.ts"],
  collectCoverageFrom: ["server/**/*.js", "server/**/*.ts"],
  coveragePathIgnorePatterns: ["installations", "node_modules", "test"],
  coverageReporters: ["clover", "json", "lcov", "text", "@lcov-viewer/istanbul-report"],
};
