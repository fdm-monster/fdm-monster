import { AppConstants } from "@/server.constants";
import { ClientBundleService } from "@/services/core/client-bundle.service";
import { GithubService } from "@/services/core/github.service";
import { LoggerService } from "@/handlers/logger";

export class ClientDistDownloadTask {
  clientBundleService: ClientBundleService;
  githubService: GithubService;
  logger: LoggerService;

  constructor({ clientBundleService, loggerFactory, githubService }) {
    this.githubService = githubService;
    this.clientBundleService = clientBundleService;
    this.logger = loggerFactory("ClientDistDownloadTask");
  }

  async run() {
    const result = await this.clientBundleService.shouldUpdateWithReason(false, AppConstants.defaultClientMinimum);
    if (!result.shouldUpdate) {
      this.logger.log(`Client bundle update skipped. Reason: ${result.reason}`);
      return;
    }

    this.logger.log(`Client bundle update required. Reason for updating: ${result.reason}`);

    await this.clientBundleService.downloadClientUpdate(AppConstants.defaultClientMinimum);
  }
}
