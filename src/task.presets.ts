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

export interface TimingPreset {
  periodic?: boolean;
  logFirstCompletion: boolean;
  runImmediately: boolean;
  runOnce?: boolean;
  runDelayed?: boolean;
  disabled?: boolean;
  milliseconds?: number;
  seconds?: number;
}

export class TASK_PRESETS {
  static PERIODIC: TimingPreset = {
    periodic: true,
    logFirstCompletion: true,
    runImmediately: false, // Just like setInterval
  };

  static PERIODIC_DISABLED: TimingPreset = {
    ...this.PERIODIC,
    runImmediately: true,
    disabled: true, // Something else will trigger it
  };

  static PERIODIC_2500MS: TimingPreset = {
    ...this.PERIODIC,
    milliseconds: 2500,
  };

  static RUNONCE: TimingPreset = {
    runOnce: true, // not optional
    logFirstCompletion: true,
    runImmediately: true,
  };

  static RUNDELAYED: TimingPreset = {
    runDelayed: true, // not optional
    logFirstCompletion: true,
    runImmediately: false,
    seconds: 0, // other timing units will be ignored (by design)
  };
}
