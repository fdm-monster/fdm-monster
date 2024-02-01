import { EventType } from "@/services/octoprint/dto/websocket-output/event.type";

export interface EventMessageDto<T = any> {
  type: EventType;
  payload: T;
}
