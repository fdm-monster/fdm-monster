import { setInterval, setTimeout } from "timers/promises";
import { validateInput } from "@/handlers/validators";
import { createTestPrinterRules } from "./validation/create-test-printer.validation";
import { octoPrintEvent, Message, SOCKET_STATE, OctoPrintSockIoAdapter } from "@/services/octoprint/octoprint-sockio.adapter";
import { AppConstants } from "@/server.constants";
import { SocketIoGateway } from "@/state/socket-io.gateway";
import { SocketFactory } from "@/services/octoprint/socket.factory";
import EventEmitter2 from "eventemitter2";

export class TestPrinterSocketStore {
  testSocket: OctoPrintSockIoAdapter;
  socketIoGateway: SocketIoGateway;
  socketFactory: SocketFactory;
  eventEmitter2: EventEmitter2;
  constructor({
    socketFactory,
    socketIoGateway,
    eventEmitter2,
  }: {
    socketFactory: SocketFactory;
    socketIoGateway: SocketIoGateway;
    eventEmitter2: EventEmitter2;
  }) {
    this.socketFactory = socketFactory;
    this.socketIoGateway = socketIoGateway;
    this.eventEmitter2 = eventEmitter2;
  }

  /**
   * Sets up/recreates a printer to be tested quickly by running the standard checks
   * @param printer
   * @returns {Promise<*>}
   */
  async setupTestPrinter(printer) {
    if (this.testSocket) {
      this.testSocket.close();
      this.testSocket = null;
    }

    const validatedData = await validateInput(printer, createTestPrinterRules);
    validatedData.enabled = true;

    // Create a new socket if it doesn't exist
    const { correlationToken } = printer;
    this.testSocket = this.socketFactory.createInstance();

    // Reset the socket credentials before (re-)connecting
    this.testSocket.registerCredentials({
      printerId: correlationToken,
      loginDto: {
        apiKey: printer.apiKey,
        printerURL: printer.printerURL,
      },
      protocol: "ws",
    });

    const testEvents = [
      octoPrintEvent(Message.WS_STATE_UPDATED),
      octoPrintEvent(Message.API_STATE_UPDATED),
      octoPrintEvent(Message.WS_CLOSED),
      octoPrintEvent(Message.WS_OPENED),
      octoPrintEvent(Message.WS_ERROR),
    ];
    const listener = ({ event, payload, printerId }) => {
      if (printerId !== correlationToken) {
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
    await this.testSocket.setupSocketSession();

    const promise = new Promise(async (resolve, reject) => {
      this.testSocket.open();
      for await (const startTime of setInterval(100)) {
        if (this.testSocket.socketState === SOCKET_STATE.authenticated) {
          resolve();
          break;
        }
      }
    });

    await Promise.race([promise, setTimeout(AppConstants.defaultWebsocketHandshakeTimeout)]);
    this.testSocket.close();
    delete this.testSocket;
    testEvents.forEach((te) => {
      this.eventEmitter2.off(te, listener);
    });
  }
}
