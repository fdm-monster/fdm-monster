import { AppConstants } from "@/server.constants";
import dotenv from "dotenv";
import { join } from "node:path";
import { superRootPath } from "@/utils/fs.utils";

if (process.env.NODE_ENV !== "test") {
  dotenv.config({
    path: process.env.ENV_FILE || join(superRootPath(), ".env")
  });
}

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
