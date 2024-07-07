// Websocket JSON RPC request only
export interface ConnectionIdentifyDto {
  client_name: string;
  version: string;
  type: "web" | "mobile" | "desktop" | "display" | "bot" | "agent" | "other";
  url: string;
  // Oneshot key?
  access_token?: string;
  api_key?: string;
}
