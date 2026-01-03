import path from "node:path";
import fs from "node:fs";
import { setupTestApp } from "../test-server";
import { DITokens } from "@/container.tokens";
import { PrintJobService } from "@/services/orm/print-job.service";
import { FileAnalysisService } from "@/services/file-analysis.service";
import { createTestPrinter } from "../api/test-data/create-printer";

describe("PrintJobService", () => {
  let service: PrintJobService;
  let fileAnalysisService: FileAnalysisService;
  let testRequest: any;

  beforeAll(async () => {
    const { container, request } = await setupTestApp(false, undefined, true, false);
    service = container.resolve<PrintJobService>(DITokens.printJobService);
    fileAnalysisService = container.resolve<FileAnalysisService>(DITokens.fileAnalysisService);
    testRequest = request;
  });

  describe("lifecycle", () => {
    it("creates a job on start and locks on finish", async () => {
      const printer = await createTestPrinter(testRequest);
      const fileName = "test.gcode";

      const started = await service.markStarted(printer.id, fileName);
      expect(started).toBeTruthy();
      expect(started?.status).toBe("PRINTING");

      await service.markProgress(printer.id, fileName, 50);
      const finished = await service.markFinished(printer.id, fileName);
      expect(finished).toBeTruthy();
      expect(finished?.status).toBe("COMPLETED");
      expect(finished?.endedAt).toBeTruthy();
    });

    it("sets FAILED with reason on cancel", async () => {
      const printer = await createTestPrinter(testRequest);
      const fileName = "cancel.gcode";

      await service.markStarted(printer.id, fileName);
      const failed = await service.markFailed(printer.id, fileName, "Cancelled");
      expect(failed).toBeTruthy();
      expect(failed?.status).toBe("FAILED");
      expect(failed?.statusReason).toBe("Cancelled");
    });
  });

  describe("metadata extraction", () => {
    it("extracts metadata from gcode file", async () => {
      const gcodePath = path.join(__dirname, "..", "api", "test-data", "sample.gcode");
      const { metadata } = await fileAnalysisService.analyzeFile(gcodePath);

      expect(metadata.nozzleDiameterMm).toBe(0.4);
      expect(metadata.filamentDiameterMm).toBe(1.75);
      expect(metadata.filamentDensityGramsCm3).toBe(1.24);
      expect(metadata.filamentUsedGrams).toBe(13.93);
      expect(metadata.gcodePrintTimeSeconds).toBe(5477); // 1h 31m 17s
    });

    it("extracts metadata from real bgcode file", async () => {
      const bgcodePath = path.join(
        __dirname,
        "..",
        "api",
        "test-data",
        "Shape-Box_0.4n_0.2mm_PLA_MK4ISMMU3_20m.bgcode"
      );
      const { metadata } = await fileAnalysisService.analyzeFile(bgcodePath);

      expect(metadata.nozzleDiameterMm).toBe(0.4);
      expect(metadata.filamentUsedMm).toBeCloseTo(2067.9, 1);
      expect(metadata.filamentUsedGrams).toBeCloseTo(6.17, 1);
      expect(metadata.filamentUsedCm3).toBeCloseTo(4.97, 1);
      expect(metadata.gcodePrintTimeSeconds).toBe(1198); // 19m 58s
    });

    it("extracts metadata from 3mf with metadata.json", async () => {
      const AdmZip = require("adm-zip");
      const zip = new AdmZip();
      zip.addFile(
        "metadata.json",
        Buffer.from(
          JSON.stringify({
            nozzleDiameter: 0.4,
            estimatedPrintTimeSec: 600,
            filamentDiameter: 1.75,
            filamentDensity: 1.25,
            filamentUsedGrams: 10,
          }),
          "utf8"
        )
      );
      const tmp = path.join(__dirname, "..", "api", "test-data", "test-metadata.3mf");
      zip.writeZip(tmp);

      try {
        const { metadata } = await fileAnalysisService.analyzeFile(tmp);
        expect(metadata.nozzleDiameterMm).toBe(0.4);
        expect(metadata.gcodePrintTimeSeconds).toBe(600);
        expect(metadata.filamentUsedGrams).toBe(10);
      } finally {
        fs.unlinkSync(tmp);
      }
    });
  });
});
