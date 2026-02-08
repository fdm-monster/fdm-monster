export default {
  transform: {
    "^.+\\.(t|j)sx?$": [
      "@swc/jest",
      {
        swcrc: false,
        configFile: "./.swcrc-test",
      },
    ],
  },
  transformIgnorePatterns: [
    "node_modules/(?!lodash-es)"
  ],
  testEnvironment: "node",
  testTimeout: 5000,
  rootDir: ".",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  modulePathIgnorePatterns: [
    "src/consoles",
    ".eslintrc.js",
    "coverage",
    "docker",
    "node_modules",
    "media",
    "setups",
  ],
  globalSetup: "./test/setup-global.ts",
  setupFilesAfterEnv: ["jest-27-expect-message", "./test/setup-after-env.ts"],
  collectCoverageFrom: ["./src/**/*.ts"],
  coveragePathIgnorePatterns: ["node_modules", "test"],
  coverageReporters: ["clover", "json", "lcov", "text", "@lcov-viewer/istanbul-report"],
};
