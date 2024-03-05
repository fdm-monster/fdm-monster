import { connect, MqttClient } from "mqtt";
import { join } from "path";
import { rootPath } from "@/utils/fs.utils";
import { AppConstants } from "@/server.constants";
import { IConfigService } from "@/services/core/config.service";
import { LoggerService } from "@/handlers/logger";
import { ILoggerFactory } from "@/handlers/logger-factory";
import { IClientOptions } from "mqtt/src/lib/client";

class MqttService {
  configService: IConfigService;
  logger: LoggerService;
  #client: MqttClient;

  constructor({ configService, loggerFactory }: { configService: IConfigService; loggerFactory: ILoggerFactory }) {
    this.configService = configService;
    this.logger = loggerFactory(MqttService.name);
  }

  async connect() {
    const isEnabled = this.configService.get(
      AppConstants.enableMqttAutoDiscoveryToken,
      AppConstants.enableMqttAutoDiscoveryDefault
    );
    if (isEnabled === "false") return;

    const packageJsonPath = join(rootPath(), "./package.json");
    const host = this.configService.get(AppConstants.mqttUrlToken);
    const port = this.configService.get(AppConstants.mqttPortToken, AppConstants.mqttPortDefault);
    const username = this.configService.get(AppConstants.mqttUsernameToken);
    const password = this.configService.get(AppConstants.mqttPasswordToken);

    const serverVersion = require(packageJsonPath).version;
    this.#client = connect({
      clientId: "FDM-Monster-" + serverVersion,
      host,
      port: parseInt(port),
      username,
      password,
    } as IClientOptions);

    // octoPrint/# to subscribe to all messages
    const eventName = "octoPrint/mqtt";
    this.#client.on("connect", () => {
      this.logger.info("Connection established successfully!");
      this.#client.subscribe(eventName);
    });

    // this.#client.on("message", function (topic, message) {
    //   console.log("message is: " + message);
    //   console.log("topic is: " + topic);
    // });
  }
}

module.exports = {
  MqttService,
};
