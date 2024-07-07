import { EventType } from "@/services/octoprint/dto/websocket/event.type";

export interface EventMessageDto<K extends EventType = EventType, T = any> {
  type: K;
  payload: T;
}
