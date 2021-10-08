const { TaskPresets } = require("./task.presets");
const DITokens = require("./container.tokens");

/**
 * Register a task with a preset and timing (run immediate does not retry in case of failure)
 * @param task
 * @param preset
 * @param milliseconds optional parameter to quickly set milliseconds timing
 * @returns {{task, id, preset}}
 */
function registerTask(task, preset, milliseconds = 0, runImmediately) {
  let timingPreset = { ...preset };
  timingPreset.milliseconds = preset.milliseconds || milliseconds;
  timingPreset.runImmediately = runImmediately | false;
  return {
    id: task.name || task,
    task,
    preset: timingPreset
  };
}

const HOUR_MS = 3600 * 1000;

class ServerTasks {
  static BOOT_TASKS = [
    registerTask(DITokens.softwareUpdateTask, TaskPresets.RUNDELAYED, 1500),
    registerTask(DITokens.printerSseTask, TaskPresets.PERIODIC, 500),
    registerTask(DITokens.printerTestTask, TaskPresets.PERIODIC_DISABLED, 2000),
    registerTask(DITokens.printerSystemTask, TaskPresets.PERIODIC_DISABLED, 6 * HOUR_MS, true),
    registerTask(DITokens.printerWebsocketTask, TaskPresets.PERIODIC, 5000, true),
    registerTask(DITokens.printerFilesTask, TaskPresets.RUNONCE, 15000) // We dont need more than this
  ];
}

module.exports = {
  ServerTasks
};
