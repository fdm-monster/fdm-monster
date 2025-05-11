/**
 * Represents a task service that can be resolved and executed
 */
export interface TaskService {
  run(): Promise<void> | void;
}

export interface TimingPreset {
  periodic?: boolean;
  logFirstCompletion?: boolean;
  runImmediately?: boolean;
  runOnce?: boolean;
  runDelayed?: boolean;
  disabled?: boolean;
  milliseconds?: number;
  seconds?: number;
}

/**
 * Configuration options for scheduling tasks
 */
export interface TaskSchedulerOptions extends TimingPreset {
  // Timing options
  milliseconds?: number;
  seconds?: number;
  minutes?: number;
  hours?: number;
  days?: number;

  // Execution mode
  periodic?: boolean;
  runOnce?: boolean;
  runDelayed?: boolean;
  runImmediately?: boolean;

  // State
  disabled?: boolean;
  logFirstCompletion?: boolean;

  // Task metadata
  name?: string;
}

/**
 * Task registration parameters
 */
export interface TaskRegistration {
  id: string;
  task: string; // Service identifier to resolve from container
  preset: TaskSchedulerOptions;
}
