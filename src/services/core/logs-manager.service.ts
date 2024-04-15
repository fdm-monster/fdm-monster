import AdmZip from "adm-zip";
import { join } from "path";
import { readdirSync, unlinkSync } from "fs";
import { superRootPath } from "@/utils/fs.utils";
import { AppConstants } from "@/server.constants";
import { isValidDate } from "@/utils/time.utils";
import { LoggerService } from "@/handlers/logger";
import { ILoggerFactory } from "@/handlers/logger-factory";

export class LogDumpService {
  logger: LoggerService;

  constructor({ loggerFactory }: { loggerFactory: ILoggerFactory }) {
    this.logger = loggerFactory(LogDumpService.name);
  }

  async deleteOlderThanWeekAndMismatchingLogFiles() {
    this.logger.log("Cleaning log files");
    const path = join(superRootPath(), AppConstants.defaultLogsFolder);
    const dirEntries = readdirSync(path, { withFileTypes: true });
    const files = dirEntries.filter((dirent) => dirent.isFile()).map((dirent) => dirent.name);

    // Filter only log files that are not in the format of logs/<app-name>-<date>.log
    const startingFormat = `${AppConstants.logAppName}-`;
    const removedFilesNotInFormat = files.filter((f) => f.endsWith(".log") && !f.startsWith(startingFormat));
    const removedFilesOutdated = files.filter((f) => {
      const matchesFormat = f.endsWith(".log") && f.startsWith(startingFormat);
      if (!matchesFormat) return false;

      const strippedFilename = f.replace(".log", "").replace(startingFormat, "");
      const date = new Date(strippedFilename);
      if (!isValidDate(date)) {
        this.logger.warn("Failed to parse date from log file, removing it as outdated");
        return true;
      }

      const now = new Date();
      const diff = now.getTime() - date.getTime();
      const diffDays = diff / (1000 * 3600 * 24);
      return diffDays > 7;
    });

    this.logger.log(
      `Removing ${removedFilesNotInFormat.length} files that are not in the format of ${startingFormat}<date>.log, and ${removedFilesOutdated.length} files that are older than 7 days`
    );

    let removedWrongFormatFilesCount = 0;
    for (const file of removedFilesNotInFormat) {
      try {
        unlinkSync(join(path, file));
        removedWrongFormatFilesCount++;
      } catch (err) {
        this.logger.warn(`Failed to delete log file`);
      }
    }

    let removedOutdatedFilesCount = 0;
    for (const file of removedFilesOutdated) {
      try {
        unlinkSync(join(path, file));
        removedOutdatedFilesCount++;
      } catch (err) {
        this.logger.warn(`Failed to delete log file`);
      }
    }

    this.logger.log(`Removed ${removedWrongFormatFilesCount + removedOutdatedFilesCount} log file(s)`);
    return {
      removedWrongFormatFilesCount,
      removedOutdatedFilesCount,
    };
  }

  async dumpZip() {
    this.logger.log("Dumping logs as ZIP");
    const zip = new AdmZip();
    const path = join(superRootPath(), AppConstants.defaultLogsFolder);
    zip.addLocalFolder(path, "/logs", "*.log");

    const outputPath = join(superRootPath(), AppConstants.defaultLogZipsFolder, `logs-${AppConstants.serverRepoName}.zip`);
    zip.writeZip(outputPath);
    return outputPath;
  }
}
