import { IdType } from "@/shared.constants";

export class PrusaLinkEventDto<K extends string = string, T = any, I extends IdType = IdType> {
  event: K;
  payload: T;
  printerId: I;
  printerType: 2;
}
