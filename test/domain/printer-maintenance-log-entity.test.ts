import { configureContainer } from "@/container";
import { DITokens } from "@/container.tokens";
import { AwilixContainer } from "awilix";
import { TypeormService } from "@/services/typeorm/typeorm.service";
import { PrinterMaintenanceLog } from "@/entities/printer-maintenance-log.entity";
import { Printer } from "@/entities";
import { testPrinterData } from "../application/test-data/printer.data";
import { IPrinterService } from "@/services/interfaces/printer.service.interface";

let container: AwilixContainer;
let typeorm: TypeormService;
let printerService: IPrinterService;
let testPrinter: Printer;

beforeAll(async () => {
  container = configureContainer();
  printerService = container.resolve<IPrinterService>(DITokens.printerService);
  typeorm = container.resolve<TypeormService>(DITokens.typeormService);
  await typeorm.createConnection();
});

beforeEach(async () => {
  testPrinter = await printerService.create(testPrinterData);
});

afterEach(async () => {
  const dataSource = typeorm.getDataSource();
  await dataSource.getRepository(PrinterMaintenanceLog).clear();
  await dataSource.getRepository(Printer).clear();
});

describe("PrinterMaintenanceLog Entity Index Tests", () => {
  it("should allow creating an uncompleted maintenance log for a printer", async () => {
    const dataSource = typeorm.getDataSource();
    const repo = dataSource.getRepository(PrinterMaintenanceLog);

    const log = repo.create({
      printerId: testPrinter.id,
      printerName: testPrinter.name,
      printerUrl: testPrinter.printerURL,
      createdBy: "test-user",
      completed: false,
      metadata: {},
    });

    const savedLog = await repo.save(log);
    expect(savedLog.id).toBeDefined();
    expect(savedLog.printerId).toBe(testPrinter.id);
    expect(savedLog.completed).toBe(false);
  });

  it("should prevent creating multiple uncompleted maintenance logs for the same printer (unique index)", async () => {
    const dataSource = typeorm.getDataSource();
    const repo = dataSource.getRepository(PrinterMaintenanceLog);

    const log1 = repo.create({
      printerId: testPrinter.id,
      printerName: testPrinter.name,
      printerUrl: testPrinter.printerURL,
      createdBy: "test-user-1",
      completed: false,
      metadata: {},
    });

    const savedLog1 = await repo.save(log1);

    // Verify first log was saved successfully
    expect(savedLog1.id).toBeDefined();
    expect(savedLog1.printerId).toBe(testPrinter.id);
    expect(savedLog1.completed).toBe(false);
    expect(savedLog1.createdBy).toBe("test-user-1");

    // Verify only one log exists in the database
    const logsAfterFirst = await repo.find({ where: { printerId: testPrinter.id } });
    expect(logsAfterFirst).toHaveLength(1);
    expect(logsAfterFirst[0].id).toBe(savedLog1.id);

    const log2 = repo.create({
      printerId: testPrinter.id,
      printerName: testPrinter.name,
      printerUrl: testPrinter.printerURL,
      createdBy: "test-user-2",
      completed: false,
      metadata: {},
    });

    // Attempt to save second uncompleted log should throw a constraint error
    await expect(repo.save(log2)).rejects.toThrow(/UNIQUE constraint failed|constraint/);

    // Verify that only the first log still exists
    const logsAfterAttempt = await repo.find({ where: { printerId: testPrinter.id } });
    expect(logsAfterAttempt).toHaveLength(1);
    expect(logsAfterAttempt[0].id).toBe(savedLog1.id);
    expect(logsAfterAttempt[0].createdBy).toBe("test-user-1");

    // Verify log2 was never assigned an ID
    expect(log2.id).toBeUndefined();
  });

  it("should allow multiple completed maintenance logs for the same printer", async () => {
    const dataSource = typeorm.getDataSource();
    const repo = dataSource.getRepository(PrinterMaintenanceLog);

    const log1 = repo.create({
      printerId: testPrinter.id,
      printerName: testPrinter.name,
      printerUrl: testPrinter.printerURL,
      createdBy: "test-user-1",
      completed: true,
      completedAt: new Date(),
      metadata: {},
    });

    const savedLog1 = await repo.save(log1);

    const log2 = repo.create({
      printerId: testPrinter.id,
      printerName: testPrinter.name,
      printerUrl: testPrinter.printerURL,
      createdBy: "test-user-2",
      completed: true,
      completedAt: new Date(),
      metadata: {},
    });

    const savedLog2 = await repo.save(log2);

    expect(savedLog1.id).toBeDefined();
    expect(savedLog2.id).toBeDefined();
    expect(savedLog1.id).not.toBe(savedLog2.id);
  });

  it("should allow creating a new uncompleted log after completing the previous one", async () => {
    const dataSource = typeorm.getDataSource();
    const repo = dataSource.getRepository(PrinterMaintenanceLog);

    const log1 = repo.create({
      printerId: testPrinter.id,
      printerName: testPrinter.name,
      printerUrl: testPrinter.printerURL,
      createdBy: "test-user-1",
      completed: false,
      metadata: {},
    });

    const savedLog1 = await repo.save(log1);

    savedLog1.completed = true;
    savedLog1.completedAt = new Date();
    await repo.save(savedLog1);

    const log2 = repo.create({
      printerId: testPrinter.id,
      printerName: testPrinter.name,
      printerUrl: testPrinter.printerURL,
      createdBy: "test-user-2",
      completed: false,
      metadata: {},
    });

    const savedLog2 = await repo.save(log2);

    expect(savedLog1.id).toBeDefined();
    expect(savedLog2.id).toBeDefined();
    expect(savedLog1.id).not.toBe(savedLog2.id);
    expect(savedLog1.completed).toBe(true);
    expect(savedLog2.completed).toBe(false);
  });

  it("should allow uncompleted maintenance logs for different printers", async () => {
    const dataSource = typeorm.getDataSource();
    const repo = dataSource.getRepository(PrinterMaintenanceLog);

    const testPrinter2 = await printerService.create({
      ...testPrinterData,
      name: "Test Printer 2",
      printerURL: "http://192.168.1.101",
    });

    const log1 = repo.create({
      printerId: testPrinter.id,
      printerName: testPrinter.name,
      printerUrl: testPrinter.printerURL,
      createdBy: "test-user-1",
      completed: false,
      metadata: {},
    });

    const savedLog1 = await repo.save(log1);

    const log2 = repo.create({
      printerId: testPrinter2.id,
      printerName: testPrinter2.name,
      printerUrl: testPrinter2.printerURL,
      createdBy: "test-user-2",
      completed: false,
      metadata: {},
    });

    const savedLog2 = await repo.save(log2);

    expect(savedLog1.id).toBeDefined();
    expect(savedLog2.id).toBeDefined();
    expect(savedLog1.printerId).toBe(testPrinter.id);
    expect(savedLog2.printerId).toBe(testPrinter2.id);
  });
});
