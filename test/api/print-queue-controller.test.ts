import { setupTestApp } from "../test-server";
import { createTestPrinter } from "./test-data/create-printer";
import { DITokens } from "@/container.tokens";
import { PrintJobService } from "@/services/orm/print-job.service";
import { PrintQueueService } from "@/services/print-queue.service";
import { FileStorageService } from "@/services/file-storage.service";
import { PrinterApiFactory } from "@/services/printer-api.factory";
import { AppConstants } from "@/server.constants";
import { asValue } from "awilix";

describe("PrintQueueController", () => {
  let testRequest: any;
  let printJobService: PrintJobService;
  let printQueueService: PrintQueueService;
  let fileStorageService: FileStorageService;
  let printerApiFactory: PrinterApiFactory;
  const baseRoute = `${AppConstants.apiRoute}/print-queue`;

  beforeAll(async () => {
    // Mock printer API factory to prevent actual file uploads
    const mockPrinterApi = {
      uploadFile: jest.fn().mockResolvedValue(undefined),
    };
    const mockPrinterApiFactory = {
      getById: jest.fn().mockReturnValue(mockPrinterApi),
    };

    // Mock file storage service to prevent writing to real media folder
    const mockFileStorageService = {
      saveFile: jest.fn().mockResolvedValue("mock-file-storage-id"),
      ensureStorageDirectories: jest.fn().mockResolvedValue(undefined),
      getFilePath: jest.fn().mockReturnValue("/mock/path/file.gcode"),
      readFile: jest.fn().mockReturnValue(Buffer.from("; mock gcode\nG28\n")),
    };

    const { request, container } = await setupTestApp(false, {
      [DITokens.printerApiFactory]: asValue(mockPrinterApiFactory),
      [DITokens.fileStorageService]: asValue(mockFileStorageService)
    }, true, false);

    testRequest = request;
    printJobService = container.resolve<PrintJobService>(DITokens.printJobService);
    printQueueService = container.resolve<PrintQueueService>(DITokens.printQueueService);
    fileStorageService = container.resolve<FileStorageService>(DITokens.fileStorageService);
    printerApiFactory = container.resolve<PrinterApiFactory>(DITokens.printerApiFactory);
  });

  describe("GET /print-queue - Global Queue", () => {
    it("should return paginated global queue", async () => {
      const res = await testRequest
        .get(`${baseRoute}?page=1&pageSize=50`)
        .set("Accept", "application/json");

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("items");
      expect(res.body).toHaveProperty("page");
      expect(res.body).toHaveProperty("pageSize");
      expect(res.body).toHaveProperty("totalCount");
      expect(res.body).toHaveProperty("totalPages");
      expect(Array.isArray(res.body.items)).toBe(true);
    });

    it("should validate page parameters", async () => {
      const res = await testRequest
        .get(`${baseRoute}?page=0&pageSize=300`)
        .set("Accept", "application/json");

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("Invalid page or pageSize");
    });

    it("should return queued jobs with correct structure", async () => {
      const printer = await createTestPrinter(testRequest);
      const job = await printJobService.createPendingJob(printer.id, "test-queue.gcode", {
        fileName: "test-queue.gcode",
        fileFormat: "gcode",
        gcodePrintTimeSeconds: 3600,
        filamentUsedGrams: 50,
        nozzleDiameterMm: null,
        filamentDiameterMm: null,
        filamentDensityGramsCm3: null,
        filamentUsedMm: null,
        filamentUsedCm3: null,
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

      await printQueueService.addToQueue(printer.id, job.id);

      const res = await testRequest
        .get(`${baseRoute}?page=1&pageSize=50`)
        .set("Accept", "application/json");

      expect(res.status).toBe(200);
      const queueItem = res.body.items.find((item: any) => item.jobId === job.id);
      expect(queueItem).toBeDefined();
      expect(queueItem.fileName).toBe("test-queue.gcode");
      expect(queueItem.printerId).toBe(printer.id);
      expect(queueItem.status).toBe("QUEUED");
      expect(queueItem.queuePosition).toBeGreaterThanOrEqual(0);
    });
  });

  describe("GET /print-queue/:printerId - Printer Queue", () => {
    it("should return queue for specific printer", async () => {
      const printer = await createTestPrinter(testRequest);

      const res = await testRequest
        .get(`${baseRoute}/${printer.id}`)
        .set("Accept", "application/json");

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("printerId", printer.id);
      expect(res.body).toHaveProperty("queue");
      expect(res.body).toHaveProperty("count");
      expect(Array.isArray(res.body.queue)).toBe(true);
    });

    it("should validate printer ID", async () => {
      const res = await testRequest
        .get(`${baseRoute}/invalid`)
        .set("Accept", "application/json");

      expect(res.status).toBe(400);
      expect(res.text).toContain("Invalid number: printerId");
    });

    it("should return empty queue for printer with no queued jobs", async () => {
      const printer = await createTestPrinter(testRequest);

      const res = await testRequest
        .get(`${baseRoute}/${printer.id}`)
        .set("Accept", "application/json");

      expect(res.status).toBe(200);
      expect(res.body.queue).toEqual([]);
      expect(res.body.count).toBe(0);
    });
  });

  describe("POST /print-queue/:printerId/add/:jobId - Add to Queue", () => {
    it("should add job to queue", async () => {
      const printer = await createTestPrinter(testRequest);
      const job = await printJobService.createPendingJob(printer.id, "test-add.gcode", {
        fileName: "test-add.gcode",
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
        .post(`${baseRoute}/${printer.id}/add/${job.id}`)
        .set("Accept", "application/json")
        .send({});

      expect(res.status).toBe(200);
      expect(res.body.message).toContain("Job added to queue");
      expect(res.body.printerId).toBe(printer.id);
      expect(res.body.jobId).toBe(job.id);

      // Verify job is in queue
      const updatedJob = await printJobService.printJobRepository.findOne({ where: { id: job.id } });
      expect(updatedJob?.status).toBe("QUEUED");
      expect(updatedJob?.queuePosition).toBeGreaterThanOrEqual(0);
    });

    it("should add job at specific position", async () => {
      const printer = await createTestPrinter(testRequest);
      const job1 = await printJobService.createPendingJob(printer.id, "test-pos1.gcode", {
        fileName: "test-pos1.gcode",
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

      const job2 = await printJobService.createPendingJob(printer.id, "test-pos2.gcode", {
        fileName: "test-pos2.gcode",
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

      // Add first job
      await testRequest
        .post(`${baseRoute}/${printer.id}/add/${job1.id}`)
        .set("Accept", "application/json")
        .send({});

      // Add second job at position 0 (front of queue)
      const res = await testRequest
        .post(`${baseRoute}/${printer.id}/add/${job2.id}`)
        .set("Accept", "application/json")
        .send({ position: 0 });

      expect(res.status).toBe(200);

      // Verify job2 is at position 0
      const updatedJob2 = await printJobService.printJobRepository.findOne({ where: { id: job2.id } });
      expect(updatedJob2?.queuePosition).toBe(0);

      // Verify job1 was shifted to position 1
      const updatedJob1 = await printJobService.printJobRepository.findOne({ where: { id: job1.id } });
      expect(updatedJob1?.queuePosition).toBe(1);
    });

    it("should validate printer ID and job ID", async () => {
      const res = await testRequest
        .post(`${baseRoute}/invalid/add/invalid`)
        .set("Accept", "application/json")
        .send({});

      expect(res.status).toBe(400);
      expect(res.text).toContain("Invalid number: printerId");
    });

    it("should return error for non-existent job", async () => {
      const printer = await createTestPrinter(testRequest);

      const res = await testRequest
        .post(`${baseRoute}/${printer.id}/add/999999`)
        .set("Accept", "application/json")
        .send({});

      expect(res.status).toBe(500);
      expect(res.body.error).toContain("Failed to add to queue");
    });
  });

  describe("Remove print-queue :printerId :jobId - Remove from Queue", () => {
    it("should remove job from queue", async () => {
      const printer = await createTestPrinter(testRequest);
      const job = await printJobService.createPendingJob(printer.id, "test-remove.gcode", {
        fileName: "test-remove.gcode",
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

      // Add to queue first
      await printQueueService.addToQueue(printer.id, job.id);

      // Remove from queue
      const res = await testRequest
        .delete(`${baseRoute}/${printer.id}/${job.id}`)
        .set("Accept", "application/json");

      expect(res.status).toBe(200);
      expect(res.body.message).toContain("Job removed from queue");
      expect(res.body.printerId).toBe(printer.id);
      expect(res.body.jobId).toBe(job.id);

      // Verify job is no longer in queue
      const updatedJob = await printJobService.printJobRepository.findOne({ where: { id: job.id } });
      expect(updatedJob?.queuePosition).toBeNull();
      expect(updatedJob?.status).toBe("PENDING");
    });

    it("should compact queue positions after removal", async () => {
      const printer = await createTestPrinter(testRequest);
      const jobs = [];

      // Create and queue 3 jobs
      for (let i = 0; i < 3; i++) {
        const job = await printJobService.createPendingJob(printer.id, `test-compact${i}.gcode`, {
          fileName: `test-compact${i}.gcode`,
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
        await printQueueService.addToQueue(printer.id, job.id);
        jobs.push(job);
      }

      // Remove middle job
      await testRequest
        .delete(`${baseRoute}/${printer.id}/${jobs[1].id}`)
        .set("Accept", "application/json");

      // Verify positions are compacted
      const job0 = await printJobService.printJobRepository.findOne({ where: { id: jobs[0].id } });
      const job2 = await printJobService.printJobRepository.findOne({ where: { id: jobs[2].id } });

      expect(job0?.queuePosition).toBe(0);
      expect(job2?.queuePosition).toBe(1); // Should be compacted from 2 to 1
    });

    it("should validate printer ID and job ID", async () => {
      const res = await testRequest
        .delete(`${baseRoute}/invalid/invalid`)
        .set("Accept", "application/json");

      expect(res.status).toBe(400);
      expect(res.text).toContain("Invalid number: printerId");
    });
  });

  describe("PUT /print-queue/:printerId/reorder - Reorder Queue", () => {
    it("should reorder queue jobs", async () => {
      const printer = await createTestPrinter(testRequest);
      const jobs = [];

      // Create and queue 3 jobs
      for (let i = 0; i < 3; i++) {
        const job = await printJobService.createPendingJob(printer.id, `test-reorder${i}.gcode`, {
          fileName: `test-reorder${i}.gcode`,
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
        await printQueueService.addToQueue(printer.id, job.id);
        jobs.push(job);
      }

      // Reverse the order
      const newOrder = [jobs[2].id, jobs[1].id, jobs[0].id];

      const res = await testRequest
        .put(`${baseRoute}/${printer.id}/reorder`)
        .set("Accept", "application/json")
        .send({ jobIds: newOrder });

      expect(res.status).toBe(200);
      expect(res.body.message).toContain("Queue reordered");

      // Verify new positions
      const job0 = await printJobService.printJobRepository.findOne({ where: { id: jobs[0].id } });
      const job1 = await printJobService.printJobRepository.findOne({ where: { id: jobs[1].id } });
      const job2 = await printJobService.printJobRepository.findOne({ where: { id: jobs[2].id } });

      expect(job2?.queuePosition).toBe(0);
      expect(job1?.queuePosition).toBe(1);
      expect(job0?.queuePosition).toBe(2);
    });

    it("should validate printer ID", async () => {
      const res = await testRequest
        .put(`${baseRoute}/invalid/reorder`)
        .set("Accept", "application/json")
        .send({ jobIds: [1, 2, 3] });

      expect(res.status).toBe(400);
      expect(res.text).toContain("Invalid number: printerId");
    });

    it("should validate jobIds array", async () => {
      const printer = await createTestPrinter(testRequest);

      const res = await testRequest
        .put(`${baseRoute}/${printer.id}/reorder`)
        .set("Accept", "application/json")
        .send({ jobIds: "not-an-array" });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("jobIds must be an array");
    });
  });

  describe("DELETE /print-queue/:printerId/clear - Clear Queue", () => {
    it("should clear all jobs from printer queue", async () => {
      const printer = await createTestPrinter(testRequest);

      // Add multiple jobs to queue
      for (let i = 0; i < 3; i++) {
        const job = await printJobService.createPendingJob(printer.id, `test-clear${i}.gcode`, {
          fileName: `test-clear${i}.gcode`,
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
        await printQueueService.addToQueue(printer.id, job.id);
      }

      const res = await testRequest
        .delete(`${baseRoute}/${printer.id}/clear`)
        .set("Accept", "application/json");

      expect(res.status).toBe(200);
      expect(res.body.message).toContain("Queue cleared");
      expect(res.body.printerId).toBe(printer.id);

      // Verify queue is empty
      const queue = await printQueueService.getQueue(printer.id);
      expect(queue).toHaveLength(0);
    });

    it("should validate printer ID", async () => {
      const res = await testRequest
        .delete(`${baseRoute}/invalid/clear`)
        .set("Accept", "application/json");

      expect(res.status).toBe(400);
      expect(res.text).toContain("Invalid number: printerId");
    });
  });

  describe("GET /print-queue/:printerId/next - Get Next Job", () => {
    it("should return next job in queue", async () => {
      const printer = await createTestPrinter(testRequest);
      const job = await printJobService.createPendingJob(printer.id, "test-next.gcode", {
        fileName: "test-next.gcode",
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
      await printQueueService.addToQueue(printer.id, job.id);

      const res = await testRequest
        .get(`${baseRoute}/${printer.id}/next`)
        .set("Accept", "application/json");

      expect(res.status).toBe(200);
      expect(res.body.printerId).toBe(printer.id);
      expect(res.body.nextJob).toBeDefined();
      expect(res.body.nextJob.id).toBe(job.id);
      expect(res.body.nextJob.fileName).toBe("test-next.gcode");
    });

    it("should return null when queue is empty", async () => {
      const printer = await createTestPrinter(testRequest);

      const res = await testRequest
        .get(`${baseRoute}/${printer.id}/next`)
        .set("Accept", "application/json");

      expect(res.status).toBe(200);
      expect(res.body.nextJob).toBeNull();
    });

    it("should validate printer ID", async () => {
      const res = await testRequest
        .get(`${baseRoute}/invalid/next`)
        .set("Accept", "application/json");

      expect(res.status).toBe(400);
      expect(res.text).toContain("Invalid number: printerId");
    });
  });

  describe("POST /print-queue/:printerId/process - Process Queue", () => {
    it("should start next job in queue", async () => {
      const printer = await createTestPrinter(testRequest);
      const job = await printJobService.createPendingJob(printer.id, "test-process.gcode", {
        fileName: "test-process.gcode",
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
      await printQueueService.addToQueue(printer.id, job.id);

      const res = await testRequest
        .post(`${baseRoute}/${printer.id}/process`)
        .set("Accept", "application/json");

      expect(res.status).toBe(200);
      expect(res.body.message).toContain("Processing next job");
      expect(res.body.printerId).toBe(printer.id);
      expect(res.body.nextJob).toBeDefined();
    });

    it("should return message when queue is empty", async () => {
      const printer = await createTestPrinter(testRequest);

      const res = await testRequest
        .post(`${baseRoute}/${printer.id}/process`)
        .set("Accept", "application/json");

      expect(res.status).toBe(200);
      expect(res.body.message).toContain("Queue is empty");
      expect(res.body.nextJob).toBeNull();
    });

    it("should validate printer ID", async () => {
      const res = await testRequest
        .post(`${baseRoute}/invalid/process`)
        .set("Accept", "application/json");

      expect(res.status).toBe(400);
      expect(res.text).toContain("Invalid number: printerId");
    });
  });

  describe("POST /print-queue/:printerId/submit/:jobId - Submit to Printer", () => {
    it("should submit job directly to printer", async () => {
      const printer = await createTestPrinter(testRequest);
      const job = await printJobService.createPendingJob(printer.id, "test-submit.gcode", {
        fileName: "test-submit.gcode",
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

      // Create a test file in storage
      const testFileContent = Buffer.from("; test gcode\nG28\nG1 X10 Y10\nM104 S0\nM140 S0\n");
      const mockFile = {
        originalname: "test-submit.gcode",
        buffer: testFileContent,
      } as Express.Multer.File;
      job.fileStorageId = await fileStorageService.saveFile(mockFile);
      await printJobService.printJobRepository.save(job);

      const res = await testRequest
        .post(`${baseRoute}/${printer.id}/submit/${job.id}`)
        .set("Accept", "application/json");

      expect(res.status).toBe(200);
      expect(res.body.message).toContain("Job submitted to printer");
      expect(res.body.printerId).toBe(printer.id);
      expect(res.body.jobId).toBe(job.id);
    });

    it("should submit queued job and remove from queue", async () => {
      const printer = await createTestPrinter(testRequest);
      const job = await printJobService.createPendingJob(printer.id, "test-submit-queued.gcode", {
        fileName: "test-submit-queued.gcode",
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

      // Create a test file in storage
      const testFileContent = Buffer.from("; test gcode\nG28\nG1 X10 Y10\nM104 S0\nM140 S0\n");
      const mockFile = {
        originalname: "test-submit-queued.gcode",
        buffer: testFileContent,
      } as Express.Multer.File;

      job.fileStorageId = await fileStorageService.saveFile(mockFile);
      await printJobService.printJobRepository.save(job);

      // Add to queue first
      await printQueueService.addToQueue(printer.id, job.id);

      const res = await testRequest
        .post(`${baseRoute}/${printer.id}/submit/${job.id}`)
        .set("Accept", "application/json");

      expect(res.status).toBe(200);

      // Verify job is no longer queued
      const updatedJob = await printJobService.printJobRepository.findOne({ where: { id: job.id } });
      expect(updatedJob?.queuePosition).toBeNull();
      expect(["PRINTING"]).toContain(updatedJob?.status);
    });

    it("should validate printer ID and job ID", async () => {
      const res = await testRequest
        .post(`${baseRoute}/invalid/submit/invalid`)
        .set("Accept", "application/json");

      expect(res.status).toBe(400);
      expect(res.text).toContain("Invalid number: printerId");
    });

    it("should return error for non-existent job", async () => {
      const printer = await createTestPrinter(testRequest);

      const res = await testRequest
        .post(`${baseRoute}/${printer.id}/submit/999999`)
        .set("Accept", "application/json");

      expect(res.status).toBe(500);
      expect(res.body.error).toContain("Failed to submit job to printer");
    });
  });
});

