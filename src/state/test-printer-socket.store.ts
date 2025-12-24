import { setInterval, setTimeout } from "node:timers/promises";
import { validateInput } from "@/handlers/validators";
import { createTestPrinterSchema } from "./validation/create-test-printer.validation";
import { octoPrintEvent, WsMessage } from "@/services/octoprint/octoprint-websocket.adapter";
import { AppConstants } from "@/server.constants";
import { SocketIoGateway } from "@/state/socket-io.gateway";
import { SocketFactory } from "@/services/socket.factory";
import EventEmitter2 from "eventemitter2";
import { LoggerService } from "@/handlers/logger";
import { ILoggerFactory } from "@/handlers/logger-factory";
import { errorSummary } from "@/utils/error.utils";
import { captureException } from "@sentry/node";
import { SOCKET_STATE } from "@/shared/dtos/socket-state.type";
import { IWebsocketAdapter } from "@/services/websocket-adapter.interface";
import { moonrakerEvent } from "@/services/moonraker/constants/moonraker.constants";
import { bambuEvent } from "@/services/bambu/bambu-mqtt.adapter";
import { prusaLinkEvent } from "@/services/prusa-link/constants/prusalink.constants";
import { printerEvents } from "@/constants/event.constants";
import { OctoPrintEventDto } from "@/services/octoprint/dto/octoprint-event.dto";
import { z } from "zod";

// Use a large number range for test printer IDs to avoid conflicts with real printers
const TEST_PRINTER_ID_BASE = 100000;
let testPrinterIdCounter = 0;

export class TestPrinterSocketStore {
  testSocket?: IWebsocketAdapter;
  private readonly logger: LoggerService;

  constructor(
    loggerFactory: ILoggerFactory,
    private readonly socketFactory: SocketFactory,
    private readonly socketIoGateway: SocketIoGateway,
    private readonly eventEmitter2: EventEmitter2,
  ) {
    this.logger = loggerFactory(TestPrinterSocketStore.name);
  }

  async setupTestPrinter(correlationToken: string, printer: z.infer<typeof createTestPrinterSchema>): Promise<void> {
    if (this.testSocket) {
      this.testSocket.close();
      delete this.testSocket;
    }

    const validatedData = await validateInput(printer, createTestPrinterSchema);
    validatedData.enabled = true;

    // Generate a unique test printer ID
    const testPrinterId = TEST_PRINTER_ID_BASE + (++testPrinterIdCounter);

    // Create a new socket if it doesn't exist
    this.testSocket = this.socketFactory.createInstance(printer.printerType);

    // Reset the socket credentials before (re-)connecting
    this.testSocket.registerCredentials({
      printerId: testPrinterId,
      loginDto: {
        apiKey: printer.apiKey,
        username: printer.username,
        password: printer.password,
        printerURL: printer.printerURL,
        printerType: printer.printerType,
      },
    });

    const testEvents = [
      octoPrintEvent(WsMessage.WS_STATE_UPDATED),
      octoPrintEvent(WsMessage.API_STATE_UPDATED),
      octoPrintEvent(WsMessage.WS_CLOSED),
      octoPrintEvent(WsMessage.WS_OPENED),
      octoPrintEvent(WsMessage.WS_ERROR),
      moonrakerEvent(WsMessage.WS_STATE_UPDATED),
      moonrakerEvent(WsMessage.API_STATE_UPDATED),
      moonrakerEvent(WsMessage.WS_CLOSED),
      moonrakerEvent(WsMessage.WS_OPENED),
      moonrakerEvent(WsMessage.WS_ERROR),
      bambuEvent(WsMessage.WS_STATE_UPDATED),
      bambuEvent(WsMessage.API_STATE_UPDATED),
      bambuEvent(WsMessage.WS_CLOSED),
      bambuEvent(WsMessage.WS_OPENED),
      bambuEvent(WsMessage.WS_ERROR),
      prusaLinkEvent(WsMessage.WS_STATE_UPDATED),
      prusaLinkEvent(WsMessage.API_STATE_UPDATED),
      prusaLinkEvent(WsMessage.WS_CLOSED),
      prusaLinkEvent(WsMessage.WS_OPENED),
      prusaLinkEvent(WsMessage.WS_ERROR),
    ];
    const listener = ({ event, payload, printerId }: OctoPrintEventDto) => {
      if (printerId !== testPrinterId) {
        return;
      }
      this.socketIoGateway.send("test-printer-state", {
        event,
        payload,
        correlationToken,
      });
    };
    testEvents.forEach((te) => {
      this.eventEmitter2.on(te, listener);
    });

    try {
      this.logger.log("Test API calls for authentication and session");
      await this.testSocket.setupSocketSession();

      this.logger.log("Test socket connection started");
      const promise = new Promise(async (resolve, reject) => {
        if (!this.testSocket) {
          this.logger.error("Aborting test as testSocket is undefined.");
          return;
        }
        this.testSocket.open();
        for await (const _startTime of setInterval(100)) {
          if (!this.testSocket) {
            this.logger.warn("Test without socket, rejecting");
            reject(new Error("Test without socket, rejecting"));
            return;
          }
          if (this.testSocket.socketState === SOCKET_STATE.authenticated) {
            this.logger.log("Test completed successfully, resolving");
            resolve(true);
            break;
          }
        }
      });

      await Promise.race([promise, setTimeout(AppConstants.defaultWebsocketHandshakeTimeout)]);

      this.logger.log("Test finalized");
    } catch (e) {
      this.logger.error(`Test harness error ${errorSummary(e)}`);
      captureException(e);
    } finally {
      // Ensure that the printer does not re-register itself after being purged
      this.testSocket.disallowEmittingEvents();

      if (this.testSocket) {
        this.testSocket.close();
      }
      this.eventEmitter2.emit(printerEvents.printersDeleted, {
        printerIds: [testPrinterId],
      });
      delete this.testSocket;
      testEvents.forEach((te) => {
        this.eventEmitter2.off(te, listener);
      });
    }
  }
}
