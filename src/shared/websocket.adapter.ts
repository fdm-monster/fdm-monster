import { AppConstants } from "@/server.constants";
import { CloseEvent, Data, ErrorEvent, Event as WsEvent, WebSocket } from "ws";
import { LoggerService } from "@/handlers/logger";
import type { ILoggerFactory } from "@/handlers/logger-factory";

export abstract class WebsocketAdapter {
  socket?: WebSocket;
  protected logger: LoggerService;
  eventEmittingAllowed: boolean = true;

  constructor(loggerFactory: ILoggerFactory) {
    this.logger = loggerFactory(WebsocketAdapter.name);
  }

  get isOpened() {
    return this.socket?.readyState === WebSocket.OPEN;
  }

  public close() {
    this.socket?.close();
    delete this.socket;
  }

  public allowEmittingEvents() {
    this.eventEmittingAllowed = true;
  }

  public disallowEmittingEvents() {
    this.eventEmittingAllowed = false;
  }

  /**
   * @protected
   * Open a WebSocket connection.
   *
   * @param {string|URL} url The URL to connect to.
   * @returns {void}
   */
  open(url?: URL): void {
    if (!url) {
      throw new Error("Cant setup up websocket, URL may not be empty.");
    }
    this.socket = new WebSocket(url, {
      handshakeTimeout: AppConstants.defaultWebsocketHandshakeTimeout,
    });
    this.socket.onopen = (event) => this.onOpen(event);
    this.socket.onerror = (error) => this.onError(error);
    this.socket.onclose = (event) => this.onClose(event);
    this.socket.onmessage = (message) => this.onMessage(message.data);
  }

  /**
   * @protected
   * Send a message through the WebSocket connection.
   *
   * @param {string} payload - The message payload to send.
   * @returns {Promise<void>} A promise that resolves when the message is sent successfully.
   */
  protected async sendMessage(payload: string): Promise<void> {
    if (!this.isOpened || !this.socket) {
      this.logger.error("Websocket is not opened, cant send a message");
      return;
    }
    return await new Promise((resolve, reject) => {
      this.socket!.send(payload, (error) => {
        if (error) reject(error);
        resolve();
      });
    });
  }

  /**
   * Handle error event.
   * @protected
   * @abstract
   * @param {Event} error - The error event object.
   * @returns {Promise<void> | void} A promise that resolves when the error handling is complete, or void if no promise is returned.
   */
  protected abstract onError(error: ErrorEvent): Promise<void> | void;

  /**
   * Handle after opened event.
   * @protected
   * @abstract
   * @param {Event} event - The event object.
   * @returns {Promise<void> | void} A promise that resolves when the after opened handling is complete, or void if no promise is returned.
   */
  protected abstract afterOpened(event: WsEvent): Promise<void> | void;

  /**
   * Handle after closed event.
   * @protected
   * @abstract
   * @param {CloseEvent} event - The event object.
   * @returns {Promise<void> | void} A promise that resolves when the after closed handling is complete, or void if no promise is returned.
   */
  protected abstract afterClosed(event: CloseEvent): Promise<void> | void;

  /**
   * Handle message event.
   * @protected
   * @abstract
   * @param {Data} event - The event object.
   * @returns {Promise<void> | void} A promise that resolves when the message handling is complete, or void if no promise is returned.
   */
  protected abstract onMessage(event: Data): Promise<void> | void;

  /**
   * Handle open event.
   * @private
   * @param {Event} event - The event object.
   * @returns {Promise<void>} A promise that resolves when the open handling is complete.
   */
  private async onOpen(event: WsEvent): Promise<void> {
    await this.afterOpened(event);
  }

  /**
   * Handle close event.
   * @private
   * @param {CloseEvent} event - The event object.
   * @returns {Promise<void>} A promise that resolves when the close handling is complete.
   */
  private async onClose(event: CloseEvent): Promise<void> {
    await this.afterClosed(event);
  }
}
