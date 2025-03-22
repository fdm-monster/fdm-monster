import { DITokens } from "@/container.tokens";
import { MoonrakerType, OctoprintType, PrusaLinkType } from "@/services/printer-api.interface";
import { SettingsStore } from "@/state/settings.store";
import { IWebsocketAdapter } from "@/services/websocket-adapter.interface";

export class SocketFactory {
  cradle: any;

  constructor(cradle: {}) {
    this.cradle = cradle;
  }

  createInstance(printerType: number): IWebsocketAdapter {
    const settingsStore = this.cradle[DITokens.settingsStore] as SettingsStore;
    const serverSettings = settingsStore.getServerSettings();
    const moonrakerSupport = serverSettings.experimentalMoonrakerSupport;
    const prusaLinkSupport = serverSettings.experimentalPrusaLinkSupport;

    if (printerType === OctoprintType) {
      return this.cradle[DITokens.octoPrintSockIoAdapter];
    } else if (moonrakerSupport && printerType === MoonrakerType) {
      return this.cradle[DITokens.moonrakerWebsocketAdapter];
    } else if (prusaLinkSupport && printerType === PrusaLinkType) {
      return this.cradle[DITokens.prusaLinkPollingAdapter];
    } else {
      throw new Error("PrinterType is unknown, cant pick the right socket adapter");
    }
  }
}
