import { setupTestApp } from "../test-server";
import { createTestPrinter } from "./test-data/create-printer";
import { DITokens } from "@/container.tokens";
import { PrinterCache } from "@/state/printer.cache";
import { AppConstants } from "@/server.constants";
import { asValue } from "awilix";
import type { PrinterDto } from "@/services/interfaces/printer.dto";

describe("RoutingController", () => {
  let testRequest: any;
  let printerCache: PrinterCache;
  let loadMetadata: ReturnType<typeof vi.fn>;
  let printer: PrinterDto;
  const baseRoute = `${AppConstants.apiRoute}/routing`;

  beforeAll(async () => {
    // Mock file storage so a stored file's routingTarget can be injected
    loadMetadata = vi.fn();
    const mockFileStorageService = {
      loadMetadata,
      ensureStorageDirectories: vi.fn().mockResolvedValue(undefined),
    };

    const { request, container } = await setupTestApp(
      false,
      { [DITokens.fileStorageService]: asValue(mockFileStorageService) },
      true,
      false,
    );

    testRequest = request;
    printerCache = container.resolve<PrinterCache>(DITokens.printerCache);
    printer = await createTestPrinter(testRequest);
    await printerCache.loadCache();
  });

  it("resolves a file's routingTarget to a matching printer", async () => {
    loadMetadata.mockResolvedValue({ routingTarget: printer.name });

    const res = await testRequest.get(`${baseRoute}/resolve/some-file-id`).set("Accept", "application/json");

    expect(res.status).toBe(200);
    expect(res.body.kind).toBe("printer");
    expect(res.body.matchedName).toBe(printer.name);
    expect(res.body.printerIds).toEqual([printer.id]);
  });

  it("returns kind 'none' when the routing target matches nothing", async () => {
    loadMetadata.mockResolvedValue({ routingTarget: "no-such-printer-or-tag" });

    const res = await testRequest.get(`${baseRoute}/resolve/some-file-id`).set("Accept", "application/json");

    expect(res.status).toBe(200);
    expect(res.body.kind).toBe("none");
    expect(res.body.printerIds).toEqual([]);
  });

  it("queues a job when a file resolves to exactly one printer", async () => {
    loadMetadata.mockResolvedValue({
      routingTarget: printer.name,
      _originalFileName: "routed.gcode",
      _fileHash: "hash-xyz",
      fileFormat: "gcode",
    });

    const res = await testRequest.post(`${baseRoute}/queue/some-file-id`).send({});

    expect(res.status).toBe(200);
    expect(res.body.queued).toBe(true);
    expect(res.body.printerId).toBe(printer.id);
    expect(res.body.jobId).toBeGreaterThan(0);
  });
});
