import { WsEvents } from "@/services/moonraker/dto/websocket/methods";

export interface JsonRpcEventDto<Method extends WsEvents, I = [any]> {
  jsonrpc: "2.0";
  method: Method;
  params?: I;
}
