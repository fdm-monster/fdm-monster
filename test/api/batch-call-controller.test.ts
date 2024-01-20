import { AppConstants } from "@/server.constants";
import { setupTestApp } from "../test-server";
import { createTestPrinter } from "./test-data/create-printer";
import { expectOkResponse } from "../extensions";
import { OctoPrintApiMock } from "../mocks/octoprint-api.mock";
import supertest from "supertest";
import { BatchCallController } from "@/controllers/batch-call.controller";
import { AwilixContainer } from "awilix";
import { DITokens } from "@/container.tokens";
import { IPrinterService } from "@/services/interfaces/printer.service.interface";
import { SqliteIdType } from "@/shared.constants";

const defaultRoute = AppConstants.apiRoute + "/batch";
const batchConnectUsbRoute = `${defaultRoute}/connect/usb`;
const batchConnectSocketRoute = `${defaultRoute}/connect/socket`;
const batchToggleEnabledRoute = `${defaultRoute}/toggle-enabled`;
const executeBatchReprintRoute = `${defaultRoute}/reprint/execute`;
const getBatchReprintRoute = `${defaultRoute}/reprint/list`;

let container: AwilixContainer;
let request: supertest.SuperTest<supertest.Test>;
let printerService: IPrinterService<SqliteIdType>;
let octoPrintApiService: OctoPrintApiMock;

beforeAll(async () => {
  ({ request, octoPrintApiService, container } = await setupTestApp(true));
  printerService = container.resolve(DITokens.printerService);
});

beforeEach(async () => {
  octoPrintApiService.storeResponse(undefined, undefined);
});

afterEach(async () => {
  const printers = await printerService.list();
  for (let printer of printers) {
    await printerService.delete(printer.id);
  }
});

describe(BatchCallController.name, () => {
  it("should allow POST to fetch batch reprint returning printer files", async () => {
    const printer = await createTestPrinter(request);
    const printer2 = await createTestPrinter(request);
    const response = await request.post(getBatchReprintRoute).send({
      printerIds: [printer.id, printer2.id],
    });
    expectOkResponse(response);
  });
  it("should allow POST to execute batch reprint for printer files", async () => {
    const printer = await createTestPrinter(request);
    const printer2 = await createTestPrinter(request);
    const response = await request.post(executeBatchReprintRoute).send({
      prints: [
        {
          printerId: printer.id,
          path: "file.gcode",
        },
        {
          printerId: printer2.id,
          path: "file2.gcode",
        },
      ],
    });
    expectOkResponse(response);
  });
  it("should allow POST to batch connect printer usbs", async () => {
    const printer = await createTestPrinter(request);
    const printer2 = await createTestPrinter(request);
    const response = await request.post(batchConnectUsbRoute).send({
      printerIds: [printer.id, printer2.id],
    });
    expectOkResponse(response);
  });
  it("should allow POST to batch connect printer sockets", async () => {
    const printer = await createTestPrinter(request, true);
    const printer2 = await createTestPrinter(request, true);
    const response = await request.post(batchConnectSocketRoute).send({
      printerIds: [printer.id, printer2.id],
    });
    expectOkResponse(response);
  });
  it("should allow POST to batch toggle enabled", async () => {
    const printer = await createTestPrinter(request, true);
    const printer2 = await createTestPrinter(request, true);
    const response = await request.post(batchToggleEnabledRoute).send({
      printerIds: [printer.id, printer2.id],
      enabled: true,
    });
    expectOkResponse(response);
    const response2 = await request.post(batchToggleEnabledRoute).send({
      printerIds: [printer.id, printer2.id],
      enabled: false,
    });
    expectOkResponse(response2);
  });
});
