export interface VersionDto {
  api: string;
  server: string;
  nozzle_diameter: number;
  text: string;
  hostname: string;
  capabilities: Capabilities;
}

export interface Capabilities {
  "upload-by-put": boolean;
}
