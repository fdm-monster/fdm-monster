const dbHandler = require("../../db-handler");
const { setupTestApp } = require("../../test-server");
const DITokens = require("../../../container.tokens");
const { validNewPrinterState } = require("../../application/test-data/printer.data");

let container;
let taskManager;
let printerSocketStore;
/**
 * @type {PrinterService}
 */
let printerService;
let serverTasks;
/**
 * @type {PrinterWebsocketTask}
 */
let task;

beforeAll(async () => {
  await dbHandler.connect();
  ({ container } = await setupTestApp(true));
  taskManager = container.resolve(DITokens.taskManagerService);
  printerSocketStore = container.resolve(DITokens.printerSocketStore);
  printerService = container.resolve(DITokens.printerService);
  task = container.resolve(DITokens.printerWebsocketTask);
  serverTasks = container.resolve(DITokens.serverTasks);
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
