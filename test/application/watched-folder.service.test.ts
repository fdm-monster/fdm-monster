import os from "node:os";
import fs from "node:fs";
import path from "node:path";
import { WatchedFolderService } from "@/services/watched-folder.service";
import type { ILoggerFactory } from "@/handlers/logger-factory";
import type { ConfigService, WatchedFolderMode } from "@/services/core/config.service";
import type { FileStorageService } from "@/services/file-storage.service";
import type { FileAnalysisService } from "@/services/file-analysis.service";
import type { RoutingService } from "@/services/routing.service";
import type { EventEmitter2 } from "eventemitter2";

const tmpDirs: string[] = [];

// Creates a real <tmp>/by-printer/prusa-mini/<name> file; returns [rootPath, filePath]
function realFile(name: string): [string, string] {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "fdmm-wf-"));
  const sub = path.join(root, "by-printer", "prusa-mini");
  fs.mkdirSync(sub, { recursive: true });
  const filePath = path.join(sub, name);
  fs.writeFileSync(filePath, "; gcode\nG28\n");
  tmpDirs.push(root);
  return [root, filePath];
}

function tmpRoot(): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "fdmm-wf-"));
  tmpDirs.push(root);
  return root;
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

function makeService(
  config: {
    mode?: WatchedFolderMode;
    metadata?: any;
    alreadyImported?: boolean;
    printers?: string[];
    tags?: string[];
    exdev?: boolean;
  } = {},
) {
  const logger = { log: vi.fn(), warn: vi.fn(), error: vi.fn() };
  const loggerFactory = (() => logger) as unknown as ILoggerFactory;

  const configService = {
    watchedFolderPath: () => "/watched",
    watchedFolderMode: () => config.mode ?? "consume",
    watchedFolderPolling: () => true,
  } as unknown as ConfigService;

  const calculateFileHash = vi.fn(async () => "hash123");
  const saveFile = vi.fn(async (file: any) => {
    if (config.exdev && file?.path) {
      const err = new Error("EXDEV: cross-device link not permitted") as NodeJS.ErrnoException;
      err.code = "EXDEV";
      throw err;
    }
    return "stored-id";
  });
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
  const listRoutingTargets = vi.fn(async () => ({
    printers: config.printers ?? [],
    tags: config.tags ?? [],
  }));
  const routingService = { queueForFile, listRoutingTargets } as unknown as RoutingService;

  const eventEmitter2 = { on: vi.fn() } as unknown as EventEmitter2;

  const service = new WatchedFolderService(
    loggerFactory,
    configService,
    fileStorageService,
    fileAnalysisService,
    routingService,
    eventEmitter2,
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

describe("WatchedFolderService.routeOf", () => {
  it("reads a by-printer route", () => {
    const { service } = makeService();
    expect(service.routeOf("/watched", "/watched/by-printer/Prusa Mini/part.gcode")).toEqual({
      kind: "printer",
      key: "Prusa Mini",
    });
  });

  it("reads a by-tag route", () => {
    const { service } = makeService();
    expect(service.routeOf("/watched", "/watched/by-tag/fleet/part.gcode")).toEqual({
      kind: "tag",
      key: "fleet",
    });
  });

  it("returns null for the root, an unknown scheme, or a scheme with no key", () => {
    const { service } = makeService();
    expect(service.routeOf("/watched", "/watched/part.gcode")).toBeNull();
    expect(service.routeOf("/watched", "/watched/random/sub/part.gcode")).toBeNull();
    expect(service.routeOf("/watched", "/watched/by-printer/part.gcode")).toBeNull();
  });
});

describe("WatchedFolderService.handleFile (consume mode)", () => {
  it("imports a by-printer file and routes it with the printer kind", async () => {
    const { service, saveFile, saveMetadata, queueForFile } = makeService();
    await service.handleFile("/watched", "/watched/by-printer/prusa-mini/part.gcode");
    expect(saveFile).toHaveBeenCalledOnce();
    expect(saveFile.mock.calls[0][0]).toHaveProperty("path");
    expect(saveMetadata.mock.calls[0][1].routingTarget).toBe("prusa-mini");
    expect(saveMetadata.mock.calls[0][1].routingTargetKind).toBe("printer");
    expect(queueForFile).toHaveBeenCalledWith("stored-id", "printer");
  });

  it("routes a by-tag file with the tag kind", async () => {
    const { service, queueForFile } = makeService();
    await service.handleFile("/watched", "/watched/by-tag/fleet/part.gcode");
    expect(queueForFile).toHaveBeenCalledWith("stored-id", "tag");
  });

  it("ignores files with non-print extensions", async () => {
    const { service, saveFile } = makeService();
    await service.handleFile("/watched", "/watched/by-printer/prusa-mini/model.stl");
    expect(saveFile).not.toHaveBeenCalled();
  });

  it("warns when the gcode fdmm_target contradicts the folder, and the folder wins", async () => {
    const { service, saveMetadata, logger } = makeService({
      metadata: { fileFormat: "gcode", routingTarget: "voron" },
    });
    await service.handleFile("/watched", "/watched/by-printer/prusa-mini/part.gcode");
    expect(saveMetadata.mock.calls[0][1].routingTarget).toBe("prusa-mini");
    expect(logger.warn).toHaveBeenCalled();
  });

  it("falls back to copy + delete when the move crosses devices (EXDEV)", async () => {
    const { service, saveFile, queueForFile } = makeService({ exdev: true });
    const [root, filePath] = realFile("part.gcode");
    await service.handleFile(root, filePath);
    expect(saveFile.mock.calls.some((c: any[]) => c[0]?.buffer)).toBe(true);
    expect(queueForFile).toHaveBeenCalled();
    expect(fs.existsSync(filePath)).toBe(false);
  });
});

describe("WatchedFolderService.handleFile (library mode)", () => {
  it("imports a new file by copying it, leaving the original in place", async () => {
    const { service, saveFile, queueForFile } = makeService({ mode: "library" });
    const [root, filePath] = realFile("part.gcode");
    await service.handleFile(root, filePath);
    expect(saveFile).toHaveBeenCalledOnce();
    expect(saveFile.mock.calls[0][0]).toHaveProperty("buffer");
    expect(queueForFile).toHaveBeenCalledWith("stored-id", "printer");
    expect(fs.existsSync(filePath)).toBe(true);
  });

  it("skips a file that was already imported (no re-import on re-scan)", async () => {
    const { service, saveFile } = makeService({ mode: "library", alreadyImported: true });
    await service.handleFile("/watched", "/watched/by-printer/prusa-mini/part.gcode");
    expect(saveFile).not.toHaveBeenCalled();
  });
});

describe("WatchedFolderService.ensureTargetFolders", () => {
  it("creates by-printer and by-tag subfolders for each printer and tag", async () => {
    const { service } = makeService({ printers: ["Prusa Mini #1"], tags: ["voron-fleet"] });
    const root = tmpRoot();
    await service.ensureTargetFolders(root);
    expect(fs.existsSync(path.join(root, "by-printer", "Prusa Mini #1"))).toBe(true);
    expect(fs.existsSync(path.join(root, "by-tag", "voron-fleet"))).toBe(true);
  });

  it("skips names with filesystem-invalid characters", async () => {
    const { service, logger } = makeService({ printers: ["bad/name"] });
    const root = tmpRoot();
    await service.ensureTargetFolders(root);
    expect(fs.readdirSync(path.join(root, "by-printer"))).toHaveLength(0);
    expect(logger.warn).toHaveBeenCalled();
  });
});
