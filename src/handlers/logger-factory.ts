import { LoggerService } from "./logger";

export type ILoggerFactory = (name: string, logToFile?: boolean, logLevel?: string) => LoggerService;

export function LoggerFactory(): ILoggerFactory {
  return (name: string, logToFile?: boolean, logLevel?: string) => {
    return new LoggerService(name, logToFile, logLevel);
  };
}
