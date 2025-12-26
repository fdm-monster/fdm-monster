import winston from "winston";
import process from "node:process";
import { AppConstants } from "@/server.constants";
import { createLokiLoggingTransport } from "@/handlers/logging/loki-logging.transport";
import { createFileLoggingTransport } from "@/handlers/logging/file-logging.transport";
import { isDevelopmentEnvironment } from "@/utils/env.utils";

let staticLogger: winston.Logger | null = null;

export interface StaticLoggerConfig {
  enableFileLogs: boolean;
}

const levelMap: Record<string, string> = {
  error: "ERR",
  warn: "WRN",
  info: "INF",
  debug: "DBG",
  http: "HTT",
  verbose: "VRB",
  silly: "SLY",
};

export const logContextClassProperty = "class";

export function getStaticLogger() {
  if (!staticLogger) {
    throw new Error("Logger not yet initialized.");
  }

  return staticLogger;
}

export function createStaticLogger(config: StaticLoggerConfig) {
  if (staticLogger) {
    return;
  }

  const isProd = process.env[AppConstants.NODE_ENV_KEY] === AppConstants.defaultProductionEnv;
  const isTest = process.env[AppConstants.NODE_ENV_KEY] === AppConstants.defaultTestEnv;

  const effectiveLogLevel = isProd || isTest ? "warn" : "debug";

  const lokiTransport = createLokiLoggingTransport({
    logLevel: effectiveLogLevel,
  });

  const extraWinstonTransports: winston.transport[] = [];
  if (lokiTransport) {
    extraWinstonTransports.push(lokiTransport);
  }

  const fileLoggerTransport = createFileLoggingTransport({
    enabled: config.enableFileLogs,
    isTest,
  });
  if (fileLoggerTransport) {
    extraWinstonTransports.push(fileLoggerTransport);
  }

  staticLogger = winston.createLogger({
    transports: [
      ...extraWinstonTransports,
      // Always include console transport
      new winston.transports.Console({
        level: effectiveLogLevel,
        format: winston.format.combine(
          ...(isDevelopmentEnvironment() && process.env[AppConstants.ENABLE_COLORED_LOGS_KEY] == "true"
            ? [
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
                  const levelAbbr = levelMap[info.rawLevel] ?? info.rawLevel.substring(0, 3).toUpperCase();

                  // Apply custom coloring using ANSI color codes
                  const gray = "\x1b[90m"; // Dim/gray
                  const reset = (info.message as string).substring(0, 5) ?? "\x1b[0m"; // Reset
                  const numberRegex = /\b\d+\b/g;

                  // Apply purple color to numbers in the message
                  const coloredMessage = (info.message as string).replace(
                    numberRegex,
                    (match) => `\x1b[35m${match}${reset}`,
                  );

                  const serviceName = info[logContextClassProperty] ?? "unknown";

                  // Format the log entry with gray timestamp and brackets, colored level, and message with purple numbers
                  let logEntry = `${gray}[${timestamp} ${reset}${levelAbbr}${reset}${gray}]${reset} ${gray}[${reset}${serviceName}${gray}]${reset} ${coloredMessage}`;

                  // Add metadata if present
                  if (info.meta) {
                    // Add metadata with numbers colorized in purple
                    const metaString = JSON.stringify(info.meta);
                    const coloredMeta = metaString.replace(numberRegex, (match) => `\x1b[35m${match}${reset}`);
                    logEntry += ` ${coloredMeta}`;
                  }

                  return logEntry;
                }),
              ]
            : []),
        ),
      }),
    ],
    format: winston.format.printf((info) => {
      // Format timestamp similar to Serilog (ISO with milliseconds)
      const now = new Date();
      const timestamp = `${now.toISOString().split("T")[0]} ${now.toTimeString().split(" ")[0]}.${now.getMilliseconds().toString().padStart(3, "0")}`;

      const levelAbbr = levelMap[info.level] || `[${info.level.substring(0, 3).toUpperCase()}]`;

      const serviceName = info[logContextClassProperty] ?? "unknown";
      let message = `[${timestamp} ${levelAbbr}] [${serviceName}] ${info.message}`;

      // Add metadata if present, without dash separator
      if (info.meta) {
        // Convert camelCase to PascalCase for C# style
        const pascalCaseMeta = Object.entries(info.meta).reduce(
          (acc, [key, value]) => {
            const pascalKey = key.charAt(0).toUpperCase() + key.slice(1);
            acc[pascalKey] = value;
            return acc;
          },
          {} as Record<string, any>,
        );

        message += ` ${JSON.stringify(pascalCaseMeta)}`;
      }

      return message;
    }),
  });
}
