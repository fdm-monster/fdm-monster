import { Message } from "@/octoprint/octoprint.constants";

export class OctoPrintEventDto<T = any> {
  event: Message;
  payload: T;
  correlationId: number;
}
