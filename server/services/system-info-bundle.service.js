const { isPm2, isNodemon, isNode } = require("../utils/env.utils.js");
const isDocker = require("is-docker");
const { prettyPrintArray } = require("../utils/pretty-print.utils.js");

class SystemInfoBundleService {
  #systemInfoStore;
  #printersStore;
  #serverReleaseService;

  serverVersion;

  constructor({ systemInfoStore, printersStore, serverReleaseService, serverVersion }) {
    this.#systemInfoStore = systemInfoStore;
    this.#printersStore = printersStore;
    this.#serverReleaseService = serverReleaseService;

    this.serverVersion = serverVersion;
  }

  /**
   * Generates the contents for the system information files
   * @throws {String} If the SystemInformation object doesn't return
   */
  generateSystemInformationContents() {
    let systemInformationContents = "--- System Information ---\n\n";
    systemInformationContents += `FDM Monster Version\n ${this.serverVersion} \n`;
    const airGapped = "Are we connected to the internet?\n";
    const pm2 = "Are we running under pm2?\n";
    const nodemon = "Are we running under nodemon?\n";
    const node = "Are we running with node?\n";
    const docker = "Are we in a docker container?\n";
    const yes = " ✓  \n";
    const no = " ✘ \n";

    const isAirGapped = this.#serverReleaseService.getAirGapped();
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
    systemInformationContents += `Server Uptime\n ${systemInformation?.processUptime} \n`;

    const printerVersions = this.#printersStore.getOctoPrintVersions();

    if (printerVersions) {
      systemInformationContents += "--- OctoPrint Information ---\n\n";
      systemInformationContents += `OctoPrint Versions\n ${prettyPrintArray(printerVersions)}`;
    }

    return systemInformationContents;
  }
}

module.exports = SystemInfoBundleService;
