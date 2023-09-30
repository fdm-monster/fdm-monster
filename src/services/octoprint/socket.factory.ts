import { DITokens } from "@/container.tokens";
import { OctoPrintSockIoAdapter } from "@/services/octoprint/octoprint-sockio.adapter";

export class SocketFactory {
  cradle: any;

  constructor(cradle: {}) {
    this.cradle = cradle;
  }

  createInstance(): OctoPrintSockIoAdapter {
    return this.cradle[DITokens.octoPrintSockIoAdapter];
  }
}
