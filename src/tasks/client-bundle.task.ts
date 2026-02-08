import { AppConstants } from "@/server.constants";
import { ClientBundleService } from "@/services/core/client-bundle.service";
import { LoggerService } from "@/handlers/logger";
import type { ILoggerFactory } from "@/handlers/logger-factory";

export class ClientDistDownloadTask {
  private readonly logger: LoggerService;

  constructor(
    loggerFactory: ILoggerFactory,
    private readonly clientBundleService: ClientBundleService,
  ) {
    this.logger = loggerFactory(ClientDistDownloadTask.name);
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
