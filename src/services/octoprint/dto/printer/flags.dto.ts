export interface FlagsDto {
  operational: boolean;
  printing: boolean;
  cancelling: boolean;
  pausing: boolean;
  resuming: boolean;
  finishing: boolean;
  closedOrError: boolean;
  error: boolean;
  paused: boolean;
  ready: boolean;
  sdReady: boolean;
}
