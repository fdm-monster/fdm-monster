const { AppConstants } = require("../server.constants");
const { WebSocket } = require("ws");

export class WebsocketAdapter {
  /**
   * WebSocket
   * @type { WebSocket|undefined }
   */
  socket;
  /**
   * @type { LoggerService }
   */
  #logger;

  constructor({ loggerFactory }) {
    this.#logger = loggerFactory("WebsocketAdapter");
  }

  get isOpened() {
    return this.socket?.readyState === WebSocket.OPEN;
  }

  close() {
    this.socket?.close();
    delete this.socket;
  }

  /**
   * @protected
   * Open a WebSocket connection.
   *
   * @param {URL} url - The URL to connect to.
   * @returns {void}
   */
  open(url) {
    this.socket = new WebSocket(url, { handshakeTimeout: AppConstants.defaultWebsocketHandshakeTimeout });
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
  async sendMessage(payload) {
    if (!this.isOpened) {
      this.#logger.error("Websocket is not opened, cant send a message");
      return;
    }
    return await new Promise((resolve, reject) => {
      this.socket.send(payload, (error) => {
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
  onError(error) {}

  /**
   * Handle after opened event.
   * @protected
   * @abstract
   * @param {Event} event - The event object.
   * @returns {Promise<void> | void} A promise that resolves when the after opened handling is complete, or void if no promise is returned.
   */
  afterOpened(event) {}

  /**
   * Handle after closed event.
   * @protected
   * @abstract
   * @param {CloseEvent} event - The event object.
   * @returns {Promise<void> | void} A promise that resolves when the after closed handling is complete, or void if no promise is returned.
   */
  afterClosed(event) {}

  /**
   * Handle message event.
   * @protected
   * @abstract
   * @param {Data} event - The event object.
   * @returns {Promise<void> | void} A promise that resolves when the message handling is complete, or void if no promise is returned.
   */
  onMessage(event) {}

  /**
   * Handle open event.
   * @private
   * @param {Event} event - The event object.
   * @returns {Promise<void>} A promise that resolves when the open handling is complete.
   */
  async onOpen(event) {
    await this.afterOpened(event);
  }

  /**
   * Handle close event.
   * @private
   * @param {CloseEvent} event - The event object.
   * @returns {Promise<void>} A promise that resolves when the close handling is complete.
   */
  async onClose(event) {
    await this.afterClosed(event);
  }
}

module.exports = {
  WebsocketAdapter,
};
