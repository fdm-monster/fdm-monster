export interface RolloverLogsDto {
  rolled_over: string[];
  failed: Failed;
}

export interface Failed {
  [k: string]: string;
}
