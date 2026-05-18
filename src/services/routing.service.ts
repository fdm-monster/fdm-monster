import type { PrinterCache } from "@/state/printer.cache";
import type { IPrinterTagService } from "@/services/interfaces/printer-tag.service.interface";

export type RoutingMatchKind = "printer" | "tag" | "none";

export interface RoutingResolution {
  routingTarget: string | null;
  kind: RoutingMatchKind;
  matchedName: string | null;
  printerIds: number[];
}

export class RoutingService {
  constructor(
    private readonly printerCache: PrinterCache,
    private readonly printerTagService: IPrinterTagService,
  ) {}

  async resolve(routingTarget: string | null): Promise<RoutingResolution> {
    const unresolved: RoutingResolution = { routingTarget, kind: "none", matchedName: null, printerIds: [] };

    const target = routingTarget?.trim().toLowerCase();
    if (!target) {
      return unresolved;
    }

    const printers = await this.printerCache.listCachedPrinters(true);
    const printerMatch = printers.find((p) => p.name?.trim().toLowerCase() === target);
    if (printerMatch) {
      return { routingTarget, kind: "printer", matchedName: printerMatch.name, printerIds: [printerMatch.id] };
    }

    const tags = await this.printerTagService.listTags();
    const tagMatch = tags.find((t) => t.name?.trim().toLowerCase() === target);
    if (tagMatch) {
      return {
        routingTarget,
        kind: "tag",
        matchedName: tagMatch.name,
        printerIds: tagMatch.printers.map((pt) => pt.printerId),
      };
    }

    return unresolved;
  }
}
