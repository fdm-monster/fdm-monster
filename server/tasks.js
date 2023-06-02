const { TaskPresets } = require("./task.presets");
const DITokens = require("./container.tokens");

/**
 * Register a task with a preset and timing (run immediate does not retry in case of failure)
 * @param task
 * @param preset
 * @param milliseconds optional parameter to quickly set milliseconds timing
 * @param runImmediately
 * @returns {{task, id, preset}}
 */
function registerTask(task, preset, milliseconds = 0, runImmediately = false) {
  let timingPreset = { ...preset };
  timingPreset.milliseconds = preset.milliseconds || milliseconds;
  timingPreset.runImmediately = runImmediately | false;
  return {
    id: task.name || task,
    task,
    preset: timingPreset,
  };
}

const HOUR_MS = 3600 * 1000;

class ServerTasks {
  static SERVER_BOOT_TASK = registerTask(DITokens.bootTask, TaskPresets.PERIODIC_DISABLED, 5000, false);
  static BOOT_TASKS = [
    registerTask(DITokens.softwareUpdateTask, TaskPresets.RUNDELAYED, 1500),
    registerTask(DITokens.clientDistDownloadTask, TaskPresets.RUNONCE),
    registerTask(DITokens.socketIoTask, TaskPresets.PERIODIC, 500),
    registerTask(DITokens.printCompletionSocketIoTask, TaskPresets.RUNONCE),
    registerTask(DITokens.printerTestTask, TaskPresets.PERIODIC_DISABLED, 2000, true),
    registerTask(DITokens.printerFileCleanTask, TaskPresets.RUNONCE, 60 * 1000, true),
    registerTask(DITokens.printerSystemTask, TaskPresets.PERIODIC_DISABLED, 6 * HOUR_MS, true),
    registerTask(DITokens.printerWebsocketTask, TaskPresets.PERIODIC, 2000, true),
    // Every 60 minutes
    registerTask(DITokens.printerWebsocketPingTask, TaskPresets.PERIODIC, 60 * 60 * 1000, false),
  ];
}

module.exports = {
  ServerTasks,
};
