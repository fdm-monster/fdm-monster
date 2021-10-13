export type PSTATE = string;
export type CATEGORY = string;
export type ColourLabel = "dark" | "success" | "warning" | "danger" | "secondary";

export interface WebsocketState {
  colour: ColourLabel;
  desc: string;
}

export interface StateFlags {
  operational: boolean;
  printing?: boolean;
  cancelling?: boolean;
  pausing?: boolean;
  resuming?: boolean;
  finishing?: boolean;
  closedOrError?: boolean;
  error?: boolean;
  paused?: boolean;
  ready?: boolean;
  sdReady?: boolean;
}

export interface HostState {
  state: PSTATE;
  desc: string;
  colour: {
    name: ColourLabel;
    hex: string;
    category: CATEGORY;
  };
}

export interface PrinterState {
  state: PSTATE;
  desc: string;
  flags: StateFlags;
  colour: {
    name: ColourLabel;
    hex: string;
    category: CATEGORY;
  };
}
