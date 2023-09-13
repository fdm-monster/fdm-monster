import { LoggerService } from "@nestjs/common";
import { portToken } from "@/app.constants";

export function printPreBootMessage(logger: LoggerService) {
  logger.log(`Server version v${process.env.npm_package_version}`);
  logger.log(`NodeJS ${process.version}`);
  const startDate = new Date().toDateString();
  const startTime = new Date().toLocaleTimeString();
  const startMoment = `at ${startTime} on ${startDate}`;
  logger.log(`Booted ${startMoment}!`);
}

export function printPostBootMessage(logger: LoggerService) {
  logger.log(`Server is listening on port ${process.env[portToken]}`);
}
