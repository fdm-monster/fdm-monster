import { format, transports } from "winston";
import { utilities as nestWinstonModuleUtilities } from "nest-winston/dist/winston.utilities";
import { WinstonModule } from "nest-winston";
import { inspect } from "util";
import { dateFormat, isProduction } from "@/utils/env.utils";

export const Y = "\x1b[33m";
export const D = "\x1b[0m";

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
      colors: true
    })
  );

export function createCustomLogger(logAppName: string) {
  return WinstonModule.createLogger({
    transports: [
      new transports.Console({
        format: getWinstonConsoleFormat(logAppName)
      }),

      new transports.File({
        level: isProduction() ? "warn" : "info",
        filename: `./logs/${logAppName}.log`,
        maxsize: 5000000,
        maxFiles: 5,
        format: format.combine(
          ignoreWhenTrue(),
          format.printf(({ context, level, message, ms, ...meta }) => {
            const formattedMeta = inspect(JSON.parse(JSON.stringify(meta)), {
              colors: true,
              depth: null
            });

            const metaString = meta && formattedMeta?.length > 2 ? ` (${formattedMeta})` : "";
            const msString = ms ? ` [${ms}ms]` : "";
            const date = dateFormat();
            return `[${logAppName}] ${level.toUpperCase()} ${date} [${context}] ${message}${metaString}${msString}`;
          })
        )
      })
    ]
  });
}
