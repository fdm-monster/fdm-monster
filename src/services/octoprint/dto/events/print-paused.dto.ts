export interface PrintPausedDto {
  name?: string;
  path?: string;
  origin?: string;
  size?: number;
  position?: {
    e?: number;
    z?: number;
    f?: number;
    y?: number;
    x?: number;
    t?: number;
  };
  owner?: string;
  user?: string;
}
