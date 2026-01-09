import { AppConstants } from "@/server.constants";

export function getEnvOrDefault<T>(key: string, defaultValue: T) {
  if (!Object.keys(process.env).includes(key) || !process.env[key]?.length) {
    return defaultValue;
  }
  return process.env[key] as T;
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
