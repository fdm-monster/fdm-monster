import { beforeAll, describe, expect, it } from "@jest/globals";
const dbHandler = require("../../db-handler");
const { setupTestApp } = require("../../test-server");
import { PrinterWebsocketTask } from "@/tasks/printer-websocket.task";
const { DITokens } = require("@/container.tokens");

let container;
let task: PrinterWebsocketTask;

beforeAll(async () => {
  await dbHandler.connect();
  ({ container } = await setupTestApp(true));
  task = container.resolve(DITokens.printerWebsocketTask);
});

describe("PrinterWebsocketTask", () => {
  it("should try running websocket task", async () => {
    try {
      await task.run();
    } catch (e) {
      // It throws because system task has not been registered by the BootTask yet - complete fine
      expect(e.toString()).toEqual(
        "JobValidationError [anonymous]: The requested task with ID printerSystemTask was not registered"
      );
    }
  });

  // it("should try connecting to OctoPrint websocket", async () => {
  //   const newPrinterState = await printerService.create(validNewPrinterState);
  //
  //   try {
  //     await task.setupPrinterConnection(newPrinterState);
  //   } catch (e) {
  //     expect(e.toString()).toEqual("Error: OctoPrint apiKey was rejected. (Not retried)");
  //   }
  // });
});
