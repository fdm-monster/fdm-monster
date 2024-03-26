export interface GcodeStoreDto {
  gcode_store: GcodeStore[];
}

export interface GcodeStore {
  message: string;
  time: number;
  type: string;
}
