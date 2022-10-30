import { D, Y } from "@/utils/logging.util";
import { LoggerService } from "@nestjs/common";
import { portToken } from "@/app.constants";

export function printPreBootMessage(logger: LoggerService, error = null) {
  logger.log(`FDM Monster ${Y}v${process.env.npm_package_version}${D}`);
  logger.log(`NodeJS ${Y}${process.version}${D}`);
  const startDate = new Date().toDateString();
  const startTime = new Date().toLocaleTimeString();
  const startMoment = `at ${Y}${startTime}${D} on ${Y}${startDate}${D}`;
  logger.log(`Booted ${startMoment}!`);
}

export function printPostBootMessage(logger: LoggerService) {
  logger.log(`Server is listening on port ${process.env[portToken]}`);
  logger.log(`${Y}Happy printing!${D}`);
}
