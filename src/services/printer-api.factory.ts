import { MoonrakerType, OctoprintType, PrusaLinkType, BambuType } from "@/services/printer-api.interface";
import type { IPrinterApi } from "@/services/printer-api.interface";
import { DITokens } from "@/container.tokens";
import type { LoginDto } from "@/services/interfaces/login.dto";
import { PrinterCache } from "@/state/printer.cache";
import { CradleService } from "./core/cradle.service";

export class PrinterApiFactory {
  constructor(private readonly cradleService: CradleService) {}

  getById(id: number): IPrinterApi {
    const printerCache = this.cradleService.resolve<PrinterCache>(DITokens.printerCache);
    const login = printerCache.getLoginDto(id);
    const printerApi = this.getScopedPrinter(login);

    // For BambuApi, set the printer ID so it can access the MQTT adapter from PrinterSocketStore
    if (login.printerType === BambuType && "setPrinterId" in printerApi) {
      (printerApi as any).setPrinterId(id);
    }

    return printerApi;
  }

  getScopedPrinter(login: LoginDto): IPrinterApi {
    let printerApi;
    if (login.printerType === OctoprintType) {
      printerApi = this.cradleService.resolve<IPrinterApi>(DITokens.octoprintApi);
    } else if (login.printerType === MoonrakerType) {
      printerApi = this.cradleService.resolve<IPrinterApi>(DITokens.moonrakerApi);
    } else if (login.printerType === PrusaLinkType) {
      printerApi = this.cradleService.resolve<IPrinterApi>(DITokens.prusaLinkApi);
    } else if (login.printerType === BambuType) {
      printerApi = this.cradleService.resolve<IPrinterApi>(DITokens.bambuApi);
    } else {
      throw new Error("PrinterType is unknown, cant pick the right socket adapter");
    }

    printerApi.login = login;
    return printerApi;
  }
}
