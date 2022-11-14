import { BaseService } from "@/backend/base.service";
import { ServerApi } from "@/backend/server.api";

export class ServerPrivateService extends BaseService {
  public static async restartServer() {
    const path = ServerApi.serverRestartCommandRoute;

    return await this.postApi(path);
  }
}
