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
});

describe("BootTask", () => {
  it("should run boot tasks once without having to register", async () => {
    await task.runOnce();
    expect(taskManager.isTaskDisabled(DITokens.bootTask)).toBeTruthy();
    taskManager.stopSchedulerTasks();
    taskManager.deregisterTask(DITokens.bootTask);
  });

  it("should skip running tasks by default", async () => {
    taskManager.registerJobOrTask(ServerTasks.SERVER_BOOT_TASK);
    await task.run();

    expect(taskManager.isTaskDisabled(DITokens.bootTask)).toBeTruthy();
  });
});
