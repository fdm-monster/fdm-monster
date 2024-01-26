import { IdType } from "@/shared.constants";

export type OctoPrintWsMessage =
  | "connected"
  | "reauthRequired"
  | "current"
  | "history"
  | "event"
  | "plugin"
  | "timelapse"
  | "slicingProgress";

export enum Message {
  CONNECTED = "connected",
  REAUTHREQUIRED = "reauthRequired",
  CURRENT = "current",
  HISTORY = "history",
  EVENT = "event",
  PLUGIN = "plugin",
  TIMELAPSE = "timelapse",
  SLICINGPROCESS = "slicingProgress",

  // Custom events
  WS_OPENED = "WS_OPENED",
  WS_CLOSED = "WS_CLOSED",
  WS_ERROR = "WS_ERROR",
  API_STATE_UPDATED = "API_STATE_UPDATED",
  WS_STATE_UPDATED = "WS_STATE_UPDATED",
}

export class OctoPrintEventDto<T = any> {
  event: Message;
  payload: T;
  printerId: IdType;
}
