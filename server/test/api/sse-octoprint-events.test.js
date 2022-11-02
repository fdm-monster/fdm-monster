const EventSource = require("eventsource");
const dbHandler = require("../db-handler");
const { setupTestApp } = require("../test-server");
const DITokens = require("../../container.tokens");
const { AppConstants } = require("../../server.constants");
const { octoPrintWebsocketEvent } = require("../../constants/event.constants");
const { delay } = require("lodash");

let request;
let container;
let eventEmitter;
let sseTask;
const defaultRoute = `${AppConstants.apiRoute}/octoprint-events`;
const sseRoute = `${defaultRoute}/sse`;

beforeAll(async () => {
  await dbHandler.connect();
  ({ request, container } = await setupTestApp(true));

  eventEmitter = container.resolve(DITokens.eventEmitter2);
  sseTask = container.resolve(DITokens.printEventsSseTask);
});

describe("SSE-OctoPrint-Events", () => {
  it("should be able to be called with an EventSource", async () => {
    const getRequest = request.get(sseRoute);
    const url = getRequest.url;
    expect(url).toBeTruthy();

    let firedEvent = false;

    // Bind listener
    await sseTask.run();

    await new Promise(async (resolve) => {
      const es = new EventSource(url);

      es.onmessage = (e) => {
        firedEvent = true;

        let parsedMsg = JSON.parse(e.data);
        expect(parsedMsg).toMatchObject({});
        es.close();
        resolve();
      };

      // Emit fake event asynchronously
      delay(async () => {
        await eventEmitter.emit(octoPrintWebsocketEvent("someId"), {});
      }, 200);
    });

    expect(firedEvent).toBeTruthy();
  }, 10000);
});
