import { errorSummary } from "@/utils/error.utils";
import { PrinterSocketStore } from "@/state/printer-socket.store";
import { OctoprintClient } from "@/services/octoprint/octoprint.client";
import { LoggerService } from "@/handlers/logger";
import type { ILoggerFactory } from "@/handlers/logger-factory";
import { captureException } from "@sentry/node";
import { API_STATE } from "@/shared/dtos/api-state.type";
import { OctoprintType } from "@/services/printer-api.interface";

export class PrinterWebsocketRestoreTask {
  private readonly logger: LoggerService;

  constructor(
    loggerFactory: ILoggerFactory,
    private readonly printerSocketStore: PrinterSocketStore,
    private readonly octoprintClient: OctoprintClient,
  ) {
    this.logger = loggerFactory(PrinterWebsocketRestoreTask.name);
  }

  async run() {
    const existingSockets = this.printerSocketStore.listPrinterSockets();
    for (const socket of existingSockets) {
      if (socket.printerType !== OctoprintType) {
        continue;
      }

      try {
        if (socket.isClosedOrAborted()) {
          socket.close();
          socket.resetSocketState();
          this.logger.warn("Socket was closed or aborted, manually removing it");
          continue;
        }
      } catch (e: any) {
        captureException(e);
        this.logger.error(`Resetting WebSocket socket failed for printer with error '${errorSummary(e)}'`, e.stack);
        continue;
      }

      // Often due to USB disconnect, not interesting to reconnect unless we perform an API call for verification
      if (
        (socket.apiState !== API_STATE.unset && !socket.lastMessageReceivedTimestamp) ||
        (socket.lastMessageReceivedTimestamp && Date.now() - socket.lastMessageReceivedTimestamp > 10 * 1000)
      ) {
        const result = await this.octoprintClient.getConnection(socket.login);

        try {
          if (result.data?.current?.state !== "Closed") {
            this.logger.warn(
              `Silence was detected, but the OctoPrint current connection was not closed. Connection state ${result.data?.current?.state}`,
            );
          }
        } catch (e) {
          this.logger.error(`Silence was detected, but Websocket was not closed/aborted and API could not be called`);
        }
      }
    }
  }
}
