import { setupTestApp } from "../../test-server";
import { PrinterWebsocketTask } from "@/tasks/printer-websocket.task";
import { DITokens } from "@/container.tokens";

let container;
let task: PrinterWebsocketTask;

beforeAll(async () => {
  ({ container } = await setupTestApp(true));
  task = container.resolve(DITokens.printerWebsocketTask);
});

describe(PrinterWebsocketTask.name, () => {
  it("should try running websocket task", async () => {
    try {
      await task.run();
    } catch (e) {
      // It throws because system task has not been registered by the BootTask yet - complete fine
      expect((e as Error).toString()).toEqual(
        "JobValidationError [anonymous]: The requested task with ID printerSystemTask was not registered",
      );
    }
  });
});
