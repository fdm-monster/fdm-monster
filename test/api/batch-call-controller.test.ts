import { connect } from "../db-handler";
import { AppConstants } from "@/server.constants";
import { setupTestApp } from "../test-server";
import { Printer } from "@/models";
import { createTestPrinter } from "./test-data/create-printer";
import { expectOkResponse } from "../extensions";
import { OctoPrintApiMock } from "../mocks/octoprint-api.mock";
import supertest from "supertest";
import { BatchCallController } from "@/controllers/batch-call.controller";

let Model = Printer;
const defaultRoute = AppConstants.apiRoute + "/batch";
const batchConnectUsbRoute = `${defaultRoute}/connect/usb`;
const batchConnectSocketRoute = `${defaultRoute}/connect/socket`;
const batchToggleEnabledRoute = `${defaultRoute}/toggle-enabled`;
const executeBatchReprintRoute = `${defaultRoute}/reprint/execute`;
const getBatchReprintRoute = `${defaultRoute}/reprint/list`;

let request: supertest.SuperTest<supertest.Test>;
let octoPrintApiService: OctoPrintApiMock;

beforeAll(async () => {
  await connect();
  ({ request, octoPrintApiService } = await setupTestApp(true));
});

beforeEach(async () => {
  Model.deleteMany({});
  octoPrintApiService.storeResponse(undefined, undefined);
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
    const response = await request.post(getBatchReprintRoute).send({
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
