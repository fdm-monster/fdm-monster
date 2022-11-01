import { BaseService } from "@/backend/base.service";
import { ServerApi } from "@/backend/server.api";
import { PrintCompletionsModel } from "@/models/print-completions/print-completions.model";

export class PrintCompletionsService extends BaseService {
  static async getCompletions() {
    const path = `${ServerApi.printCompletionRoute}`;

    return (await this.getApi(path)) as PrintCompletionsModel;
  }
}
