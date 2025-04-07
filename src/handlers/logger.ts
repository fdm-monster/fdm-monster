import winston from "winston";
import { join } from "path";
import { DateTime } from "luxon";
import { AppConstants } from "@/server.constants";
import { superRootPath } from "@/utils/fs.utils";

const dtFormat = new Intl.DateTimeFormat("en-GB", {
  timeStyle: "medium",
  dateStyle: "short",
  timeZone: "UTC",
});

const dateFormat = () => {
  return dtFormat.format(new Date());
};

export class LoggerService {
  name: string;
  logger: winston.Logger;

  constructor(name: string, enableFileLogs = true, logFilterLevel: string = "") {
    const isProd = process.env[AppConstants.NODE_ENV_KEY] === AppConstants.defaultProductionEnv;
    const isTest = process.env[AppConstants.NODE_ENV_KEY] === AppConstants.defaultTestEnv;

    if (!logFilterLevel) {
      logFilterLevel = isProd || isTest ? "warn" : "info";
    }

    const date = DateTime.now().toISODate();
    this.name = name;
    this.logger = winston.createLogger({
      transports: [
        new winston.transports.Console({
          level: logFilterLevel,
        }),
        ...(enableFileLogs
          ? [
              new winston.transports.File({
                level: isTest ? "warn" : "info", // Irrespective of environment
                filename: join(
                  superRootPath(),
                  AppConstants.defaultLogsFolder,
                  `${AppConstants.logAppName}-${date}.log`,
                ),
                maxsize: 5000000,
                maxFiles: 5,
              }),
            ]
          : []),
      ],
      format: winston.format.printf((info) => {
        const level = info.level.toUpperCase();
        const date = dateFormat();
        let message = `${date} | ${level} | ${name} | ${info.message}`;
        message = info.meta ? message + ` - ${JSON.stringify(info.meta)}` : message;
        return message;
      }),
    });
  }

  log(message: string, meta?: any) {
    this.logger.log("info", message, {
      meta,
    });
  }

  warn(message: string, meta?: any) {
    this.logger.log("warn", message, {
      meta,
    });
  }

  debug(message: string, meta?: any) {
    this.logger.log("debug", message, {
      meta,
    });
  }

  error(message: string, meta?: any) {
    this.logger.log("error", message, { meta });
  }
}
