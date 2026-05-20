import { RoutingService } from "@/services/routing.service";
import type { PrinterCache } from "@/state/printer.cache";
import type { IPrinterTagService } from "@/services/interfaces/printer-tag.service.interface";
import type { FileStorageService } from "@/services/file-storage.service";
import type { PrintJobService } from "@/services/orm/print-job.service";
import type { PrintQueueService } from "@/services/print-queue.service";

function makeService(
  config: {
    printers?: { id: number; name: string }[];
    tags?: { id: number; name: string; printerIds: number[] }[];
    metadata?: any;
  } = {},
) {
  const printers = config.printers ?? [];
  const tags = config.tags ?? [];

  const printerCache = {
    listCachedPrinters: async () => printers,
    getCachedPrinterOrThrowAsync: async (id: number) =>
      printers.find((p) => p.id === id) ?? { id, name: `Printer ${id}` },
  } as unknown as PrinterCache;

  const printerTagService = {
    listTags: async () =>
      tags.map((t) => ({
        id: t.id,
        name: t.name,
        color: "",
        printers: t.printerIds.map((printerId) => ({ printerId, tagId: t.id })),
      })),
  } as unknown as IPrinterTagService;

  const fileStorageService = {
    loadMetadata: async () => config.metadata ?? null,
  } as unknown as FileStorageService;

  const createPendingJob = vi.fn(async (printerId: number) => ({ id: 100, printerId }));
  const updateJob = vi.fn(async (job: any) => job);
  const printJobService = { createPendingJob, updateJob } as unknown as PrintJobService;

  const addToQueue = vi.fn(async () => {});
  const printQueueService = { addToQueue } as unknown as PrintQueueService;

  const service = new RoutingService(
    printerCache,
    printerTagService,
    fileStorageService,
    printJobService,
    printQueueService,
  );
  return { service, createPendingJob, updateJob, addToQueue };
}

describe("RoutingService.listRoutingTargets", () => {
  it("returns printer names and tag names separately", async () => {
    const { service } = makeService({
      printers: [
        { id: 1, name: "Prusa Mini #1" },
        { id: 2, name: "Voron" },
      ],
      tags: [{ id: 3, name: "prusa-fleet", printerIds: [1] }],
    });
    const targets = await service.listRoutingTargets();
    expect(targets.printers).toEqual(["Prusa Mini #1", "Voron"]);
    expect(targets.tags).toEqual(["prusa-fleet"]);
  });
});

describe("RoutingService.resolve", () => {
  it("matches a printer by exact name, case-insensitively", async () => {
    const { service } = makeService({ printers: [{ id: 7, name: "Prusa MK4" }] });
    const res = await service.resolve("prusa mk4");
    expect(res.kind).toBe("printer");
    expect(res.matchedName).toBe("Prusa MK4");
    expect(res.printerIds).toEqual([7]);
  });

  it("matches a tag and returns all of its printer ids", async () => {
    const { service } = makeService({ tags: [{ id: 3, name: "prusa-mini", printerIds: [1, 2, 5] }] });
    const res = await service.resolve("prusa-mini");
    expect(res.kind).toBe("tag");
    expect(res.matchedName).toBe("prusa-mini");
    expect(res.printerIds).toEqual([1, 2, 5]);
  });

  it("prefers a printer-name match over a tag-name match", async () => {
    const { service } = makeService({
      printers: [{ id: 9, name: "shared" }],
      tags: [{ id: 4, name: "shared", printerIds: [1, 2] }],
    });
    const res = await service.resolve("shared");
    expect(res.kind).toBe("printer");
    expect(res.printerIds).toEqual([9]);
  });

  it("returns kind 'none' when nothing matches", async () => {
    const { service } = makeService({
      printers: [{ id: 1, name: "Voron" }],
      tags: [{ id: 2, name: "resin", printerIds: [3] }],
    });
    const res = await service.resolve("ender-3");
    expect(res.kind).toBe("none");
    expect(res.printerIds).toEqual([]);
  });

  it("returns kind 'none' for null, empty, or whitespace targets", async () => {
    const { service } = makeService({ printers: [{ id: 1, name: "Voron" }] });
    for (const target of [null, "", "   "]) {
      const res = await service.resolve(target);
      expect(res.kind).toBe("none");
      expect(res.routingTarget).toBe(target);
    }
  });
});

describe("RoutingService.resolveForFile", () => {
  it("resolves the routingTarget read from the file's metadata", async () => {
    const { service } = makeService({
      printers: [{ id: 5, name: "Ender" }],
      metadata: { routingTarget: "ender" },
    });
    const res = await service.resolveForFile("file-x");
    expect(res.kind).toBe("printer");
    expect(res.printerIds).toEqual([5]);
  });
});

describe("RoutingService.queueForFile", () => {
  it("auto-queues a job when the file resolves to exactly one printer", async () => {
    const { service, createPendingJob, addToQueue } = makeService({
      printers: [{ id: 7, name: "Prusa MK4" }],
      metadata: { routingTarget: "Prusa MK4", _originalFileName: "part.gcode", fileFormat: "gcode" },
    });
    const result = await service.queueForFile("file-1");
    expect(result.queued).toBe(true);
    expect(result.printerId).toBe(7);
    expect(result.jobId).toBe(100);
    expect(createPendingJob).toHaveBeenCalledOnce();
    expect(addToQueue).toHaveBeenCalledWith(7, 100);
  });

  it("does not queue when the target resolves to multiple printers", async () => {
    const { service, createPendingJob } = makeService({
      tags: [{ id: 1, name: "farm", printerIds: [1, 2, 3] }],
      metadata: { routingTarget: "farm" },
    });
    const result = await service.queueForFile("file-2");
    expect(result.queued).toBe(false);
    expect(createPendingJob).not.toHaveBeenCalled();
  });

  it("does not queue when the file has no routing target", async () => {
    const { service, createPendingJob } = makeService({
      printers: [{ id: 1, name: "Voron" }],
      metadata: { routingTarget: null },
    });
    const result = await service.queueForFile("file-3");
    expect(result.queued).toBe(false);
    expect(result.resolution.kind).toBe("none");
    expect(createPendingJob).not.toHaveBeenCalled();
  });
});
