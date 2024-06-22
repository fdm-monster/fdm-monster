export interface PrintCancelledDto {
  name?: string;
  path?: string;
  origin?: string;
  size?: number;
  position?: {
    e?: null;
    z?: null;
    f?: null;
    y?: null;
    x?: null;
    t?: null;
  };
  owner?: string;
  user?: string;
  time?: number;
  reason?: string;
}
