import { klipperEvents } from "@/services/moonraker/dto/websocket/methods";

export const messages = {
  ...klipperEvents,

  // Custom events
  WS_OPENED: "WS_OPENED",
  WS_CLOSED: "WS_CLOSED",
  WS_ERROR: "WS_ERROR",
  API_STATE_UPDATED: "API_STATE_UPDATED",
  WS_STATE_UPDATED: "WS_STATE_UPDATED",
} as const;

export type MR_WsMessage = keyof typeof messages;
export class MoonrakerEventDto<K extends MR_WsMessage = MR_WsMessage, T = any> {
  event: K;
  payload: T;
  printerId: number;
  printerType: 1;
}
