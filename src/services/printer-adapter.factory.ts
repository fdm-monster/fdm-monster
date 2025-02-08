import { DITokens } from "@/container.tokens";
import { MoonrakerType, OctoprintType } from "@/services/printer-api.interface";
import { SettingsStore } from "@/state/settings.store";
import { IWebsocketAdapter } from "@/services/websocket-adapter.interface";
import { CradleService } from "@/services/cradle.service";

export class PrinterAdapterFactory {
  constructor(private readonly cradleService: CradleService) {}

  createInstance(printerType: number): IWebsocketAdapter {
    const settingsStore = this.cradleService.resolve<SettingsStore>(DITokens.settingsStore);
    const serverSettings = settingsStore.getServerSettings();
    const moonrakerSupport = serverSettings.experimentalMoonrakerSupport;

    if (printerType === OctoprintType) {
      return this.cradleService.resolve(DITokens.octoPrintSockIoAdapter);
    } else if (moonrakerSupport && printerType === MoonrakerType) {
      return this.cradleService.resolve(DITokens.moonrakerWebsocketAdapter);
    } else {
      throw new Error("PrinterType is unknown, cant pick the right socket adapter");
    }
  }
}
