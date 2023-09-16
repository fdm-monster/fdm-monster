export class SoftwareUpdateTask {
  /**
   * @type {ServerReleaseService}
   */
  serverReleaseService;

  constructor({ serverReleaseService }) {
    this.serverReleaseService = serverReleaseService;
  }

  async run() {
    await this.serverReleaseService.syncLatestRelease();
    this.serverReleaseService.logServerVersionState();
  }
}
