import { IPrinterApi, MoonrakerType, OctoprintType, PrusaLinkType } from "@/services/printer-api.interface";
import { DITokens } from "@/container.tokens";
import { LoginDto } from "@/services/interfaces/login.dto";
import { PrinterCache } from "@/state/printer.cache";
import { IdType } from "@/shared.constants";
import { CradleService } from "./cradle.service";

export class PrinterApiFactory {
  constructor(private readonly cradleService: CradleService) {}

  getById(id: IdType): IPrinterApi {
    const printerCache = this.cradleService.resolve<PrinterCache>(DITokens.printerCache);
    const login = printerCache.getLoginDto(id);
    return this.getScopedPrinter(login);
  }

  getScopedPrinter(login: LoginDto): IPrinterApi {
    let printerApi;
    if (login.printerType === OctoprintType) {
      printerApi = this.cradleService.resolve<IPrinterApi>(DITokens.octoprintApi);
    } else if (login.printerType === MoonrakerType) {
      printerApi = this.cradleService.resolve<IPrinterApi>(DITokens.moonrakerApi);
    } else if (login.printerType === PrusaLinkType) {
      printerApi = this.cradleService.resolve<IPrinterApi>(DITokens.prusaLinkApi);
    } else {
      throw new Error("PrinterType is unknown, cant pick the right socket adapter");
    }

    printerApi.login = login;
    return printerApi;
  }
}
