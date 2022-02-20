// Test or example task
// TaskManager.registerPeriodicJob(
//   "unique_test_task1",
//   async () => {
//     await new Promise((resolve) => {
//       setTimeout(() => resolve(), 9000);
//     });
//   },
//   {
//   PERIODIC_TASK_PRESET_2500MS
// );
const periodic = {
    periodic: true,
    logFirstCompletion: true,
    runImmediately: false // Just like setInterval
};
export const TaskPresets = class TASK_PRESETS {
    static PERIODIC = periodic;
    static PERIODIC_DISABLED = {
        ...periodic,
        runImmediately: true,
        disabled: true // Something else will trigger it
    };
    static PERIODIC_2500MS = {
        ...periodic,
        milliseconds: 2500
    };
    static RUNONCE = {
        runOnce: true,
        logFirstCompletion: true,
        runImmediately: true
    };
    static RUNDELAYED = {
        runDelayed: true,
        logFirstCompletion: true,
        runImmediately: false,
        seconds: 0 // other timing units will be ignored (by design)
    };
}