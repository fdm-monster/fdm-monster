import { captureException } from "@sentry/node";
import { existsSync, readFileSync } from "fs";
import { LoggerService } from "@/handlers/logger";
import { AppConstants } from "@/server.constants";

export class MonsterPiService {
  private fileLocation = AppConstants.monsterPiFilePath;
  monsterPiVersion: string | null = null;
  logger;

  constructor({ loggerFactory }: { loggerFactory: (name: string) => LoggerService }) {
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
