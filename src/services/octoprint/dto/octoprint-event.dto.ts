export const octoprintWsMessages = {
  connected: "connected",
  reauthRequired: "reauthRequired",
  current: "current",
  history: "history",
  // Used by completion tracking
  event: "event",
  // plugin: "plugin",
  // timelapse: "timelapse",
  // slicingProgress: "slicingProgress",
} as const;

export type OctoPrintWsMessage = keyof typeof octoprintWsMessages;

export const messages = {
  ...octoprintWsMessages,

  // Nice klipper subscription state
  notify_status_update: "notify_status_update",

  // Custom events
  WS_OPENED: "WS_OPENED",
  WS_CLOSED: "WS_CLOSED",
  WS_ERROR: "WS_ERROR",
  API_STATE_UPDATED: "API_STATE_UPDATED",
  WS_STATE_UPDATED: "WS_STATE_UPDATED",
} as const;

export type WsMessage = keyof typeof messages;

export class OctoPrintEventDto<K extends WsMessage = WsMessage, T = any> {
  event: K;
  payload: T;
  printerId: number;
  printerType: 0;
}
