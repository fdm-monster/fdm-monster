import winston from "winston";
import { getStaticLogger, logContextClassProperty } from "@/handlers/logging/static.logger";

export class LoggerService {
  logger: winston.Logger;

  constructor(private readonly name: string) {
    this.logger = getStaticLogger().child({ [logContextClassProperty]: this.name });
  }

  newDebug(object: any) {
    this.logger.debug(object);
  }

  log(message: string, meta?: any) {
    this.logger.log("info", message, meta);
  }

  warn(message: string, meta?: any) {
    this.logger.log("warn", message, meta);
  }

  debug(message: string, meta?: any) {
    this.logger.log("debug", message, meta);
  }

  error(message: string, meta?: any) {
    this.logger.log("error", message, meta);
  }
}
