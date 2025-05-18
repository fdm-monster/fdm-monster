import { LoggerService } from "./logger";

export type ILoggerFactory = (name: string) => LoggerService;

export function LoggerFactory(): ILoggerFactory {
  return (name: string) => {
    return new LoggerService(name);
  };
}
