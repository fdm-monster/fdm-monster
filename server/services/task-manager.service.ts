const { AwilixResolutionError } = require("awilix");
const { JobValidationException } = require("../exceptions/job.exceptions");
const { SimpleIntervalJob, AsyncTask } = require("toad-scheduler");
const { DITokens } = require("../container.tokens");

/**
 * Manage immediate or delayed tasks and recurring jobs.
 */
export class TaskManagerService {
  jobScheduler;
  taskStates = {};

  #container;

  #logger;

  constructor(container) {
    this.#container = container;
    this.#logger = container[DITokens.loggerFactory](TaskManagerService.name);
    this.jobScheduler = container[DITokens.toadScheduler];
  }

  validateInput(taskId, workload, schedulerOptions) {
    if (!taskId) {
      throw new JobValidationException("Task ID was not provided. Cant register task or schedule job.");
    }
    const prefix = `Job '${workload?.name || "anonymous"}' with ID '${taskId}'`;
    if (!!this.taskStates[taskId]) {
      throw new JobValidationException(`${prefix} was already registered. Cant register a key twice.`, taskId);
    }

    if (typeof workload !== "function") {
      if (typeof workload !== "string") {
        throw new JobValidationException(
          `${prefix} is not a callable nor a string dependency to lookup. It can't be scheduled.`,
          taskId
        );
      }

      let resolvedService;
      try {
        resolvedService = this.#container[workload];
      } catch (e) {
        if (e instanceof AwilixResolutionError) {
          throw new JobValidationException(
            `${prefix} had an awilix dependency resolution error. It can't be scheduled without fixing this problem. Inner error:\n` +
              e.stack,
            taskId
          );
        } else {
          throw new JobValidationException(
            `${prefix} is not a registered awilix dependency. It can't be scheduled. Error:\n` + e.stack,
            taskId
          );
        }
      }

      if (typeof resolvedService?.run !== "function") {
        throw new JobValidationException(`${prefix} was resolved but it doesn't have a 'run(..)' method to call.`, taskId);
      }
    }

    if (!schedulerOptions?.periodic && !schedulerOptions?.runOnce && !schedulerOptions?.runDelayed) {
      throw new JobValidationException(`Provide 'periodic' or 'runOnce' or 'runDelayed' option'.`, taskId);
    }
    if (!schedulerOptions?.periodic && !!schedulerOptions.disabled) {
      throw new JobValidationException(`Only tasks of type 'periodic' can be disabled at boot.`, taskId);
    }
    if (schedulerOptions?.runDelayed && !schedulerOptions.milliseconds && !schedulerOptions.seconds) {
      // Require milliseconds, minutes, hours or days
      throw new JobValidationException(`Provide a delayed timing parameter (milliseconds|seconds)'`, taskId);
    }
    if (
      schedulerOptions?.periodic &&
      !schedulerOptions.milliseconds &&
      !schedulerOptions.seconds &&
      !schedulerOptions.minutes &&
      !schedulerOptions.hours &&
      !schedulerOptions.days
    ) {
      // Require milliseconds, minutes, hours or days
      throw new JobValidationException(`Provide a periodic timing parameter (milliseconds|seconds|minutes|hours|days)'`, taskId);
    }
  }

  /**
   * Create a recurring job
   * Tip: use the options properties `runImmediately` and `seconds/milliseconds/minutes/hours/days`
   */
  registerJobOrTask({ id: taskId, task: asyncTaskCallbackOrToken, preset: schedulerOptions }) {
    try {
      this.validateInput(taskId, asyncTaskCallbackOrToken, schedulerOptions);
    } catch (e) {
      this.#logger.error(e.stack, schedulerOptions);
      return;
    }

    const timedTask = this.getSafeTimedTask(taskId, asyncTaskCallbackOrToken);

    this.taskStates[taskId] = {
      options: schedulerOptions,
      timedTask,
    };

    if (schedulerOptions.runOnce) {
      timedTask.execute();
    } else if (schedulerOptions.runDelayed) {
      const delay = (schedulerOptions.milliseconds || 0) + (schedulerOptions.seconds || 0) * 1000;
      this.runTimeoutTaskInstance(taskId, delay);
    } else {
      // This must be 'periodic'
      this.#scheduleEnabledPeriodicJob(taskId);
    }
  }

  /**
   * Enable the job which must be disabled at boot. Handy for conditional, heavy or long-running non-critical tasks
   * @param taskId
   * @param failIfEnabled throws when the job is already running
   */
  scheduleDisabledJob(taskId, failIfEnabled = true) {
    const taskState = this.getTaskState(taskId);
    const schedulerOptions = taskState?.options;
    if (schedulerOptions?.disabled !== true) {
      if (failIfEnabled) {
        throw new JobValidationException(
          `The requested task with ID ${taskId} was not explicitly disabled and must be running already.`
        );
      }
      return;
    }

    taskState.options.disabled = false;

    this.#scheduleEnabledPeriodicJob(taskId);
  }

  disableJob(taskId, failIfDisabled = true) {
    if (this.isTaskDisabled(taskId)) {
      if (failIfDisabled) {
        throw new JobValidationException("Cant disable a job which is already disabled");
      }
      return;
    }

    const taskState = this.getTaskState(taskId);
    taskState.options.disabled = true;
    // TODO this does not seem to work as intended #https://github.com/fdm-monster/fdm-monster/issues/1071
    taskState.job.stop();
  }

  isTaskDisabled(taskId) {
    return !!this.getTaskState(taskId).options.disabled;
  }

  deregisterTask(taskId) {
    this.getTaskState(taskId);

    delete this.taskStates[taskId];
    this.jobScheduler.removeById(taskId);
  }

  #scheduleEnabledPeriodicJob(taskId) {
    const taskState = this.getTaskState(taskId);
    if (!taskState?.timedTask || !taskState?.options) {
      throw new JobValidationException(
        `The requested task with ID ${taskId} was not registered properly ('timedTask' or 'options' missing).`
      );
    }
    const schedulerOptions = taskState?.options;
    const timedTask = taskState.timedTask;
    if (!schedulerOptions?.periodic) {
      throw new JobValidationException(`The requested task with ID ${taskId} is not periodic and cannot be enabled.`);
    }
    if (!schedulerOptions.disabled) {
      this.#logger.log(`Task '${taskId}' was scheduled (runImmediately: ${!!schedulerOptions.runImmediately}).`);
      const job = new SimpleIntervalJob(schedulerOptions, timedTask);
      taskState.job = job;
      this.jobScheduler.addSimpleIntervalJob(job);
    } else {
      this.#logger.log(`Task '${taskId}' was marked as disabled (deferred execution).`);
    }
  }

  getTaskState(taskId) {
    const taskState = this.taskStates[taskId];
    if (!taskState) {
      throw new JobValidationException(`The requested task with ID ${taskId} was not registered`);
    }
    return taskState;
  }

  runTimeoutTaskInstance(taskId, timeoutMs) {
    const taskState = this.getTaskState(taskId);
    this.#logger.log(`Running delayed task ${taskId} in ${timeoutMs}ms`);
    setTimeout(() => taskState.timedTask.execute(), timeoutMs, taskId);
  }

  getSafeTimedTask(taskId, handler) {
    const asyncHandler = async () => {
      await this.timeTask(taskId, handler);
    };

    return new AsyncTask(taskId, asyncHandler, this.getErrorHandler(taskId));
  }

  async timeTask(taskId, handler) {
    let taskState = this.taskStates[taskId];
    taskState.started = Date.now();
    if (typeof handler === "string") {
      const taskService = this.#container[handler];
      await taskService.run();
    } else {
      await handler();
    }
    taskState.duration = Date.now() - taskState.started;

    if (taskState.options?.logFirstCompletion !== false && !taskState?.firstCompletion) {
      this.#logger.log(`Task '${taskId}' first completion. Duration ${taskState.duration}ms`);
      taskState.firstCompletion = Date.now();
    }
  }

  getErrorHandler(taskId) {
    return (error) => {
      const registration = this.taskStates[taskId];

      if (!registration.lastError)
        registration.erroredlastError = {
          time: Date.now(),
          error,
        };

      this.#logger.error(`Task '${taskId}' threw an exception:` + error.stack);
    };
  }

  /**
   * Stops the tasks which were registered
   */
  stopSchedulerTasks() {
    this.jobScheduler.stop();
  }
}
