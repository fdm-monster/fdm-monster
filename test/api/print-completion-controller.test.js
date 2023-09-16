const dbHandler = require("../db-handler");
const { AppConstants } = require("../../server.constants");
const { setupTestApp } = require("../test-server");
const { expectOkResponse } = require("../extensions");
const PrintCompletion = require("../../models/PrintCompletion");
const { EVENT_TYPES } = require("../../services/octoprint/constants/octoprint-websocket.constants");
const { DITokens } = require("../../container.tokens");

let Model = PrintCompletion;
let printCompletionService;
const listRoute = `${AppConstants.apiRoute}/print-completion`;
const getCompletionEntryRoute = (corrId) => `${listRoute}/${corrId}`;
const contextsRoute = `${listRoute}/contexts`;
const testRoute = `${listRoute}/test`;

let request;

beforeAll(async () => {
  await dbHandler.connect();
  ({ request, container } = await setupTestApp(true));
  printCompletionService = container.resolve(DITokens.printCompletionService);
});

beforeEach(async () => {
  Model.deleteMany({});
});

describe("PrintCompletionController", () => {
  it("should return empty print completion list", async () => {
    const response = await request.get(listRoute).send();
    expectOkResponse(response, []);
  });

  it("should return context list", async () => {
    const response = await request.get(contextsRoute).send();
    expectOkResponse(response, {});
  });

  it("should return test query result", async () => {
    const response = await request.get(testRoute).send();
    expectOkResponse(response, {});
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
    expect(printerEvents.printJobs).toHaveLength(1);
    expect(printerEvents.printJobs[0].correlationId).toEqual("123");

    const responseEntries = await request.get(getCompletionEntryRoute("123"));
    const completionEntries = expectOkResponse(responseEntries);
    expect(completionEntries).toHaveLength(2);
  });
});
