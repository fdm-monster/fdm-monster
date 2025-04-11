import { AppConstants } from "@/server.constants";

export function getEnvOrDefault(key: any, defaultVal: any) {
  const val = process.env[key];
  if (!val?.length) return defaultVal;
  return val;
}

export function isDevelopmentEnvironment() {
  return process.env.NODE_ENV === AppConstants.defaultDevelopmentEnv;
}

export function isTestEnvironment() {
  return process.env.NODE_ENV === AppConstants.defaultTestEnv;
}

export function isProductionEnvironment() {
  return process.env.NODE_ENV === AppConstants.defaultProductionEnv;
}

export function isNode() {
  return "NODE" in process.env;
}
