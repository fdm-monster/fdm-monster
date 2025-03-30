import { ServerReleaseService } from "@/services/core/server-release.service";

export class SoftwareUpdateTask {
  constructor(private readonly serverReleaseService: ServerReleaseService) {}

  async run() {
    await this.serverReleaseService.syncLatestRelease();
    this.serverReleaseService.logServerVersionState();
  }
}
