import { setupTestApp } from "../test-server";
import { createTestPrinter } from "./test-data/create-printer";
import { DITokens } from "@/container.tokens";
import { PrintJobService } from "@/services/orm/print-job.service";
import { AppConstants } from "@/server.constants";

describe("PrintJobController", () => {
  let testRequest: any;
  let printJobService: PrintJobService;
  const baseRoute = `${AppConstants.apiRoute}/print-jobs`;

  beforeAll(async () => {
    const { request, container } = await setupTestApp(false, undefined, true, false);
    testRequest = request;
    printJobService = container.resolve<PrintJobService>(DITokens.printJobService);
  });

  it("GET /print-jobs/search returns array", async () => {
    const res = await testRequest.get(`${baseRoute}/search`).set("Accept", "application/json");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("GET /print-jobs/search-paged returns paged result", async () => {
    const res = await testRequest
      .get(`${baseRoute}/search-paged?page=1&pageSize=5`)
      .set("Accept", "application/json");
    expect(res.status).toBe(200);
    expect(typeof res.body).toBe("object");
    expect(Array.isArray(res.body.items)).toBe(true);
    expect(typeof res.body.count).toBe("number");
    expect(typeof res.body.pages).toBe("number");
  });

  describe("GET /print-jobs/:id", () => {
    it("should get single job", async () => {
      const printer = await createTestPrinter(testRequest);
      const job = await printJobService.markStarted(printer.id, "test-get.gcode");

      const res = await testRequest
        .get(`${baseRoute}/${job!.id}`)
        .set("Accept", "application/json");

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(job!.id);
      expect(res.body.fileName).toBe("test-get.gcode");
      expect(res.body.printerId).toBe(printer.id);
    });

    it("should return 404 for non-existent job", async () => {
      const res = await testRequest
        .get(`${baseRoute}/999999`)
        .set("Accept", "application/json");

      expect(res.status).toBe(404);
      expect(res.body.error).toContain("not found");
    });
  });

  describe("Status setting endpoints", () => {
    describe("POST /print-jobs/:id/set-completed", () => {
      it("should mark UNKNOWN job as COMPLETED", async () => {
        const printer = await createTestPrinter(testRequest);
        const job = await printJobService.markStarted(printer.id, "test-set-completed.gcode");

        // Set to UNKNOWN first
        job!.status = "UNKNOWN";
        await printJobService.printJobRepository.save(job!);

        const res = await testRequest
          .post(`${baseRoute}/${job!.id}/set-completed`)
          .set("Accept", "application/json");

        expect(res.status).toBe(200);
        expect(res.body.message).toBe("Job marked as completed");
        expect(res.body.previousStatus).toBe("UNKNOWN");
        expect(res.body.newStatus).toBe("COMPLETED");

        const updatedJob = await printJobService.printJobRepository.findOne({ where: { id: job!.id } });
        expect(updatedJob?.status).toBe("COMPLETED");
        expect(updatedJob?.endedAt).toBeTruthy();
        expect(updatedJob?.progress).toBe(100);
      });

      it("should reject marking non-UNKNOWN job as COMPLETED", async () => {
        const printer = await createTestPrinter(testRequest);
        const job = await printJobService.markStarted(printer.id, "test-printing-completed.gcode");

        const res = await testRequest
          .post(`${baseRoute}/${job!.id}/set-completed`)
          .set("Accept", "application/json");

        expect(res.status).toBe(400);
        expect(res.body.error).toContain("Can only mark UNKNOWN jobs");
      });
    });

    describe("POST /print-jobs/:id/set-failed", () => {
      it("should mark PRINTING job as FAILED", async () => {
        const printer = await createTestPrinter(testRequest);
        const job = await printJobService.markStarted(printer.id, "test-failed.gcode");

        const res = await testRequest
          .post(`${baseRoute}/${job!.id}/set-failed`)
          .set("Accept", "application/json");

        expect(res.status).toBe(200);
        expect(res.body.message).toBe("Job marked as failed");
        expect(res.body.previousStatus).toBe("PRINTING");
        expect(res.body.newStatus).toBe("FAILED");

        // Verify job was updated
        const updatedJob = await printJobService.printJobRepository.findOne({ where: { id: job!.id } });
        expect(updatedJob?.status).toBe("FAILED");
        expect(updatedJob?.endedAt).toBeTruthy();
        expect(updatedJob?.statusReason).toBe("Manually marked as failed by user");
        expect(updatedJob?.statistics?.failureReason).toBe("Manually marked as failed by user");
      });

      it("should mark UNKNOWN job as FAILED", async () => {
        const printer = await createTestPrinter(testRequest);
        const job = await printJobService.markStarted(printer.id, "test-unknown-failed.gcode");

        // Set to UNKNOWN first
        job!.status = "UNKNOWN";
        await printJobService.printJobRepository.save(job!);

        const res = await testRequest
          .post(`${baseRoute}/${job!.id}/set-failed`)
          .set("Accept", "application/json");

        expect(res.status).toBe(200);
        expect(res.body.previousStatus).toBe("UNKNOWN");
        expect(res.body.newStatus).toBe("FAILED");
      });

      it("should allow marking COMPLETED job as FAILED", async () => {
        const printer = await createTestPrinter(testRequest);
        const job = await printJobService.markStarted(printer.id, "test-completed.gcode");
        await printJobService.markFinished(printer.id, "test-completed.gcode");

        const res = await testRequest
          .post(`${baseRoute}/${job!.id}/set-failed`)
          .set("Accept", "application/json");

        expect(res.status).toBe(200);
        expect(res.body.message).toBe("Job marked as failed");
        expect(res.body.previousStatus).toBe("COMPLETED");
        expect(res.body.newStatus).toBe("FAILED");
      });

      it("should return 404 for non-existent job", async () => {
        const res = await testRequest
          .post(`${baseRoute}/999999/set-failed`)
          .set("Accept", "application/json");

        expect(res.status).toBe(404);
        expect(res.body.error).toContain("not found");
      });
    });

    describe("POST /print-jobs/:id/set-cancelled", () => {
      it("should mark PRINTING job as CANCELLED", async () => {
        const printer = await createTestPrinter(testRequest);
        const job = await printJobService.markStarted(printer.id, "test-cancelled.gcode");

        const res = await testRequest
          .post(`${baseRoute}/${job!.id}/set-cancelled`)
          .set("Accept", "application/json");

        expect(res.status).toBe(200);
        expect(res.body.message).toBe("Job marked as cancelled");
        expect(res.body.previousStatus).toBe("PRINTING");
        expect(res.body.newStatus).toBe("CANCELLED");

        // Verify job was updated
        const updatedJob = await printJobService.printJobRepository.findOne({ where: { id: job!.id } });
        expect(updatedJob?.status).toBe("CANCELLED");
        expect(updatedJob?.endedAt).toBeTruthy();
        expect(updatedJob?.statusReason).toBe("Manually marked as cancelled by user");
      });

      it("should mark PAUSED job as CANCELLED", async () => {
        const printer = await createTestPrinter(testRequest);
        const job = await printJobService.markStarted(printer.id, "test-paused-cancelled.gcode");
        await printJobService.handlePrintPaused(printer.id);

        const res = await testRequest
          .post(`${baseRoute}/${job!.id}/set-cancelled`)
          .set("Accept", "application/json");

        expect(res.status).toBe(200);
        expect(res.body.previousStatus).toBe("PAUSED");
        expect(res.body.newStatus).toBe("CANCELLED");
      });

      it("should calculate actual print time for cancelled job", async () => {
        const printer = await createTestPrinter(testRequest);
        const job = await printJobService.markStarted(printer.id, "test-time-cancelled.gcode");

        // Wait a bit to have actual print time
        await new Promise(resolve => setTimeout(resolve, 100));

        const res = await testRequest
          .post(`${baseRoute}/${job!.id}/set-cancelled`)
          .set("Accept", "application/json");

        expect(res.status).toBe(200);

        const updatedJob = await printJobService.printJobRepository.findOne({ where: { id: job!.id } });
        expect(updatedJob?.statistics?.actualPrintTimeSeconds).toBeGreaterThan(0);
      });

      it("should reject marking COMPLETED job as CANCELLED", async () => {
        const printer = await createTestPrinter(testRequest);
        const job = await printJobService.markStarted(printer.id, "test-completed-cancel.gcode");
        await printJobService.markFinished(printer.id, "test-completed-cancel.gcode");

        const res = await testRequest
          .post(`${baseRoute}/${job!.id}/set-cancelled`)
          .set("Accept", "application/json");

        expect(res.status).toBe(400);
        expect(res.body.error).toContain("Can only mark UNKNOWN, PRINTING, or PAUSED jobs");
      });
    });

    describe("POST /print-jobs/:id/set-unknown", () => {
      it("should mark PRINTING job as UNKNOWN", async () => {
        const printer = await createTestPrinter(testRequest);
        const job = await printJobService.markStarted(printer.id, "test-unknown.gcode");

        const res = await testRequest
          .post(`${baseRoute}/${job!.id}/set-unknown`)
          .set("Accept", "application/json");

        expect(res.status).toBe(200);
        expect(res.body.message).toBe("Job marked as unknown");
        expect(res.body.previousStatus).toBe("PRINTING");
        expect(res.body.newStatus).toBe("UNKNOWN");

        // Verify job was updated
        const updatedJob = await printJobService.printJobRepository.findOne({ where: { id: job!.id } });
        expect(updatedJob?.status).toBe("UNKNOWN");
        expect(updatedJob?.statusReason).toBe("Manually marked as unknown by user (state uncertain)");
        // UNKNOWN jobs should NOT have endedAt set (outcome is uncertain)
        expect(updatedJob?.endedAt).toBeFalsy();
      });

      it("should mark PAUSED job as UNKNOWN", async () => {
        const printer = await createTestPrinter(testRequest);
        const job = await printJobService.markStarted(printer.id, "test-paused-unknown.gcode");
        await printJobService.handlePrintPaused(printer.id);

        const res = await testRequest
          .post(`${baseRoute}/${job!.id}/set-unknown`)
          .set("Accept", "application/json");

        expect(res.status).toBe(200);
        expect(res.body.previousStatus).toBe("PAUSED");
        expect(res.body.newStatus).toBe("UNKNOWN");
      });

      it("should reject marking COMPLETED job as UNKNOWN", async () => {
        const printer = await createTestPrinter(testRequest);
        const job = await printJobService.markStarted(printer.id, "test-completed-unknown.gcode");
        await printJobService.markFinished(printer.id, "test-completed-unknown.gcode");

        const res = await testRequest
          .post(`${baseRoute}/${job!.id}/set-unknown`)
          .set("Accept", "application/json");

        expect(res.status).toBe(400);
        expect(res.body.error).toContain("Can only mark PRINTING or PAUSED jobs");
        expect(res.body.suggestion).toContain("uncertain state");
      });

      it("should reject marking PENDING job as UNKNOWN", async () => {
        const printer = await createTestPrinter(testRequest);

        // Create a PENDING job
        const job = await printJobService.createPendingJob(
          printer.id,
          "test-pending.gcode",
          {
            fileName: "test-pending.gcode",
            fileFormat: "gcode",
            gcodePrintTimeSeconds: null,
            nozzleDiameterMm: null,
            filamentDiameterMm: null,
            filamentDensityGramsCm3: null,
            filamentUsedMm: null,
            filamentUsedCm3: null,
            filamentUsedGrams: null,
            totalFilamentUsedGrams: null,
            layerHeight: null,
            firstLayerHeight: null,
            bedTemperature: null,
            nozzleTemperature: null,
            fillDensity: null,
            filamentType: null,
            printerModel: null,
            slicerVersion: null,
            maxLayerZ: null,
            totalLayers: null,
          }
        );

        const res = await testRequest
          .post(`${baseRoute}/${job.id}/set-unknown`)
          .set("Accept", "application/json");

        expect(res.status).toBe(400);
        expect(res.body.error).toContain("Can only mark PRINTING or PAUSED jobs");
      });

      it("should return 404 for non-existent job", async () => {
        const res = await testRequest
          .post(`${baseRoute}/999999/set-unknown`)
          .set("Accept", "application/json");

        expect(res.status).toBe(404);
        expect(res.body.error).toContain("not found");
      });
    });
  });

  describe("DELETE /print-jobs/:id", () => {
    it("should delete job without file", async () => {
      const printer = await createTestPrinter(testRequest);
      const job = await printJobService.createPendingJob(printer.id, "test-delete.gcode", {
        fileName: "test-delete.gcode",
        fileFormat: "gcode",
        gcodePrintTimeSeconds: null,
        nozzleDiameterMm: null,
        filamentDiameterMm: null,
        filamentDensityGramsCm3: null,
        filamentUsedMm: null,
        filamentUsedCm3: null,
        filamentUsedGrams: null,
        totalFilamentUsedGrams: null,
        layerHeight: null,
        firstLayerHeight: null,
        bedTemperature: null,
        nozzleTemperature: null,
        fillDensity: null,
        filamentType: null,
        printerModel: null,
        slicerVersion: null,
        maxLayerZ: null,
        totalLayers: null,
      });

      const res = await testRequest
        .delete(`${baseRoute}/${job.id}`)
        .set("Accept", "application/json");

      expect(res.status).toBe(200);
      expect(res.body.message).toContain("Job deleted");
      expect(res.body.jobId).toBe(job.id);

      // Verify job was deleted
      const deletedJob = await printJobService.printJobRepository.findOne({ where: { id: job.id } });
      expect(deletedJob).toBeNull();
    });

    it("should reject deleting active print job", async () => {
      const printer = await createTestPrinter(testRequest);
      const job = await printJobService.markStarted(printer.id, "test-active-delete.gcode");

      const res = await testRequest
        .delete(`${baseRoute}/${job!.id}`)
        .set("Accept", "application/json");

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("Cannot delete active print job");
    });
  });

  describe("POST /print-jobs/from-file", () => {
    it("should return 400 for missing fileStorageId", async () => {
      const res = await testRequest
        .post(`${baseRoute}/from-file`)
        .send({ printerId: 1 })
        .set("Accept", "application/json");

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("fileStorageId is required");
    });

    it("should return 400 for missing printerId", async () => {
      const res = await testRequest
        .post(`${baseRoute}/from-file`)
        .send({ fileStorageId: "test-file-id" })
        .set("Accept", "application/json");

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("printerId is required");
    });
  });
});
