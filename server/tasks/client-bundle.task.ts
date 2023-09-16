import { AppConstants } from "@/server.constants";

export class ClientDistDownloadTask {
  /**
   * @type {ClientBundleService}
   */
  clientBundleService;
  /**
   * @type {GithubService}
   */
  githubService;
  /**
   * @type {LoggerService}
   */
  logger;

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
