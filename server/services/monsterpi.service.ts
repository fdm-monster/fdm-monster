const { existsSync, readFileSync } = require("fs");
const { captureException } = require("@sentry/node");

export class MonsterPiService {
  #fileLocation = "/etc/monsterpi_version";
  monsterPiVersion = null;
  logger;

  constructor({ loggerFactory }) {
    this.logger = loggerFactory("MonsterPiService");
  }

  getMonsterPiVersionSafe() {
    const fileExists = existsSync(this.#fileLocation);
    if (!fileExists) {
      return null;
    }

    try {
      const contents = readFileSync(this.#fileLocation);
      this.monsterPiVersion = contents.toString().replaceAll(" ", "");
      return this.monsterPiVersion;
    } catch (e) {
      this.logger.warn("Error checking MonsterPi version");
      captureException(e);
    }
    return null;
  }
}

module.exports = {
  MonsterPiService,
};
