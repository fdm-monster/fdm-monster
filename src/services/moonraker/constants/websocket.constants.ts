import { IdType } from "@/shared.constants";
import { Message } from "@/services/octoprint/dto/octoprint-event.dto";

export const moonrakerEvent = (event: string) => `moonraker.${event}`;

export class MoonrakerEventDto<T = any> {
  event: Message;
  payload: T;
  printerId: IdType;
  printerType: 1;
}
