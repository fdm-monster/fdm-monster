import { configureContainer } from "@/container";
import { DITokens } from "@/container.tokens";
import { testPrinterData } from "./test-data/printer.data";
import { AwilixContainer } from "awilix";
import { TypeormService } from "@/services/typeorm/typeorm.service";
import { PrinterMaintenanceLog } from "@/entities/printer-maintenance-log.entity";
import { Printer } from "@/entities";
import { IPrinterService } from "@/services/interfaces/printer.service.interface";
import { PrinterMaintenanceLogService } from "@/services/orm/printer-maintenance-log.service";
import { NotFoundException } from "@/exceptions/runtime.exceptions";
import { ensureTestUserCreated } from "../api/test-data/create-user";
import { UserDto } from "@/services/interfaces/user.dto";

let container: AwilixContainer;
let maintenanceLogService: PrinterMaintenanceLogService;
let printerService: IPrinterService;
let typeorm: TypeormService;
let testPrinter: Printer;
let testUser: UserDto;

beforeAll(async () => {
  container = configureContainer();
  maintenanceLogService = container.resolve<PrinterMaintenanceLogService>(DITokens.printerMaintenanceLogService);
  printerService = container.resolve<IPrinterService>(DITokens.printerService);
  typeorm = container.resolve<TypeormService>(DITokens.typeormService);
  await typeorm.createConnection();
});

beforeEach(async () => {
  testUser = await ensureTestUserCreated();
  testPrinter = await printerService.create(testPrinterData);
});

afterEach(async () => {
  const dataSource = typeorm.getDataSource();
  await dataSource.getRepository(PrinterMaintenanceLog).clear();
  await dataSource.getRepository(Printer).clear();
});

describe("PrinterMaintenanceLogService", () => {
  describe("create", () => {
    it("should create a maintenance log", async () => {
      const log = await maintenanceLogService.create(
        {
          printerId: testPrinter.id,
          metadata: {
            cause: "Nozzle clog",
            partsInvolved: ["hotend", "nozzle"],
            notes: "Cleaning required",
          },
        },
        testUser.id,
        testUser.username,
      );

      expect(log.id).toBeDefined();
      expect(log.printerId).toBe(testPrinter.id);
      expect(log.printerName).toBe(testPrinter.name);
      expect(log.printerUrl).toBe(testPrinter.printerURL);
      expect(log.createdBy).toBe(testUser.username);
      expect(log.createdByUserId).toBe(testUser.id);
      expect(log.completed).toBe(false);
      expect(log.metadata.cause).toBe("Nozzle clog");
      expect(log.metadata.partsInvolved).toEqual(["hotend", "nozzle"]);
      expect(log.metadata.notes).toBe("Cleaning required");
    });

    it("should allow metadata with multiple fields", async () => {
      const log = await maintenanceLogService.create(
        {
          printerId: testPrinter.id,
          metadata: {
            cause: "Belt tension issue",
            notes: "Adjusting",
            partsInvolved: ["belt", "motor"],
          },
        },
        testUser.id,
        testUser.username,
      );

      expect(log.metadata.cause).toBe("Belt tension issue");
      expect(log.metadata.notes).toBe("Adjusting");
      expect(log.metadata.partsInvolved).toEqual(["belt", "motor"]);
    });

    it("should throw error when creating second active maintenance log for same printer", async () => {
      await maintenanceLogService.create(
        {
          printerId: testPrinter.id,
          metadata: { cause: "First issue" },
        },
        testUser.id,
        testUser.username,
      );

      await expect(
        maintenanceLogService.create(
          {
            printerId: testPrinter.id,
            metadata: { cause: "Second issue" },
          },
          testUser.id,
          testUser.username,
        ),
      ).rejects.toThrow(/already has an active maintenance log/);
    });

    it("should throw error when printer does not exist", async () => {
      await expect(
        maintenanceLogService.create(
          {
            printerId: 99999,
            metadata: { cause: "Test" },
          },
          testUser.id,
          testUser.username,
        ),
      ).rejects.toThrow();
    });
  });

  describe("complete", () => {
    it("should complete a maintenance log", async () => {
      const log = await maintenanceLogService.create(
        {
          printerId: testPrinter.id,
          metadata: { cause: "Test issue" },
        },
        testUser.id,
        testUser.username,
      );

      const completedLog = await maintenanceLogService.complete(
        log.id,
        { completionNotes: "Fixed successfully" },
        testUser.id,
        testUser.username,
      );

      expect(completedLog.completed).toBe(true);
      expect(completedLog.completedAt).toBeDefined();
      expect(completedLog.completedBy).toBe(testUser.username);
      expect(completedLog.completedByUserId).toBe(testUser.id);
      expect(completedLog.metadata.completionNotes).toBe("Fixed successfully");
    });

    it("should clear printer disabled reason when completing maintenance log", async () => {
      const log = await maintenanceLogService.create(
        {
          printerId: testPrinter.id,
          metadata: { cause: "Test issue" },
        },
        testUser.id,
        testUser.username,
      );

      await maintenanceLogService.complete(log.id, { completionNotes: "Done" }, testUser.id, testUser.username);

      const updatedPrinter = await printerService.get(testPrinter.id);
      expect(updatedPrinter.disabledReason).toBeNull();
    });

    it("should throw error when completing non-existent log", async () => {
      await expect(maintenanceLogService.complete(99999, { completionNotes: "Test" }, testUser.id, testUser.username)).rejects.toThrow(
        NotFoundException,
      );
    });

    it("should throw error when completing already completed log", async () => {
      const log = await maintenanceLogService.create(
        {
          printerId: testPrinter.id,
          metadata: { cause: "Test issue" },
        },
        testUser.id,
        testUser.username,
      );

      await maintenanceLogService.complete(log.id, { completionNotes: "Done" }, testUser.id, testUser.username);

      await expect(maintenanceLogService.complete(log.id, { completionNotes: "Again" }, testUser.id, testUser.username)).rejects.toThrow(
        /already completed/,
      );
    });
  });

  describe("get", () => {
    it("should get a maintenance log by id", async () => {
      const log = await maintenanceLogService.create(
        {
          printerId: testPrinter.id,
          metadata: { cause: "Test issue" },
        },
        testUser.id,
        testUser.username,
      );

      const foundLog = await maintenanceLogService.get(log.id);
      expect(foundLog.id).toBe(log.id);
      expect(foundLog.printerId).toBe(testPrinter.id);
    });

    it("should throw error when log not found", async () => {
      await expect(maintenanceLogService.get(99999)).rejects.toThrow(NotFoundException);
    });
  });

  describe("getActiveByPrinterId", () => {
    it("should get active maintenance log for printer", async () => {
      const log = await maintenanceLogService.create(
        {
          printerId: testPrinter.id,
          metadata: { cause: "Test issue" },
        },
        testUser.id,
        testUser.username,
      );

      const activeLog = await maintenanceLogService.getActiveByPrinterId(testPrinter.id);
      expect(activeLog).toBeDefined();
      expect(activeLog!.id).toBe(log.id);
      expect(activeLog!.completed).toBe(false);
    });

    it("should return null when no active log exists", async () => {
      const activeLog = await maintenanceLogService.getActiveByPrinterId(testPrinter.id);
      expect(activeLog).toBeNull();
    });

    it("should return null when only completed logs exist", async () => {
      const log = await maintenanceLogService.create(
        {
          printerId: testPrinter.id,
          metadata: { cause: "Test issue" },
        },
        testUser.id,
        testUser.username,
      );

      await maintenanceLogService.complete(log.id, { completionNotes: "Done" }, testUser.id, testUser.username);

      const activeLog = await maintenanceLogService.getActiveByPrinterId(testPrinter.id);
      expect(activeLog).toBeNull();
    });
  });

  describe("list", () => {
    it("should list all maintenance logs", async () => {
      await maintenanceLogService.create(
        {
          printerId: testPrinter.id,
          metadata: { cause: "Issue 1" },
        },
        testUser.id,
        testUser.username,
      );

      const result = await maintenanceLogService.list({});
      expect(result.logs).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it("should filter logs by printerId", async () => {
      const testPrinter2 = await printerService.create({
        ...testPrinterData,
        name: "Test Printer 2",
        printerURL: "http://192.168.1.101",
      });

      await maintenanceLogService.create(
        {
          printerId: testPrinter.id,
          metadata: { cause: "Issue 1" },
        },
        testUser.id,
        testUser.username,
      );

      await maintenanceLogService.create(
        {
          printerId: testPrinter2.id,
          metadata: { cause: "Issue 2" },
        },
        testUser.id,
        testUser.username,
      );

      const result = await maintenanceLogService.list({ printerId: testPrinter.id });
      expect(result.logs).toHaveLength(1);
      expect(result.logs[0].printerId).toBe(testPrinter.id);
    });

    it("should filter logs by completed status", async () => {
      // Create first log
      const log1 = await maintenanceLogService.create(
        {
          printerId: testPrinter.id,
          metadata: { cause: "Issue 1" },
        },
        testUser.id,
        testUser.username,
      );

      // Complete it
      await maintenanceLogService.complete(log1.id, { completionNotes: "Done" }, testUser.id, testUser.username);

      // Create second log (now allowed since first is completed)
      const log2 = await maintenanceLogService.create(
        {
          printerId: testPrinter.id,
          metadata: { cause: "Issue 2" },
        },
        testUser.id,
        testUser.username,
      );

      // Test filtering
      const activeResult = await maintenanceLogService.list({ completed: false });
      expect(activeResult.logs).toHaveLength(1);
      expect(activeResult.logs[0].id).toBe(log2.id);
      expect(activeResult.logs[0].completed).toBe(false);

      const completedResult = await maintenanceLogService.list({ completed: true });
      expect(completedResult.logs).toHaveLength(1);
      expect(completedResult.logs[0].id).toBe(log1.id);
      expect(completedResult.logs[0].completed).toBe(true);
    });

    it("should paginate results", async () => {
      for (let i = 0; i < 25; i++) {
        const log = await maintenanceLogService.create(
          {
            printerId: testPrinter.id,
            metadata: { cause: `Issue ${i}` },
          },
          testUser.id,
          testUser.username,
        );
        await maintenanceLogService.complete(log.id, { completionNotes: "Done" }, testUser.id, testUser.username);
      }

      const page1 = await maintenanceLogService.list({ page: 1, pageSize: 10 });
      expect(page1.logs).toHaveLength(10);
      expect(page1.total).toBe(25);

      const page2 = await maintenanceLogService.list({ page: 2, pageSize: 10 });
      expect(page2.logs).toHaveLength(10);

      const page3 = await maintenanceLogService.list({ page: 3, pageSize: 10 });
      expect(page3.logs).toHaveLength(5);
    });
  });

  describe("delete", () => {
    it("should delete a maintenance log", async () => {
      const log = await maintenanceLogService.create(
        {
          printerId: testPrinter.id,
          metadata: { cause: "Test issue" },
        },
        testUser.id,
        testUser.username,
      );

      await maintenanceLogService.delete(log.id);

      await expect(maintenanceLogService.get(log.id)).rejects.toThrow(NotFoundException);
    });

    it("should clear printer disabled reason when deleting active log", async () => {
      const log = await maintenanceLogService.create(
        {
          printerId: testPrinter.id,
          metadata: { cause: "Test issue" },
        },
        testUser.id,
        testUser.username,
      );

      await maintenanceLogService.delete(log.id);

      const updatedPrinter = await printerService.get(testPrinter.id);
      expect(updatedPrinter.disabledReason).toBeNull();
    });

    it("should throw error when deleting non-existent log", async () => {
      await expect(maintenanceLogService.delete(99999)).rejects.toThrow(NotFoundException);
    });
  });

  describe("toDto", () => {
    it("should convert entity to DTO", async () => {
      const log = await maintenanceLogService.create(
        {
          printerId: testPrinter.id,
          metadata: {
            cause: "Test issue",
            partsInvolved: ["part1"],
            notes: "Test notes",
          },
        },
        testUser.id,
        testUser.username,
      );

      const dto = maintenanceLogService.toDto(log);

      expect(dto.id).toBe(log.id);
      expect(dto.printerId).toBe(log.printerId);
      expect(dto.printerName).toBe(log.printerName);
      expect(dto.printerUrl).toBe(log.printerUrl);
      expect(dto.createdBy).toBe(log.createdBy);
      expect(dto.createdByUserId).toBe(log.createdByUserId);
      expect(dto.completed).toBe(log.completed);
      expect(dto.metadata).toEqual(log.metadata);
    });
  });
});
