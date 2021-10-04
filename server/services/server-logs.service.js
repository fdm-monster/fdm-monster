const { readdirSync, statSync } = require("fs");
const { join } = require("path");

const { createZipFile } = require("../utils/zip.utils.js");
const { getLogsPath } = require("../utils/system-paths.utils.js");

const dumpFileName = "3dpf_dump.zip";

class ServerLogsService {
  #systemInfoBundleService;

  constructor({ systemInfoBundleService }) {
    this.#systemInfoBundleService = systemInfoBundleService;
  }

  collectLogFiles() {
    const fileArray = [];
    const testFolder = getLogsPath();
    const folderContents = readdirSync(testFolder);
    for (let i = 0; i < folderContents.length; i++) {
      const logFilePath = join(testFolder, folderContents[i]);
      const stats = statSync(logFilePath);
      const logFile = {
        name: folderContents[i],
        path: logFilePath,
        size: stats?.size,
        modified: stats?.mtime,
        created: stats?.birthtime
      };
      fileArray.push(logFile);
    }
    return fileArray;
  }

  async generateLogDumpZip() {
    const fileList = [];

    // Generate nice text file of system information
    let infoText = this.#systemInfoBundleService.generateInfoText();
    if (!infoText) throw "Couldn't generate system_information.txt file...";

    fileList.push(infoText);

    // Collect all latest log files
    let currentLogFiles = this.collectLogFiles();

    // Let me know if there's a better way here. Just always used forEach.
    currentLogFiles.forEach((logPath) => {
      if (logPath?.name.includes(".log")) {
        const logFile = {
          name: logPath?.name,
          path: logPath?.path
        };
        fileList.push(logFile);
      }
    });
    // Create the zip file and return the path.
    return await createZipFile(dumpFileName, fileList);
  }
}

module.exports = ServerLogsService;
