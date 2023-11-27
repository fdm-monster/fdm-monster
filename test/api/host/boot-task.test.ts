import { connect } from "../../db-handler";
import { setupTestApp } from "../../test-server";
import { DITokens } from "@/container.tokens";
import { AwilixContainer } from "awilix";
import { TaskManagerService } from "@/services/core/task-manager.service";
import { ServerTasks } from "@/tasks";
import { BootTask } from "@/tasks/boot.task";

let container: AwilixContainer;
let taskManager: TaskManagerService;
let serverTasks: ServerTasks;
let task: BootTask;

beforeAll(async () => {
  ({ container } = await setupTestApp(false, undefined, true));
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
