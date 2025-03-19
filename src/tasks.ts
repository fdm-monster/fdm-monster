import { TASK_PRESETS as TaskPresets, TimingPreset } from "./task.presets";
import { DITokens } from "./container.tokens";

/**
 * Register a task with a preset and timing (run immediate does not retry in case of failure)
 */
export function registerTask(task: any, preset: TimingPreset, milliseconds = 0, runImmediately = false) {
  let timingPreset = { ...preset };
  timingPreset.milliseconds = preset.milliseconds || milliseconds;
  timingPreset.runImmediately = runImmediately || false;
  return {
    id: task.name || task,
    task,
    preset: timingPreset,
  };
}

export class ServerTasks {
  static SERVER_BOOT_TASK = registerTask(DITokens.bootTask, TaskPresets.PERIODIC_DISABLED, 5000, false);
  static BOOT_TASKS = [
    registerTask(DITokens.softwareUpdateTask, TaskPresets.RUNDELAYED, 1500),
    registerTask(DITokens.clientDistDownloadTask, TaskPresets.RUNONCE),
    registerTask(DITokens.socketIoTask, TaskPresets.PERIODIC, 500),
    // registerTask(DITokens.printCompletionSocketIoTask, TaskPresets.RUNONCE),
    registerTask(DITokens.printerFileCleanTask, TaskPresets.RUNONCE, 60 * 1000, true),
    // Every 2 seconds
    registerTask(DITokens.printerWebsocketTask, TaskPresets.PERIODIC, 2000, true),
    // Every 15 seconds
    registerTask(DITokens.printerWebsocketRestoreTask, TaskPresets.PERIODIC, 15 * 1000, false),
  ];
}
