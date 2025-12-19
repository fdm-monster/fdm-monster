import { DITokens } from "@/container.tokens";
import { MoonrakerType, OctoprintType, PrusaLinkType, BambuType } from "@/services/printer-api.interface";
import { SettingsStore } from "@/state/settings.store";
import { IWebsocketAdapter } from "@/services/websocket-adapter.interface";
import { CradleService } from "@/services/core/cradle.service";

export class SocketFactory {
  constructor(private readonly cradleService: CradleService) {}

  createInstance(printerType: number): IWebsocketAdapter {
    const settingsStore = this.cradleService.resolve<SettingsStore>(DITokens.settingsStore);
    const serverSettings = settingsStore.getServerSettings();
    const moonrakerSupport = serverSettings.experimentalMoonrakerSupport;
    const prusaLinkSupport = serverSettings.experimentalPrusaLinkSupport;
    const bambuSupport = serverSettings.experimentalBambuSupport;

    if (printerType === OctoprintType) {
      return this.cradleService.resolve(DITokens.octoPrintSockIoAdapter);
    } else if (moonrakerSupport && printerType === MoonrakerType) {
      return this.cradleService.resolve(DITokens.moonrakerWebsocketAdapter);
    } else if (prusaLinkSupport && printerType === PrusaLinkType) {
      return this.cradleService.resolve(DITokens.prusaLinkPollingAdapter);
    } else if (bambuSupport && printerType === BambuType) {
      return this.cradleService.resolve(DITokens.bambuMqttAdapter);
    } else {
      throw new Error("PrinterType is unknown, cant pick the right socket adapter");
    }
  }
}
