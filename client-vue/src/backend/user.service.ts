import { ServerApi } from "@/backend/server.api";
import { BaseService } from "@/backend/base.service";
import { User } from "@/models/user.model";

export class UserService extends BaseService {
  static async listUsers() {
    const path = ServerApi.userRoute;

    return (await this.getApi(path)) as User[];
  }
}
