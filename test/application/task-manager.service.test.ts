import { AwilixContainer } from "awilix";
import { TaskManagerService } from "@/services/core/task-manager.service";
import { connect } from "../db-handler";
import { configureContainer } from "@/container";
import { DITokens } from "@/container.tokens";
import { JobValidationException } from "@/exceptions/job.exceptions";

let container: AwilixContainer;
let taskManagerService: TaskManagerService;

beforeAll(async () => {
  await connect();
  container = configureContainer();
  taskManagerService = container.resolve(DITokens.taskManagerService);
});

describe("TaskManagerService", () => {
  it("should invalidate wrong task spec", () => {
    let caught = false;
    try {
      // @ts-ignore
      taskManagerService.validateInput();
    } catch (e) {
      expect(e instanceof JobValidationException).toBeTruthy();
      caught = true;
    }
    expect(caught).toEqual(true);
  });

  it("should invalidate nonexisting task spec", () => {
    let caught = false;
    try {
      // @ts-ignore
      taskManagerService.validateInput("name");
    } catch (e) {
      expect(e instanceof JobValidationException).toBeTruthy();
      caught = true;
    }
    expect(caught).toEqual(true);
  });

  it("should invalidate wrong workload - missing run", () => {
    let caught = false;
    try {
      // @ts-ignore
      taskManagerService.validateInput("name", () => {});
    } catch (e) {
      expect(e instanceof JobValidationException).toBeTruthy();
      caught = true;
    }
    expect(caught).toEqual(true);
  });

  it("should not run disabled periodic job", () => {
    let ran = false;

    taskManagerService.validateInput(
      "name",
      () => {
        ran = true;
      },
      {
        disabled: true,
        periodic: true,
        milliseconds: 1000,
      }
    );

    expect(ran).toBeFalsy();
  });
});
