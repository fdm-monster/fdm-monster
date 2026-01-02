import { TASK_PRESETS as TaskPresets } from "./task.presets";
import { DITokens } from "./container.tokens";
import { TimingPreset } from "@/services/interfaces/task.interfaces";

/**
 * Register a task with a preset and timing (run immediate does not retry in case of failure)
 */
export function registerTask(task: any, preset: TimingPreset, milliseconds = 0, runImmediately = false) {
  let timingPreset = { ...preset };
  timingPreset.milliseconds = preset.milliseconds ?? milliseconds;
  timingPreset.runImmediately = runImmediately ?? false;
  return {
    id: task.name ?? task,
    task,
    preset: timingPreset,
  };
}

export class ServerTasks {
  public static readonly SERVER_BOOT_TASK = registerTask(DITokens.bootTask, TaskPresets.PERIODIC_DISABLED, 5000, false);
  public static readonly BOOT_TASKS = [
    registerTask(DITokens.softwareUpdateTask, TaskPresets.RUNDELAYED, 1500),
    registerTask(DITokens.clientDistDownloadTask, TaskPresets.RUNONCE),
    registerTask(DITokens.socketIoTask, TaskPresets.PERIODIC, 500),
    // Every 2 seconds
    registerTask(DITokens.printerWebsocketTask, TaskPresets.PERIODIC, 2000, true),
    // Every 15 seconds
    registerTask(DITokens.printerWebsocketRestoreTask, TaskPresets.PERIODIC, 15 * 1000, false),
    // Load printer files in background after boot
    registerTask(DITokens.printerFilesLoadTask, TaskPresets.RUNDELAYED, 1000),
  ];
}
