import { CloseEvent, Data, ErrorEvent, Event, WebSocket } from "ws";
import { defaultWebsocketHandshakeTimeout } from "@/app.constants";

export type WsProtocol = "ws" | "wss";

export abstract class WebsocketAdapter {
  socket: WebSocket;

  get opened() {
    return this.socket?.readyState === WebSocket.OPEN;
  }

  close() {
    this.socket?.close();
    delete this.socket;
  }

  protected open(url: URL) {
    this.socket = new WebSocket(url, { handshakeTimeout: defaultWebsocketHandshakeTimeout });
    this.socket.onopen = (event) => this.onOpen(event);
    this.socket.onerror = (error) => this.onError(error);
    this.socket.onclose = (event) => this.onClose(event);
    this.socket.onmessage = (message) => this.onMessage(message.data);
  }

  protected async sendMessage(payload: string): Promise<void> {
    if (!this.opened) return;
    return await new Promise((resolve, reject) => {
      this.socket.send(payload, (error?: Error) => {
        if (error) reject(error);
        resolve(undefined);
      });
    });
  }

  protected abstract onError(error: ErrorEvent): Promise<void> | void;

  protected abstract afterOpened(event: Event): Promise<void> | void;

  protected abstract afterClosed(event: CloseEvent): Promise<void> | void;

  protected abstract onMessage(event: Data): Promise<void> | void;

  private async onOpen(event: Event): Promise<void> {
    await this.afterOpened(event);
  }

  private async onClose(event: CloseEvent): Promise<void> {
    await this.afterClosed(event);
  }
}
