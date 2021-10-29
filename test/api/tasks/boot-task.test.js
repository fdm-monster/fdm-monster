const dbHandler = require("../../db-handler");
const { setupTestApp } = require("../../test-server");
const DITokens = require("../../../server/container.tokens");
const { ServerTasks } = require("../../../server/tasks");

let container;
let taskManager;
let task;

beforeAll(async () => {
  await dbHandler.connect();
  ({ container } = await setupTestApp(true));
  taskManager = container.resolve(DITokens.taskManagerService);
  task = container.resolve(DITokens.bootTask);

  taskManager.registerJobOrTask(ServerTasks.SERVER_BOOT_TASK);
});

describe("BootTask", () => {
  it("should skip running tasks by default", async () => {
    await task.run();
  });
});
