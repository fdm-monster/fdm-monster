import { AwilixContainer } from "awilix";
import { connect } from "../db-handler";
import { setupTestApp } from "../test-server";
import { expectOkResponse } from "../extensions";
import { AppConstants } from "@/server.constants";
import { PrintCompletion as Model } from "@/models";
import { EVENT_TYPES } from "@/services/octoprint/constants/octoprint-websocket.constants";
import { DITokens } from "@/container.tokens";
import { IPrintCompletionService } from "@/services/interfaces/print-completion.service";
import supertest from "supertest";

let printCompletionService: IPrintCompletionService;
const listRoute = `${AppConstants.apiRoute}/print-completion`;
const getCompletionEntryRoute = (corrId: string) => `${listRoute}/${corrId}`;
const contextsRoute = `${listRoute}/contexts`;
const testRoute = `${listRoute}/test`;

let request: supertest.SuperTest<supertest.Test>;
let container: AwilixContainer<any>;

beforeAll(async () => {
  await connect();
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
    expect(completionEntryStart.id).toBeTruthy();
    const completionEntryDone = await printCompletionService.create({
      printerId: "5f14968b11034c4ca49e7c69",
      completionLog: "some log happened here",
      status: EVENT_TYPES.PrintDone,
      fileName: "mycode.gcode",
      context: {
        correlationId: "123",
      },
    });
    expect(completionEntryDone.id).toBeTruthy();

    const response = await request.get(listRoute).send();
    const body = expectOkResponse(response);
    expect(body).toHaveLength(1);
    const printerEvents = body[0];
    expect(printerEvents.printerId).toEqual("5f14968b11034c4ca49e7c69");
    expect(printerEvents.eventCount).toEqual(2);
    expect(printerEvents.printCount).toEqual(1);
    expect(printerEvents.printJobs).toHaveLength(1);
    expect(printerEvents.printJobs[0].correlationId).toEqual("123");

    const responseEntries = await request.get(getCompletionEntryRoute("123"));
    const completionEntries = expectOkResponse(responseEntries);
    expect(completionEntries).toHaveLength(2);
  });
});
