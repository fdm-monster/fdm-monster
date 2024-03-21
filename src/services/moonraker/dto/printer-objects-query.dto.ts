export interface PrinterObjectsQueryDto {
  eventtime: number;
  status: Status;
}

export interface Status {
  [k: string]: any;
}
