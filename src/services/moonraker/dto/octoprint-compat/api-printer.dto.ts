export interface ApiPrinterDto {
  temperature: Temperature;
  state: State;
}

export interface Temperature {
  tool0: Tool0;
  bed: Bed;
  "...additionalHeaters": AdditionalHeaters;
}

export interface Tool0 {
  actual: number;
  offset: number;
  target: number;
}

export interface Bed {
  actual: number;
  offset: number;
  target: number;
}

export interface AdditionalHeaters {}

export interface State {
  text: string;
  flags: Flags;
}

export interface Flags {
  operational: boolean;
  paused: boolean;
  printing: boolean;
  cancelling: boolean;
  pausing: boolean;
  error: boolean;
  ready: boolean;
  closedOrError: boolean;
}
