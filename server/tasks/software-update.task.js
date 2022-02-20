class SoftwareUpdateTask {
  #serverUpdateService;

  constructor({ serverUpdateService }) {
    this.#serverUpdateService = serverUpdateService;
  }

  async run() {
    await this.#serverUpdateService.syncLatestRelease(false).then(() => {
      this.#serverUpdateService.checkReleaseAndLogUpdate();
    });
  }
}

module.exports = SoftwareUpdateTask;
