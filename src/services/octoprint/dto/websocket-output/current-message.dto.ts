export interface ToolTemp {
  actual: number;
  target: number;
}

export interface CurrentStateDto {
  error?: string;
  text?: string;
  flags?: {
    operational?: boolean;
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
  };
}
export interface CurrentMessageDto {
  state?: CurrentStateDto;
  job?: {
    file?: {
      name?: null;
      path?: null;
      display?: null;
      origin?: null;
      size?: null;
      date?: null;
    };
    estimatedPrintTime?: null;
    averagePrintTime?: null;
    lastPrintTime?: null;
    filament?: null;
    user?: null;
  };
  currentZ?: null;
  progress?: {
    completion?: null;
    filepos?: null;
    printTime?: null;
    printTimeLeft?: null;
    printTimeLeftOrigin?: null;
  };
  offsets?: {
    [k: string]: any;
  };
  resends?: {
    count?: number;
    transmitted?: number;
    ratio?: number;
  };
  serverTime?: number;
  temps?: {
    time?: number;
    tool0?: ToolTemp;
    tool1?: ToolTemp;
    bed?: ToolTemp;
    chamber?: ToolTemp;
  }[];
  logs?: string[];
  messages?: string[];
  busyFiles?: any[];
}
