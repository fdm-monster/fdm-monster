import { DITokens } from "@/container.tokens";
import { OctoprintWebsocketAdapter } from "@/services/octoprint/octoprint-websocket.adapter";

export class SocketFactory {
  cradle: any;

  constructor(cradle: {}) {
    this.cradle = cradle;
  }

  createInstance(): OctoprintWebsocketAdapter {
    return this.cradle[DITokens.octoPrintSockIoAdapter];
  }
}
