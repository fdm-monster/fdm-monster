export const idleTimeoutStates = {
  Idle: "Idle",
  Ready: "Ready",
  // This includes any gcode command and file being busy. So not file only.
  Printing: "Printing",
} as const;
export const idleTimeoutStatesList = Object.keys(idleTimeoutStates);
export type IdleTimeoutState = keyof typeof idleTimeoutStates;

export interface IdleTimeoutDto {
  state: IdleTimeoutState;
  printing_time: number;
}
