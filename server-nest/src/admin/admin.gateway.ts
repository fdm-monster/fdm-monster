import { OnGatewayInit, WebSocketGateway } from "@nestjs/websockets";
import { Server } from "socket.io";
import {
  socketIOAdminUIEnabledToken,
  socketIOAdminUIPasswordBCryptToken,
  socketIOAdminUIPasswordToken,
  socketIOAdminUIUsernameToken,
} from "./admin.constants";
import { randomString } from "@/utils/random.utils";
import { hashPassword } from "@/utils/crypto.util";
import { instrument } from "@socket.io/admin-ui";
import { ModuleRef } from "@nestjs/core";
import { ConfigService } from "@nestjs/config";
import { Logger } from "@nestjs/common";

@WebSocketGateway({
  cors: {
    origin: "*",
  },
  namespace: "",
})
export class AdminGateway implements OnGatewayInit {
  logger = new Logger(AdminGateway.name);

  constructor(private moduleRef: ModuleRef, private configService: ConfigService) {}

  afterInit(server: Server) {
    const enabledAdminUI = this.configService.get(socketIOAdminUIEnabledToken);
    if (!enabledAdminUI) {
      this.logger.log(`SocketIO AdminUI not enabled '${socketIOAdminUIEnabledToken}=${enabledAdminUI}'`);
      return;
    } else {
      this.logger.log(`SocketIO AdminUI enabled. This can be disabled with: '${socketIOAdminUIEnabledToken}=false'`);
    }

    const username = this.configService.get(socketIOAdminUIUsernameToken);
    let socketIOPassword = this.configService.get(socketIOAdminUIPasswordToken);
    const socketIOPasswordHashed = this.configService.get(socketIOAdminUIPasswordBCryptToken);
    if (!socketIOPasswordHashed?.length) {
      if (!socketIOPassword?.length || socketIOPassword?.length < 3) {
        socketIOPassword = randomString(15);
        this.logger.log(
          `Generating SocketIO AdminUI password on the fly as none longer than 3 characters was specified with '${socketIOAdminUIPasswordToken}'. The password is '${socketIOPassword}'`
        );
      }
    } else {
      this.logger.log(
        `Enabled SocketIO AdminUI using '${socketIOAdminUIUsernameToken}:${socketIOAdminUIPasswordBCryptToken}' provided credentials.`
      );
    }
    // SocketIO Admin UI and namespace
    const passwordHash = socketIOPasswordHashed || hashPassword(socketIOPassword);

    instrument(server, {
      auth: {
        type: "basic",
        username,
        password: passwordHash,
      },
      readonly: false,
      mode: "development", // TODO test if isProduction check works on PROD
    });
  }
}
