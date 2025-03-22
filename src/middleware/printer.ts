import { asValue } from "awilix";
import { DITokens } from "@/container.tokens";
import { NextFunction, Request, Response } from "express";
import { PrinterCache } from "@/state/printer.cache";
import { OctoprintApi } from "@/services/octoprint.api";
import { MoonrakerType, OctoprintType, PrusaLinkType } from "@/services/printer-api.interface";
import { MoonrakerApi } from "@/services/moonraker.api";
import { SettingsStore } from "@/state/settings.store";
import { PrusaLinkApi } from "@/services/prusa-link/prusa-link.api";

export const printerIdToken = "currentPrinterId";
export const printerApiToken = "printerApi";
export const currentPrinterToken = "currentPrinter";
export const printerLoginToken = "printerLogin";

export const printerResolveMiddleware = (key = "id") => {
  return (req: Request, res: Response, next: NextFunction) => {
    const printerCache = req.container.resolve<PrinterCache>(DITokens.printerCache);
    const settingsService = req.container.resolve<any>(DITokens.settingsStore) as SettingsStore;
    const moonrakerEnabled = settingsService.getServerSettings().experimentalMoonrakerSupport;
    const prusaLinkEnabled = settingsService.getServerSettings().experimentalPrusaLinkSupport;

    let scopedPrinter = undefined;
    let loginDto = undefined;

    const printerId = req.params[key];
    if (printerId) {
      scopedPrinter = printerCache.getCachedPrinterOrThrow(printerId);
      loginDto = printerCache.getLoginDto(printerId);

      req.container.register({
        [currentPrinterToken]: asValue(scopedPrinter),
        [printerLoginToken]: asValue(loginDto),
        [printerIdToken]: asValue(printerId),
      });

      switch (scopedPrinter.printerType) {
        case OctoprintType:
          const octoprintApiInstance = req.container.resolve<OctoprintApi>(DITokens.octoprintApi);
          req.container.register({
            [printerApiToken]: asValue(octoprintApiInstance),
          });
          break;
        case MoonrakerType:
          const moonrakerInstance = req.container.resolve<MoonrakerApi>(DITokens.moonrakerApi);
          req.container.register({
            [printerApiToken]: moonrakerEnabled ? asValue(moonrakerInstance) : asValue(undefined),
          });
          break;
        case PrusaLinkType:
          const prusaLinkInstance = req.container.resolve<PrusaLinkApi>(DITokens.prusaLinkApi);
          req.container.register({
            [printerApiToken]: prusaLinkEnabled ? asValue(prusaLinkInstance) : asValue(undefined),
          });
      }
    } else {
      req.container.register({
        [currentPrinterToken]: asValue(undefined),
        [printerLoginToken]: asValue(undefined),
        [printerIdToken]: asValue(undefined),
        [printerApiToken]: asValue(undefined),
      });
    }

    next();
  };
};
