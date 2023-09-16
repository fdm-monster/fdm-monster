const dbHandler = require("../../db-handler");
const { setupTestApp } = require("../../test-server");
const { DITokens } = require("../../../container.tokens");

let container;
let taskManager;
let serverTasks;
let task;

beforeAll(async () => {
  await dbHandler.connect();
  ({ container } = await setupTestApp(true));
  taskManager = container.resolve(DITokens.taskManagerService);
  task = container.resolve(DITokens.bootTask);
  serverTasks = container.resolve(DITokens.serverTasks);
});

describe("BootTask", () => {
  it("should run boot tasks once without having to register", async () => {
    await task.runOnce();
    expect(taskManager.isTaskDisabled(DITokens.bootTask)).toBeTruthy();
    taskManager.stopSchedulerTasks();
    taskManager.deregisterTask(DITokens.bootTask);
  });

  it("should skip running tasks by default", async () => {
    taskManager.registerJobOrTask(serverTasks.SERVER_BOOT_TASK);
    await task.run();

    expect(taskManager.isTaskDisabled(DITokens.bootTask)).toBeTruthy();
  });
});
