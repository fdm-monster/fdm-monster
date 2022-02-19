export const testEnvironment = "node";
export const testTimeout = 5000;
export const modulePathIgnorePatterns = ["server-nest", "client-vue", "client-npm"];
export const globalSetup = "./test/setup-global.js";
export const setupFilesAfterEnv = ["./test/setup-after-env.js"];
export const collectCoverageFrom = ["server/**/*.js"];
export default {
    testEnvironment,
    testTimeout,
    modulePathIgnorePatterns,
    globalSetup,
    setupFilesAfterEnv,
    collectCoverageFrom
};
