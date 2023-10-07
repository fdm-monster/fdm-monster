import { ServerReleaseService } from "@/services/core/server-release.service";

export class SoftwareUpdateTask {
  serverReleaseService: ServerReleaseService;

  constructor({ serverReleaseService }: { serverReleaseService: ServerReleaseService }) {
    this.serverReleaseService = serverReleaseService;
  }

  async run() {
    await this.serverReleaseService.syncLatestRelease();
    this.serverReleaseService.logServerVersionState();
  }
}
