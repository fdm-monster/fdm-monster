import { TaskService } from "@/services/interfaces/task.interfaces";
import { IConfigService } from "@/services/core/config.service";
import { PrusaLinkType } from "@/services/printer-api.interface";
import { ILoggerFactory } from "@/handlers/logger-factory";
import { PrusaLinkApi } from "@/services/prusa-link/prusa-link.api";
import { LoggerService } from "@/handlers/logger";
import { errorSummary } from "@/utils/error.utils";

export class TryPrusaLinkTask implements TaskService {
  private readonly logger: LoggerService;

  constructor(
    private readonly configService: IConfigService,
    private readonly prusaLinkApi: PrusaLinkApi,
    loggerFactory: ILoggerFactory,
  ) {
    this.logger = loggerFactory(TryPrusaLinkTask.name);
  }

  async run(): Promise<void> {
    const prusaLinkUrl = this.configService.get<string>("TEST_PL_URL");
    const prusaLinkUsername = this.configService.get<string>("TEST_PL_USERNAME");
    const prusaLinkPassword = this.configService.get<string>("TEST_PL_PASSWORD");
    if (prusaLinkUrl?.length) {
      try {
        this.prusaLinkApi.login = {
          printerURL: prusaLinkUrl,
          username: prusaLinkUsername,
          password: prusaLinkPassword,
          apiKey: "",
          printerType: PrusaLinkType,
        };

        const version = await this.prusaLinkApi.getVersion();
        this.logger.log(`Prusa link server version: ${version}`);
        const files = await this.prusaLinkApi.getFiles();
        this.logger.log(`Prusa link files: ${files.map((f) => f.path).join("\n")}`);
        const version2 = await this.prusaLinkApi.getVersion();
        this.logger.log(`Prusa link server version: ${version2}`);
      } catch (e) {
        this.logger.error(errorSummary(e));
      }
    }
  }

}
