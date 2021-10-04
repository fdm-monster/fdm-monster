const { TaskPresets } = require("./task.presets");

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
    registerTask("softwareUpdateTask", TaskPresets.RUNDELAYED, 1500),
    registerTask("printerSseTask", TaskPresets.PERIODIC, 500),
    registerTask("printerSystemTask", TaskPresets.PERIODIC_DISABLED, 6 * HOUR_MS, true),
    registerTask("printerWebsocketTask", TaskPresets.PERIODIC, 5000, true),
    registerTask("printerFilesTask", TaskPresets.RUNONCE, 15000) // We dont need more than this
  ];
}

module.exports = {
  ServerTasks
};
