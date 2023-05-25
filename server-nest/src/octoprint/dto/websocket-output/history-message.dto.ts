export interface HistoryMessageDto {
  state?: {
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
  };
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
  temps?: {
    time: number;
    tool0: {
      actual?: number;
      target?: number;
    };
    bed: {
      actual?: number;
      target?: number;
    };
    chamber: {
      actual?: null;
      target?: null;
    };
  }[];
  logs?: string[];
  messages?: string[];
  serverTime?: number;
}
