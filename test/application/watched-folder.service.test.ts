import os from "node:os";
import fs from "node:fs";
import path from "node:path";
import { WatchedFolderService } from "@/services/watched-folder.service";
import type { ILoggerFactory } from "@/handlers/logger-factory";
import type { ConfigService, WatchedFolderMode } from "@/services/core/config.service";
import type { FileStorageService } from "@/services/file-storage.service";
import type { FileAnalysisService } from "@/services/file-analysis.service";
import type { RoutingService } from "@/services/routing.service";

const tmpDirs: string[] = [];

// Creates a real <tmp>/prusa-mini/<name> file; returns [rootPath, filePath]
function realFile(name: string): [string, string] {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "fdmm-wf-"));
  const sub = path.join(root, "prusa-mini");
  fs.mkdirSync(sub);
  const filePath = path.join(sub, name);
  fs.writeFileSync(filePath, "; gcode\nG28\n");
  tmpDirs.push(root);
  return [root, filePath];
}

afterAll(() => {
  for (const d of tmpDirs) {
    try {
      fs.rmSync(d, { recursive: true, force: true });
    } catch {
      /* ignore */
    }
  }
});

function makeService(config: { mode?: WatchedFolderMode; metadata?: any; alreadyImported?: boolean } = {}) {
  const logger = { log: vi.fn(), warn: vi.fn(), error: vi.fn() };
  const loggerFactory = (() => logger) as unknown as ILoggerFactory;

  const configService = {
    watchedFolderPath: () => "/watched",
    watchedFolderMode: () => config.mode ?? "consume",
  } as unknown as ConfigService;

  const calculateFileHash = vi.fn(async () => "hash123");
  const saveFile = vi.fn(async () => "stored-id");
  const getFilePath = vi.fn(() => "/storage/gcode/stored-id.gcode");
  const getDeterministicId = vi.fn(() => "det-id");
  const fileExists = vi.fn(async () => config.alreadyImported ?? false);
  const saveThumbnails = vi.fn(async () => []);
  const saveMetadata = vi.fn(async () => {});
  const fileStorageService = {
    calculateFileHash,
    saveFile,
    getFilePath,
    getDeterministicId,
    fileExists,
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
  return { service, logger, saveFile, saveMetadata, queueForFile };
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

describe("WatchedFolderService.handleFile (consume mode)", () => {
  it("imports a print file and routes it, using the subfolder as routingTarget", async () => {
    const { service, saveFile, saveMetadata, queueForFile } = makeService();
    await service.handleFile("/watched", "/watched/prusa-mini/part.gcode");
    expect(saveFile).toHaveBeenCalledOnce();
    expect(saveFile.mock.calls[0][0]).toHaveProperty("path");
    expect(queueForFile).toHaveBeenCalledWith("stored-id");
    expect(saveMetadata.mock.calls[0][1].routingTarget).toBe("prusa-mini");
  });

  it("ignores files with non-print extensions", async () => {
    const { service, saveFile } = makeService();
    await service.handleFile("/watched", "/watched/prusa-mini/model.stl");
    expect(saveFile).not.toHaveBeenCalled();
  });

  it("warns when the gcode fdmm_target contradicts the subfolder, and the folder wins", async () => {
    const { service, saveMetadata, logger } = makeService({
      metadata: { fileFormat: "gcode", routingTarget: "voron" },
    });
    await service.handleFile("/watched", "/watched/prusa-mini/part.gcode");
    expect(saveMetadata.mock.calls[0][1].routingTarget).toBe("prusa-mini");
    expect(logger.warn).toHaveBeenCalled();
  });
});

describe("WatchedFolderService.handleFile (library mode)", () => {
  it("imports a new file by copying it, leaving the original in place", async () => {
    const { service, saveFile, queueForFile } = makeService({ mode: "library" });
    const [root, filePath] = realFile("part.gcode");
    await service.handleFile(root, filePath);
    expect(saveFile).toHaveBeenCalledOnce();
    expect(saveFile.mock.calls[0][0]).toHaveProperty("buffer");
    expect(queueForFile).toHaveBeenCalled();
    expect(fs.existsSync(filePath)).toBe(true);
  });

  it("skips a file that was already imported (no re-import on re-scan)", async () => {
    const { service, saveFile } = makeService({ mode: "library", alreadyImported: true });
    await service.handleFile("/watched", "/watched/prusa-mini/part.gcode");
    expect(saveFile).not.toHaveBeenCalled();
  });
});
