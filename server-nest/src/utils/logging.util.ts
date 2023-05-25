import { format, transports } from "winston";
import { utilities as nestWinstonModuleUtilities } from "nest-winston/dist/winston.utilities";
import { WinstonModule } from "nest-winston";
import { inspect } from "util";
import { dateFormat, isProduction } from "@/utils/env.utils";
import { DateTime } from "luxon";
import { defaultDevelopmentLogLevel, defaultProductionLogLevel, logLevelToken } from "@/app.constants";

const skippedServices = ["RouterExplorer", "RoutesResolver", "InstanceLoader"];
const ignoreWhenTrue = format((info, opts) => {
  skippedServices.includes(info.context);
  if (skippedServices.includes(info.context)) {
    return false;
  }
  return info;
});

export const getWinstonConsoleFormat = (appName) =>
  format.combine(
    ignoreWhenTrue(),
    format.timestamp(),
    format.ms(),
    nestWinstonModuleUtilities.format.nestLike(appName, {
      prettyPrint: true,
      colors: true,
    })
  );

export function createCustomLogger(logAppName: string) {
  const date = DateTime.now().toISODate();
  return WinstonModule.createLogger({
    transports: [
      new transports.Console({
        format: getWinstonConsoleFormat(logAppName),
      }),

      new transports.File({
        level: process.env[logLevelToken] || isProduction() ? defaultProductionLogLevel : defaultDevelopmentLogLevel,
        filename: `./logs/${logAppName}-${date}.log`,
        maxsize: 5000000,
        maxFiles: 5,
        format: format.combine(
          ignoreWhenTrue(),
          format.printf(({ context, level, message, ms, ...meta }) => {
            let metaStr;
            try {
              metaStr = JSON.parse(JSON.stringify(meta));
            } catch (e) {
              metaStr = { error: "Could not serialize error" };
            }
            const formattedMeta = inspect(metaStr, {
              colors: true,
              depth: null,
            });

            const metaString = meta && formattedMeta?.length > 2 ? ` (${formattedMeta})` : "";
            const msString = ms ? ` [${ms}ms]` : "";
            const date = dateFormat();
            return `[${logAppName}] ${level.toUpperCase()} ${date} [${context}] ${message}${metaString}${msString}`;
          })
        ),
      }),
    ],
  });
}
