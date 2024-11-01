import { DITokens } from "@/container.tokens";
import { OctoprintWebsocketAdapter } from "@/services/octoprint/octoprint-websocket.adapter";
import { MoonrakerWebsocketAdapter } from "@/services/moonraker/moonraker-websocket.adapter";
import { MoonrakerType, OctoprintType } from "@/services/printer-api.interface";
import { SettingsStore } from "@/state/settings.store";

export class SocketFactory {
  cradle: any;

  constructor(cradle: {}) {
    this.cradle = cradle;
  }

  createInstance(printerType: number): OctoprintWebsocketAdapter | MoonrakerWebsocketAdapter {
    const settingsStore = this.cradle[DITokens.settingsStore] as SettingsStore;
    const serverSettings = settingsStore.getServerSettings();
    const moonrakerSupport = serverSettings.experimentalMoonrakerSupport;

    if (printerType === OctoprintType) {
      return this.cradle[DITokens.octoPrintSockIoAdapter];
    } else if (moonrakerSupport && printerType === MoonrakerType) {
      return this.cradle[DITokens.moonrakerWebsocketAdapter];
    } else {
      throw new Error("PrinterType is unknown, cant pick the right socket adapter");
    }
  }
}
