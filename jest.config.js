module.exports = {
  transform: {
    "^.+\\.(t|j)sx?$": "@swc/jest",
  },
  testEnvironment: "node",
  testTimeout: 2500,
  rootDir: ".",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/server/$1",
  },
  modulePathIgnorePatterns: [
    "server/migrate-mongo-config.js",
    ".eslintrc.js",
    "server/assets",
    "coverage",
    "server/docker",
    "node_modules",
    "media",
    "installations",
  ],
  globalSetup: "./test/setup-global.ts",
  setupFilesAfterEnv: ["jest-27-expect-message", "./test/setup-after-env.ts"],
  collectCoverageFrom: ["./server/**/*", "./server/mongo-migrations/"],
  coveragePathIgnorePatterns: ["installations", "node_modules", "test"],
  coverageReporters: ["clover", "json", "lcov", "text", "@lcov-viewer/istanbul-report"],
};
