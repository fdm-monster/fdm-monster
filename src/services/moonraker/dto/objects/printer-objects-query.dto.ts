export interface PrinterObjectsQueryDto {
  eventtime: number;
  status: Status;
}

export interface Status<T = any> {
  [k: string]: T;
}
