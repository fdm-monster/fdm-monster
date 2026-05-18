import { WatchedFolderService } from "@/services/watched-folder.service";
import type { ILoggerFactory } from "@/handlers/logger-factory";
import type { ConfigService, WatchedFolderMode } from "@/services/core/config.service";
import type { FileStorageService } from "@/services/file-storage.service";
import type { FileAnalysisService } from "@/services/file-analysis.service";
import type { RoutingService } from "@/services/routing.service";

function makeService(config: { mode?: WatchedFolderMode; metadata?: any } = {}) {
  const loggerFactory = (() => ({ log: () => {}, warn: () => {}, error: () => {} })) as unknown as ILoggerFactory;

  const configService = {
    watchedFolderPath: () => "/watched",
    watchedFolderMode: () => config.mode ?? "consume",
  } as unknown as ConfigService;

  const calculateFileHash = vi.fn(async () => "hash123");
  const saveFile = vi.fn(async () => "stored-id");
  const getFilePath = vi.fn(() => "/storage/gcode/stored-id.gcode");
  const saveThumbnails = vi.fn(async () => []);
  const saveMetadata = vi.fn(async () => {});
  const fileStorageService = {
    calculateFileHash,
    saveFile,
    getFilePath,
    saveThumbnails,
    saveMetadata,
  } as unknown as FileStorageService;

  const analyzeFile = vi.fn(async () => ({
    metadata: config.metadata ?? { fileFormat: "gcode" },
    thumbnails: [],
  }));
  const fileAnalysisService = { analyzeFile } as unknown as FileAnalysisService;

  const queueForFile = vi.fn(async () => ({
    resolution: { routingTarget: null, kind: "none", matchedName: null, printerIds: [] },
    queued: false,
    jobId: null,
    printerId: null,
  }));
  const routingService = { queueForFile } as unknown as RoutingService;

  const service = new WatchedFolderService(
    loggerFactory,
    configService,
    fileStorageService,
    fileAnalysisService,
    routingService,
  );
  return { service, calculateFileHash, saveFile, saveMetadata, queueForFile };
}

describe("WatchedFolderService.isAccepted", () => {
  it("accepts print files and rejects others", () => {
    const { service } = makeService();
    expect(service.isAccepted("a/b/part.gcode")).toBe(true);
    expect(service.isAccepted("a/b/part.bgcode")).toBe(true);
    expect(service.isAccepted("a/b/part.3mf")).toBe(true);
    expect(service.isAccepted("a/b/model.stl")).toBe(false);
  });
});

describe("WatchedFolderService.subfolderOf", () => {
  it("returns the top-level subfolder of a file under the root", () => {
    const { service } = makeService();
    expect(service.subfolderOf("/watched", "/watched/prusa-mini/part.gcode")).toBe("prusa-mini");
    expect(service.subfolderOf("/watched", "/watched/prusa-mini/nested/part.gcode")).toBe("prusa-mini");
  });

  it("returns null for a file directly in the root", () => {
    const { service } = makeService();
    expect(service.subfolderOf("/watched", "/watched/part.gcode")).toBeNull();
  });
});

describe("WatchedFolderService.handleFile", () => {
  it("imports a print file and routes it, using the subfolder as routingTarget", async () => {
    const { service, saveFile, saveMetadata, queueForFile } = makeService();
    await service.handleFile("/watched", "/watched/prusa-mini/part.gcode");
    expect(saveFile).toHaveBeenCalledOnce();
    expect(queueForFile).toHaveBeenCalledWith("stored-id");
    expect(saveMetadata.mock.calls[0][1].routingTarget).toBe("prusa-mini");
  });

  it("ignores files with non-print extensions", async () => {
    const { service, saveFile } = makeService();
    await service.handleFile("/watched", "/watched/prusa-mini/model.stl");
    expect(saveFile).not.toHaveBeenCalled();
  });

  it("does not import in library mode (reserved, not yet implemented)", async () => {
    const { service, saveFile } = makeService({ mode: "library" });
    await service.handleFile("/watched", "/watched/prusa-mini/part.gcode");
    expect(saveFile).not.toHaveBeenCalled();
  });
});
