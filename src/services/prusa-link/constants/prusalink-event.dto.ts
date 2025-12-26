export class PrusaLinkEventDto<K extends string = string, T = any> {
  event: K;
  payload: T;
  printerId: number;
  printerType: 2;
}
