import { beforeAll, beforeEach, describe, it } from "@jest/globals";

import { connect } from "../db-handler";
import { AppConstants } from "@/server.constants";
import { setupTestApp } from "../test-server";
import { Printer } from "@/models";
import { createTestPrinter } from "./test-data/create-printer";
import { expectOkResponse } from "../extensions";

let Model = Printer;
const defaultRoute = AppConstants.apiRoute + "/batch";
const batchConnectUsbRoute = `${defaultRoute}/connect/usb`;
const batchConnectSocketRoute = `${defaultRoute}/connect/socket`;
const batchReprintRoute = `${defaultRoute}/reprint`;

let request;
let octoPrintApiService;

beforeAll(async () => {
  await connect();
  ({ request, octoPrintApiService } = await setupTestApp(true));
});

beforeEach(async () => {
  Model.deleteMany({});
  octoPrintApiService.storeResponse(undefined, undefined);
});

describe("BatchCallController", () => {
  it("should allow POST to batch reprint many printer files", async () => {
    const printer = await createTestPrinter(request);
    const printer2 = await createTestPrinter(request);
    const response = await request.post(batchReprintRoute).send({
      printerIds: [printer.id, printer2.id],
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
});
