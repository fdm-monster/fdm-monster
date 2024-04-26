export interface NotifyAgentEventParams {
  agent: string;
  event: "connected" | "disconnected";
  data: Data;
}

export interface Data {
  name: string;
  version: string;
  type: string;
  url: string;
}
