class SoftwareUpdateTask {
  #serverReleaseService;

  constructor({ serverReleaseService }) {
    this.#serverReleaseService = serverReleaseService;
  }

  async run() {
    await this.#serverReleaseService.syncLatestRelease(false);
    this.#serverReleaseService.logServerVersionState();
  }
}

module.exports = SoftwareUpdateTask;
