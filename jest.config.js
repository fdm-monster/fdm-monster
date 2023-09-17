module.exports = {
  transform: {
    "^.+\\.(t|j)sx?$": "@swc/jest",
  },
  testEnvironment: "node",
  testTimeout: 2500,
  rootDir: ".",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  modulePathIgnorePatterns: [
    "src/migrate-mongo-config.js",
    ".eslintrc.js",
    "src/assets",
    "coverage",
    "docker",
    "node_modules",
    "media",
    "installations",
  ],
  globalSetup: "./test/setup-global.ts",
  setupFilesAfterEnv: ["jest-27-expect-message", "./test/setup-after-env.ts"],
  collectCoverageFrom: ["./src/**/*.ts"],
  coveragePathIgnorePatterns: ["installations", "node_modules", "test", "src/mongo-migrations"],
  coverageReporters: ["clover", "json", "lcov", "text", "@lcov-viewer/istanbul-report"],
};
