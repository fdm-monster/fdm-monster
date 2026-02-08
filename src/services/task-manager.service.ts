import { AsyncTask, SimpleIntervalJob, ToadScheduler } from "toad-scheduler";
import { AwilixResolutionError } from "awilix";
import { JobValidationException } from "@/exceptions/job.exceptions";
import { LoggerService } from "@/handlers/logger";
import { CradleService } from "@/services/core/cradle.service";
import type { ILoggerFactory } from "@/handlers/logger-factory";
import { TaskRegistration, TaskSchedulerOptions, TaskService } from "./interfaces/task.interfaces";
import { DITokens } from "@/container.tokens";
import { errorSummary } from "@/utils/error.utils";

/**
 * Internal state of a registered task
 */
interface TaskState {
  options: TaskSchedulerOptions;
  timedTask: AsyncTask;
  job?: SimpleIntervalJob;
  started?: number;
  duration?: number;
  firstCompletion?: number;
  lastError?: {
    time: number;
    error: Error;
  };
}

export class TaskManagerService {
  private taskStates: Record<string, TaskState> = {};
  private readonly logger: LoggerService;

  constructor(
    loggerFactory: ILoggerFactory,
    private readonly cradleService: CradleService,
    private readonly toadScheduler: ToadScheduler,
  ) {
    this.logger = loggerFactory(TaskManagerService.name);
  }

  /**
   * Create a recurring job or one-time task
   * @param registration Task registration parameters
   */
  registerJobOrTask(registration: TaskRegistration): void {
    const { id: taskId, task: serviceIdentifier, preset: schedulerOptions } = registration;

    try {
      this.validateInput(taskId, serviceIdentifier, schedulerOptions);
    } catch (e) {
      this.logger.error(errorSummary(e), schedulerOptions);
      return;
    }

    const timedTask = this.getSafeTimedTask(taskId, serviceIdentifier);

    this.taskStates[taskId] = {
      options: schedulerOptions,
      timedTask,
    };

    if (schedulerOptions.runOnce) {
      timedTask.execute();
    } else if (schedulerOptions.runDelayed) {
      const delay = (schedulerOptions.milliseconds ?? 0) + (schedulerOptions.seconds ?? 0) * 1000;
      this.runTimeoutTaskInstance(taskId, delay);
    } else {
      // This must be 'periodic'
      this.scheduleEnabledPeriodicJob(taskId);
    }
  }

  /**
   * Enable the job which must be disabled at boot. Handy for conditional, heavy or long-running non-critical tasks
   * @param taskId Task identifier
   * @param failIfEnabled throws when the job is already running
   */
  scheduleDisabledJob(taskId: string, failIfEnabled = true): void {
    const taskState = this.getTaskState(taskId);
    const schedulerOptions = taskState?.options;

    if (schedulerOptions?.disabled !== true) {
      if (failIfEnabled) {
        throw new JobValidationException(
          `The requested task with ID ${taskId} was not explicitly disabled and must be running already.`,
          taskId,
        );
      }
      return;
    }

    taskState.options.disabled = false;
    this.scheduleEnabledPeriodicJob(taskId);
  }

  /**
   * Disable a running job
   * @param taskId Task identifier
   * @param failIfDisabled throws when the job is already disabled
   */
  disableJob(taskId: string, failIfDisabled = true): void {
    if (this.isTaskDisabled(taskId)) {
      if (failIfDisabled) {
        throw new JobValidationException("Can't disable a job which is already disabled", taskId);
      }
      return;
    }

    const taskState = this.getTaskState(taskId);
    taskState.options.disabled = true;
    taskState.job?.stop();
  }

  /**
   * Check if a task is currently disabled
   * @param taskId Task identifier
   * @returns true if task is disabled
   */
  isTaskDisabled(taskId: string): boolean {
    return !!this.getTaskState(taskId).options.disabled;
  }

  /**
   * Remove a task from the scheduler and internal registry
   * @param taskId Task identifier
   */
  deregisterTask(taskId: string): void {
    this.getTaskState(taskId); // Validates task exists
    delete this.taskStates[taskId];
    this.toadScheduler.removeById(taskId);
  }

  /**
   * Get the internal state of a task
   * @param taskId Task identifier
   * @returns Task state
   */
  getTaskState(taskId: string): TaskState {
    const taskState = this.taskStates[taskId];
    if (!taskState) {
      throw new JobValidationException(`The requested task with ID ${taskId} was not registered`, taskId);
    }
    return taskState;
  }

  /**
   * Execute a task after a delay
   * @param taskId Task identifier
   * @param timeoutMs Delay in milliseconds
   */
  runTimeoutTaskInstance(taskId: string, timeoutMs: number): void {
    const taskState = this.getTaskState(taskId);
    this.logger.log(`Running delayed task '${taskId}' in ${timeoutMs}ms`);
    setTimeout(() => taskState.timedTask.execute(), timeoutMs);
  }

  /**
   * Stop all scheduled tasks
   */
  stopSchedulerTasks(): void {
    this.toadScheduler.stop();
  }

  /**
   * Validates task registration inputs
   */
  validateInput(taskId: string, serviceIdentifier: string, schedulerOptions: TaskSchedulerOptions): void {
    if (!taskId) {
      throw new JobValidationException("Task ID was not provided. Can't register task or schedule job.", taskId);
    }

    const serviceName = serviceIdentifier || "unknown";
    const prefix = `Job '${schedulerOptions?.name ?? serviceName}' with ID '${taskId}'`;

    if (this.taskStates[taskId]) {
      throw new JobValidationException(`${prefix} was already registered. Can't register a key twice.`, taskId);
    }

    let resolvedService: TaskService;
    try {
      resolvedService = this.cradleService.resolve<TaskService>(serviceIdentifier as keyof typeof DITokens);
    } catch (e) {
      if (e instanceof AwilixResolutionError) {
        throw new JobValidationException(
          `${prefix} had an awilix dependency resolution error. It can't be scheduled without fixing this problem. Inner error:\n` +
            e.stack,
          taskId,
        );
      } else {
        throw new JobValidationException(
          `${prefix} is not a registered awilix dependency. It can't be scheduled. Error:\n` + (e as Error).stack,
          taskId,
        );
      }
    }

    if (typeof resolvedService?.run !== "function") {
      throw new JobValidationException(`${prefix} was resolved but it doesn't have a 'run()' method to call.`, taskId);
    }

    if (!schedulerOptions?.periodic && !schedulerOptions?.runOnce && !schedulerOptions?.runDelayed) {
      throw new JobValidationException(`${prefix} Provide 'periodic', 'runOnce', or 'runDelayed' option.`, taskId);
    }

    if (!schedulerOptions?.periodic && !!schedulerOptions.disabled) {
      throw new JobValidationException(`${prefix} Only tasks of type 'periodic' can be disabled at boot.`, taskId);
    }

    if (schedulerOptions?.runDelayed && !schedulerOptions.milliseconds && !schedulerOptions.seconds) {
      throw new JobValidationException(`${prefix} Provide a delayed timing parameter (milliseconds|seconds)`, taskId);
    }

    if (
      schedulerOptions?.periodic &&
      !schedulerOptions.milliseconds &&
      !schedulerOptions.seconds &&
      !schedulerOptions.minutes &&
      !schedulerOptions.hours &&
      !schedulerOptions.days
    ) {
      throw new JobValidationException(
        `${prefix} Provide a periodic timing parameter (milliseconds|seconds|minutes|hours|days)`,
        taskId,
      );
    }
  }

  /**
   * Create a safe timed task with error handling
   * @param taskId Task identifier
   * @param serviceIdentifier Service to resolve and execute
   * @returns AsyncTask instance
   */
  private getSafeTimedTask(taskId: string, serviceIdentifier: string): AsyncTask {
    const asyncHandler = async (): Promise<void> => {
      await this.timeTask(taskId, serviceIdentifier);
    };

    return new AsyncTask(taskId, asyncHandler, this.getErrorHandler(taskId));
  }

  /**
   * Execute a task and measure its execution time
   * @param taskId Task identifier
   * @param serviceIdentifier Service to resolve and execute
   */
  private async timeTask(taskId: string, serviceIdentifier: string): Promise<void> {
    const taskState = this.taskStates[taskId];
    taskState.started = Date.now();

    const taskService = this.cradleService.resolve<TaskService>(serviceIdentifier as keyof typeof DITokens);
    await taskService.run();

    taskState.duration = Date.now() - taskState.started;

    if (taskState.options?.logFirstCompletion !== false && !taskState?.firstCompletion) {
      this.logger.log(`Task '${taskId}' first completion. Duration ${taskState.duration}ms`);
      taskState.firstCompletion = Date.now();
    }
  }

  /**
   * Create an error handler for a task
   * @param taskId Task identifier
   * @returns Error handler function
   */
  private getErrorHandler(taskId: string): (error: Error) => void {
    return (error: Error): void => {
      const taskState = this.taskStates[taskId];

      taskState.lastError ??= {
        time: Date.now(),
        error,
      };

      this.logger.error(`Task '${taskId}' threw an exception: ${error.stack}`);
    };
  }

  /**
   * Schedule a periodic job that's not disabled
   * @param taskId Task identifier
   */
  private scheduleEnabledPeriodicJob(taskId: string): void {
    const taskState = this.getTaskState(taskId);

    if (!taskState?.timedTask || !taskState?.options) {
      throw new JobValidationException(
        `The requested task with ID ${taskId} was not registered properly ('timedTask' or 'options' missing).`,
        taskId,
      );
    }

    const schedulerOptions = taskState.options;
    const timedTask = taskState.timedTask;

    if (!schedulerOptions?.periodic) {
      throw new JobValidationException(
        `The requested task with ID ${taskId} is not periodic and cannot be enabled.`,
        taskId,
      );
    }

    if (!schedulerOptions.disabled) {
      this.logger.log(`Task '${taskId}' was scheduled (runImmediately: ${!!schedulerOptions.runImmediately}).`);
      const job = new SimpleIntervalJob(schedulerOptions, timedTask);
      taskState.job = job;
      this.toadScheduler.addSimpleIntervalJob(job);
    } else {
      this.logger.log(`Task '${taskId}' was marked as disabled (deferred execution).`);
    }
  }
}
