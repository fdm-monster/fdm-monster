import { DateTime } from "luxon";
import { join } from "node:path";
import { getMediaPath } from "@/utils/fs.utils";
import { AppConstants } from "@/server.constants";
import winston from "winston";

export interface FileLoggerOptions {
  enabled: boolean;
  isTest: boolean;
}

export function createFileLoggingTransport(options: FileLoggerOptions): winston.transport | undefined {
  if (!options.enabled) {
    return;
  }

  const date = DateTime.now().toISODate();
  const logFilePath = join(getMediaPath(), AppConstants.defaultLogsFolder, `${AppConstants.logAppName}-${date}.log`);

  return new winston.transports.File({
    level: options.isTest ? "warn" : "info",
    filename: logFilePath,
    maxsize: 5000000,
    maxFiles: 5,
  });
}
