const AdmZip = require("adm-zip");
const { join } = require("path");
const { readdir, rm } = require("node:fs/promises");
const { superRootPath } = require("../utils/fs.utils");
const { AppConstants } = require("../server.constants");

class LogDumpService {
  logger;

  constructor({ loggerFactory }) {
    this.logger = loggerFactory(LogDumpService.name);
  }

  async dumpZip() {
    this.logger.log("Dumping logs as ZIP");
    const zip = new AdmZip();
    const path = join(superRootPath(), AppConstants.defaultLogsFolder);
    zip.addLocalFolder(path, "/logs", "*.log");

    const outputPath = join(
      superRootPath(),
      AppConstants.defaultLogZipsFolder,
      `logs-${AppConstants.serverRepoName}.zip`
    );
    zip.writeZip(outputPath);
    return outputPath;
  }
}

module.exports = {
  LogDumpService,
};
