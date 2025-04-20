import winston from "winston";
import { join } from "path";
import { DateTime } from "luxon";
import { AppConstants } from "@/server.constants";
import { superRootPath } from "@/utils/fs.utils";
import LokiTransport from "winston-loki";

const levelMap: Record<string, string> = {
  error: "ERR",
  warn: "WRN",
  info: "INF",
  debug: "DBG",
  http: "HTT",
  verbose: "VRB",
  silly: "SLY",
};

const lokiLineClassProperty = "class";

export class LoggerService {
  name: string;
  logger: winston.Logger;

  constructor(name: string, enableFileLogs = true, logFilterLevel: string = "") {
    const isProd = process.env[AppConstants.NODE_ENV_KEY] === AppConstants.defaultProductionEnv;
    const isTest = process.env[AppConstants.NODE_ENV_KEY] === AppConstants.defaultTestEnv;

    // Set default log level if not provided
    let effectiveLogLevel = logFilterLevel;
    if (!effectiveLogLevel) {
      effectiveLogLevel = isProd || isTest ? "warn" : "debug";
    }

    this.name = name;
    this.logger = winston.createLogger({
      transports: [
        new LokiTransport({
          level: effectiveLogLevel,
          host: "http://127.0.0.1:3100",
          interval: 5,
          timeout: 30000,
          // These formatting settings plays well with Loki/Grafana
          labels: {
            app: "fdm-monster-server",
          },
          json: false,
          useWinstonMetaAsLabels: false,
          format: winston.format.json(),
        }),
        // Always include console transport
        new winston.transports.Console({
          level: effectiveLogLevel,
          format: winston.format.combine(
            // Store the original level before colorization
            winston.format((info) => {
              info.rawLevel = info.level;
              return info;
            })(),
            winston.format.colorize({
              colors: {
                error: "red",
                warn: "yellow",
                info: "white",
                debug: "gray",
                http: "magenta",
                verbose: "cyan",
                silly: "gray",
              },
              level: true,
              message: true, // Don't colorize the whole message
              all: false,
            }),
            winston.format.printf((info) => {
              // Format timestamp similar to Serilog (ISO with milliseconds)
              const now = new Date();
              const timestamp = `${now.toISOString().split("T")[0]} ${now.toTimeString().split(" ")[0]}.${now.getMilliseconds().toString().padStart(3, "0")}`;

              // Get colored level from winston
              // @ts-ignore
              const levelAbbr = levelMap[info.rawLevel] || info.rawLevel.substring(0, 3).toUpperCase();

              // Apply custom coloring using ANSI color codes
              const gray = "\x1b[90m"; // Dim/gray
              const reset = (info.message as string).substring(0, 5) ?? "\x1b[0m"; // Reset
              const numberRegex = /\b\d+\b/g;

              // Apply purple color to numbers in the message
              const coloredMessage = (info.message as string).replace(numberRegex, match => `\x1b[35m${match}${reset}`);

              // Format the log entry with gray timestamp and brackets, colored level, and message with purple numbers
              let logEntry = `${gray}[${timestamp} ${reset}${levelAbbr}${reset}${gray}]${reset} ${gray}[${reset}${name}${gray}]${reset} ${coloredMessage}`;

              // Add metadata if present
              if (info.meta) {
                // Add metadata with numbers colorized in purple
                const metaString = JSON.stringify(info.meta);
                const coloredMeta = metaString.replace(numberRegex, match => `\x1b[35m${match}${reset}`);
                logEntry += ` ${coloredMeta}`;
              }

              return logEntry;
            }),
          ),
        }),
      ],
      format: winston.format.printf((info) => {
        // Format timestamp similar to Serilog (ISO with milliseconds)
        const now = new Date();
        const timestamp = `${now.toISOString().split("T")[0]} ${now.toTimeString().split(" ")[0]}.${now.getMilliseconds().toString().padStart(3, "0")}`;

        const levelAbbr = levelMap[info.level] || `[${info.level.substring(0, 3).toUpperCase()}]`;

        let message = `[${timestamp} ${levelAbbr}] [${name}] ${info.message}`;

        // Add metadata if present, without dash separator
        if (info.meta) {
          // Convert camelCase to PascalCase for C# style
          const pascalCaseMeta = Object.entries(info.meta).reduce((acc, [key, value]) => {
            const pascalKey = key.charAt(0).toUpperCase() + key.slice(1);
            acc[pascalKey] = value;
            return acc;
          }, {} as Record<string, any>);

          message += ` ${JSON.stringify(pascalCaseMeta)}`;
        }

        return message;
      }),
    });

    if (enableFileLogs) {
      const date = DateTime.now().toISODate();
      const logFilePath = join(
        superRootPath(),
        AppConstants.defaultLogsFolder,
        `${AppConstants.logAppName}-${date}.log`,
      );

      this.logger.add(
        new winston.transports.File({
          level: isTest ? "warn" : "info",
          filename: logFilePath,
          maxsize: 5000000,
          maxFiles: 5,
        }),
      );
    }
  }

  newDebug(object: any) {
    this.logger.debug({
      ...object,
      [lokiLineClassProperty]: this.name,
    });
  }

  log(message: string, meta?: any) {
    const enrichedMeta = {
      ...meta,
      [lokiLineClassProperty]: this.name,
    };
    this.logger.log("info", message, enrichedMeta);
  }

  warn(message: string, meta?: any) {
    const enrichedMeta = {
      ...meta,
      [lokiLineClassProperty]: this.name,
    };
    this.logger.log("warn", message, enrichedMeta);
  }

  debug(message: string, meta?: any) {
    const enrichedMeta = {
      ...meta,
      [lokiLineClassProperty]: this.name,
    };
    this.logger.log("debug", message, enrichedMeta);
  }

  error(message: string, meta?: any) {
    const enrichedMeta = {
      ...meta,
      [lokiLineClassProperty]: this.name,
    };
    this.logger.log("error", message, enrichedMeta);
  }
}
