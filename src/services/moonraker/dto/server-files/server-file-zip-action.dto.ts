export interface ServerFileZipActionDto {
  destination: Destination;
  action: "zip_files" | string;
}

export interface Destination {
  root: string;
  path: string;
  modified: number;
  size: number;
  permissions: string;
}
