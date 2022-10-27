const EventSource = require("eventsource");
const dbHandler = require("../db-handler");
const { setupTestApp } = require("../test-server");
const DITokens = require("../../container.tokens");
const { AppConstants } = require("../../server.constants");
const { delay } = require("lodash");

let request;
let container;
let sseTask;
const defaultRoute = `${AppConstants.apiRoute}/printer`;
const sseRoute = `${defaultRoute}/sse`;

beforeAll(async () => {
  await dbHandler.connect();
  ({ request, container } = await setupTestApp(true));

  sseTask = container.resolve(DITokens.printerSseTask);
});

describe("SSE-Printers", () => {
  it("should be able to be called with an EventSource", async () => {
    const getRequest = request.get(sseRoute);
    const url = getRequest.url;
    expect(url).toBeTruthy();

    let firedEvent = false;

    await new Promise(async (resolve) => {
      const es = new EventSource(url);
      const es2 = new EventSource(url);

      es2.onmessage = () => {
        es2.close();
      };

      es.onmessage = (e) => {
        firedEvent = true;

        let parsedMsg = JSON.parse(e.data);
        expect(parsedMsg).toMatchObject({
          printers: [],
          printerGroups: [],
          trackedUploads: {
            current: [],
            done: [],
            failed: [],
          },
          outletCurrentValues: expect.anything(),
        });
        es.close();
      };

      delay(async () => {
        await sseTask.run();
        resolve();
      }, 1000);
    });

    expect(firedEvent).toBeTruthy();
  }, 10000);
});
