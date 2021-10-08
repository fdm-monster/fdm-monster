jest.mock("../../server/middleware/auth");

const EventSource = require("eventsource");
const { parse } = require("flatted/cjs");
const dbHandler = require("../db-handler");
const supertest = require("supertest");
const getEndpoints = require("express-list-endpoints");
const { setupTestApp } = require("../../server/app-test");
const DITokens = require("../../server/container.tokens");
const { AppConstants } = require("../../server/app.constants");

let request;
let sseTask;
const routeBase = "/api/printer/";
const ssePath = "sse";

beforeAll(async () => {
  await dbHandler.connect();
  const { server, container } = await setupTestApp(true);

  sseTask = container.resolve(DITokens.printerSseTask);

  const endpoints = getEndpoints(server);
  expect(endpoints).toContainEqual({
    methods: ["GET"],
    middlewares: ["anonymous", "memberInvoker"],
    path: routeBase + ssePath
  });
  request = supertest(server);
});

describe("SSE-printers", () => {
  it("should be able to be called with an EventSource", async () => {
    const getRequest = request.get(routeBase + ssePath);
    const url = getRequest.url;
    expect(url).toBeTruthy();

    let firedEvent = false;

    await new Promise(async (resolve) => {
      const es = new EventSource(url);

      es.onmessage = (e) => {
        firedEvent = true;

        let parsedMsg;
        if (AppConstants.jsonStringify) {
          parsedMsg = JSON.parse(e.data);
        } else {
          parsedMsg = parse(e.data);
        }
        expect(parsedMsg).toEqual({ printers: [] });
        es.close();
        resolve();
      };

      await sseTask.run();
    });

    expect(firedEvent).toBeTruthy();
  }, 10000);
});
