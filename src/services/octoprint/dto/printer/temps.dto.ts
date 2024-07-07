export type TempsDto = {
  time: ToolTempsDto;
  tool0: ToolTempsDto;
  bed: ToolTempsDto;
  chamber: ToolTempsDto;
}[];

export interface ToolTempsDto {
  actual: number | null;
  target: number | null;
}
