const dbHandler = require("../db-handler");
const { AppConstants } = require("../../server.constants");
const { setupTestApp } = require("../test-server");
const { expectOkResponse } = require("../extensions");
const PrintCompletion = require("../../models/PrintCompletion");
const { EVENT_TYPES } = require("../../services/octoprint/constants/octoprint-websocket.constants");
const DITokens = require("../../container.tokens");

let Model = PrintCompletion;
let printCompletionService;
const listRoute = `${AppConstants.apiRoute}/print-completion`;

let request;

beforeAll(async () => {
  await dbHandler.connect();
  ({ request, container } = await setupTestApp(true));
  printCompletionService = container.resolve(DITokens.printCompletionService);
});

beforeEach(async () => {
  Model.deleteMany({});
});

describe("PrinterGroupsController", () => {
  it("should return empty print completion list", async () => {
    const response = await request.get(listRoute).send();
    expectOkResponse(response, []);
  });
  it("should aggregate created completions", async () => {
    const completionEntryStart = await printCompletionService.create({
      printerId: "5f14968b11034c4ca49e7c69",
      completionLog: "some log happened here",
      status: EVENT_TYPES.PrintStarted,
      fileName: "mycode.gcode",
      context: {
        correlationId: "123",
      },
    });
    expect(completionEntryStart._id).toBeTruthy();
    const completionEntryDone = await printCompletionService.create({
      printerId: "5f14968b11034c4ca49e7c69",
      completionLog: "some log happened here",
      status: EVENT_TYPES.PrintDone,
      fileName: "mycode.gcode",
      context: {
        correlationId: "123",
      },
    });
    expect(completionEntryDone._id).toBeTruthy();

    const response = await request.get(listRoute).send();
    const body = expectOkResponse(response);
    expect(body).toHaveLength(1);
    const printerEvents = body[0];
    expect(printerEvents._id).toEqual("5f14968b11034c4ca49e7c69");
    expect(printerEvents.eventCount).toEqual(2);
    expect(printerEvents.printCount).toEqual(1);
    expect(printerEvents.printCompletionEvents).toHaveLength(2);
    expect(printerEvents.printJobs["123"]).toBeDefined();
  });
});
