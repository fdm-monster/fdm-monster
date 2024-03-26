export interface MachineWledStripsDto {
  strips: Strips;
}

export interface Strips {
  lights: StripStatus;
  desk: StripStatus;
  [k: string]: StripStatus;
}

export interface StripStatus {
  strip: string;
  status: string;
  chain_count: number;
  preset: number;
  brightness: number;
  intensity: number;
  speed: number;
  error: any;
}
