import type { PrinterCache } from "@/state/printer.cache";
import type { IPrinterTagService } from "@/services/interfaces/printer-tag.service.interface";
import type { FileStorageService } from "@/services/file-storage.service";
import type { PrintJobService } from "@/services/orm/print-job.service";
import type { PrintQueueService } from "@/services/print-queue.service";

export type RoutingMatchKind = "printer" | "tag" | "none" | "ambiguous";

export interface RoutingResolution {
  routingTarget: string | null;
  kind: RoutingMatchKind;
  matchedName: string | null;
  printerIds: number[];
}

export interface RoutingQueueResult {
  resolution: RoutingResolution;
  queued: boolean;
  jobId: number | null;
  printerId: number | null;
}

export class RoutingService {
  constructor(
    private readonly printerCache: PrinterCache,
    private readonly printerTagService: IPrinterTagService,
    private readonly fileStorageService: FileStorageService,
    private readonly printJobService: PrintJobService,
    private readonly printQueueService: PrintQueueService,
  ) {}

  // kind narrows resolution to one scheme (the watched folder's by-printer / by-tag);
  // omit it for the bare gcode fdmm_target token, which guesses printer-then-tag
  async resolve(routingTarget: string | null, kind?: "printer" | "tag"): Promise<RoutingResolution> {
    const unresolved: RoutingResolution = { routingTarget, kind: "none", matchedName: null, printerIds: [] };

    const target = routingTarget?.trim().toLowerCase();
    if (!target) {
      return unresolved;
    }

    const printers = kind !== "tag" ? await this.printerCache.listCachedPrinters(true) : [];
    const printerMatch = printers.find((p) => p.name?.trim().toLowerCase() === target);

    const tags = kind !== "printer" ? await this.printerTagService.listTags() : [];
    const tagMatch = tags.find((t) => t.name?.trim().toLowerCase() === target);

    // A bare token that matches both a printer and a tag is ambiguous: refuse to
    // guess, leave it for manual routing. Only reachable when kind is unset —
    // fdmm_target_printer / fdmm_target_tag narrow to one side up front.
    if (printerMatch && tagMatch) {
      return { routingTarget, kind: "ambiguous", matchedName: target, printerIds: [] };
    }
    if (printerMatch) {
      return { routingTarget, kind: "printer", matchedName: printerMatch.name, printerIds: [printerMatch.id] };
    }
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

  // Names the watched folder addresses by — printers under by-printer/, tags under by-tag/
  async listRoutingTargets(): Promise<{ printers: string[]; tags: string[] }> {
    const printers = await this.printerCache.listCachedPrinters(true);
    const tags = await this.printerTagService.listTags();
    const dedupe = (names: (string | undefined)[]) => [
      ...new Set(names.map((n) => n?.trim()).filter((n): n is string => !!n)),
    ];
    return { printers: dedupe(printers.map((p) => p.name)), tags: dedupe(tags.map((t) => t.name)) };
  }

  async resolveForFile(fileStorageId: string, kind?: "printer" | "tag"): Promise<RoutingResolution> {
    const metadata = await this.fileStorageService.loadMetadata(fileStorageId);
    return this.resolve(metadata?.routingTarget ?? null, kind ?? metadata?.routingTargetKind ?? undefined);
  }

  async queueForFile(fileStorageId: string, kind?: "printer" | "tag"): Promise<RoutingQueueResult> {
    const metadata = await this.fileStorageService.loadMetadata(fileStorageId);
    // A folder kind (by-printer/by-tag) wins; otherwise the gcode token's own kind applies
    const resolution = await this.resolve(
      metadata?.routingTarget ?? null,
      kind ?? metadata?.routingTargetKind ?? undefined,
    );

    // Without metadata the file was never analyzed/stored properly — nothing to create
    if (!metadata) {
      return { resolution, queued: false, jobId: null, printerId: null };
    }

    // Auto-assign only when routing is unambiguous: exactly one printer.
    // Ambiguous (a tag with several printers) or unmatched files still get a
    // PENDING job with no printer, so they stay visible and can be routed by hand.
    const autoQueuePrinterId = resolution.printerIds.length === 1 ? resolution.printerIds[0] : null;
    const printer = autoQueuePrinterId
      ? await this.printerCache.getCachedPrinterOrThrowAsync(autoQueuePrinterId)
      : null;

    const job = await this.printJobService.createPendingJob(
      autoQueuePrinterId,
      metadata._originalFileName || metadata.fileName || "Unknown",
      metadata,
      printer?.name,
    );

    job.fileStorageId = fileStorageId;
    job.fileHash = metadata._fileHash;
    job.analysisState = "ANALYZED";
    job.analyzedAt = new Date();
    if (metadata.fileFormat) {
      job.fileFormat = metadata.fileFormat;
    }
    if (resolution.kind === "ambiguous") {
      job.statusReason = `Routing target "${resolution.routingTarget}" matches both a printer and a tag — slice with fdmm_target_printer or fdmm_target_tag to be explicit.`;
    }
    await this.printJobService.updateJob(job);

    if (autoQueuePrinterId) {
      await this.printQueueService.addToQueue(autoQueuePrinterId, job.id);
      return { resolution, queued: true, jobId: job.id, printerId: autoQueuePrinterId };
    }

    return { resolution, queued: false, jobId: job.id, printerId: null };
  }
}
