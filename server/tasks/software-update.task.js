class SoftwareUpdateTask {
  #serverUpdateService;

  constructor({ serverUpdateService }) {
    this.#serverUpdateService = serverUpdateService;
  }

  async run() {
    await this.#serverUpdateService.syncLatestRelease(false);
    this.#serverUpdateService.logServerVersionState();
  }
}

module.exports = SoftwareUpdateTask;
