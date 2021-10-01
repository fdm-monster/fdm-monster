export interface ConnectionOptions {
  baudrates: number[];
  baudratePreference: number;
  ports: number[];
  portPreference: string | "VIRTUAL";
  printerProfiles: string[];
  printerProfilePreference: string | "_default";
}
