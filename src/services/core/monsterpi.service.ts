import { captureException } from "@sentry/node";
import { existsSync, readFileSync } from "fs";
import { AppConstants } from "@/server.constants";
import { ILoggerFactory } from "@/handlers/logger-factory";

export class MonsterPiService {
  monsterPiVersion: string | null = null;
  logger;
  private fileLocation = AppConstants.monsterPiFilePath;

  constructor({ loggerFactory }: { loggerFactory: ILoggerFactory }) {
    this.logger = loggerFactory(MonsterPiService.name);
  }

  getMonsterPiVersionSafe() {
    const fileExists = existsSync(this.fileLocation);
    if (!fileExists) {
      return null;
    }

    try {
      const contents = readFileSync(this.fileLocation);
      this.monsterPiVersion = contents.toString().replaceAll(" ", "");
      return this.monsterPiVersion;
    } catch (e) {
      this.logger.warn("Error checking MonsterPi version");
      captureException(e);
    }
    return null;
  }
}
