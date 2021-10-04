const { join } = require("path");
const { writeFileSync } = require("fs");
const { getLogsPath } = require("../utils/system-paths.utils.js");
const { isPm2, isNodemon, isNode } = require("../utils/env.utils.js");
const isDocker = require("is-docker");
const { AppConstants } = require("../app.constants");
const currentVersion = process?.env[AppConstants.VERSION_KEY];

const { deleteExistingFile } = require("../utils/file.utils.js");
const { prettyPrintArray } = require("../utils/pretty-print.utils.js");

class SystemInfoBundleService {
  #systemInformationFileName = "system_information.txt";

  #systemInfoStore;
  #printersStore;
  #serverUpdateService;

  constructor({ systemInfoStore, printersStore, serverUpdateService }) {
    this.#systemInfoStore = systemInfoStore;
    this.#printersStore = printersStore;
    this.#serverUpdateService = serverUpdateService;
  }

  /**
   * Generates the contents for the system information files
   * @throws {String} If the SystemInformation object doesn't return
   */
  generateSystemInformationContents() {
    let systemInformationContents = "--- 3DPF System Information ---\n\n";
    systemInformationContents += `OctoFarm Version\n ${currentVersion} \n`;
    const airGapped = "Are we connected to the internet?\n";
    const pm2 = "Are we running under pm2?\n";
    const nodemon = "Are we running under nodemon?\n";
    const node = "Are we running with node?\n";
    const docker = "Are we in a docker container?\n";
    const yes = " ✓  \n";
    const no = " ✘ \n";

    const isAirGapped = this.#serverUpdateService.getAirGapped();
    systemInformationContents += `${airGapped} ${isAirGapped ? no : yes}`;
    systemInformationContents += `${node} ${isNode() ? yes : no}`;
    systemInformationContents += `${pm2} ${isPm2() ? yes : no}`;
    systemInformationContents += `${nodemon} ${isNodemon() ? yes : no}`;
    systemInformationContents += `${docker} ${isDocker() ? yes : no}`;

    const systemInformation = this.#systemInfoStore?.returnInfo();
    if (!systemInformation) throw "No system information found";

    systemInformationContents += "--- System Information ---\n\n";

    systemInformationContents += `Platform\n ${systemInformation?.osInfo?.platform} \n`;
    systemInformationContents += `Processor Arch\n ${systemInformation?.osInfo?.arch} \n`;
    systemInformationContents += `System Uptime\n ${systemInformation?.sysUptime?.uptime} \n`;
    systemInformationContents += `OctoFarm Uptime\n ${systemInformation?.processUptime} \n`;

    const printerVersions = this.#printersStore.getOctoPrintVersions();

    if (printerVersions) {
      systemInformationContents += "--- OctoPrint Information ---\n\n";
      systemInformationContents += `OctoPrint Versions\n ${prettyPrintArray(printerVersions)}`;
    }

    return systemInformationContents;
  }

  /**
   * Generates a txt file containing the current system and server information
   * @throws {Object} If the systemInformationContents doesn't return anything
   */
  generateInfoText() {
    let systemInformation = {
      name: this.#systemInformationFileName,
      path: join(getLogsPath(), this.#systemInformationFileName)
    };

    // Make sure existing zip files have been cleared from the system before continuing.
    deleteExistingFile(systemInformation?.path);

    let systemInformationContents = this.generateSystemInformationContents();

    if (!systemInformationContents)
      throw { status: "error", msg: `Couldn't generate ${this.#systemInformationFileName}` };

    writeFileSync(systemInformation?.path, systemInformationContents);

    return systemInformation;
  }
}

module.exports = SystemInfoBundleService;
