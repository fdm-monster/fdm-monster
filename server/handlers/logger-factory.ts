import { LoggerService } from "./logger";

export function LoggerFactory() {
  return (name: string, logToFile: boolean, logLevel: string) => {
    return new LoggerService(name, logToFile, logLevel);
  };
}
