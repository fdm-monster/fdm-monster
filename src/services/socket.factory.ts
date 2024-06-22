import { DITokens } from "@/container.tokens";
import { OctoprintWebsocketAdapter } from "@/services/octoprint/octoprint-websocket.adapter";
import { MoonrakerWebsocketAdapter } from "@/services/moonraker/moonraker-websocket.adapter";
import { MoonrakerType, OctoprintType } from "@/services/printer-api.interface";

export class SocketFactory {
  cradle: any;

  constructor(cradle: {}) {
    this.cradle = cradle;
  }

  createInstance(printerType: number): OctoprintWebsocketAdapter | MoonrakerWebsocketAdapter {
    if (printerType === OctoprintType) {
      return this.cradle[DITokens.octoPrintSockIoAdapter];
    } else if (printerType === MoonrakerType) {
      return this.cradle[DITokens.moonrakerWebsocketAdapter];
    } else {
      throw new Error("PrinterType is unknown, cant pick the right socket adapter");
    }
  }
}
