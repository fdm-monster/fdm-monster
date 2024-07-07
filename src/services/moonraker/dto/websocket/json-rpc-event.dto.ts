import { WsEvents } from "@/services/moonraker/dto/websocket/methods";

export interface JsonRpcEventDto<Method extends WsEvents = WsEvents, I = [any, any | never]> {
  jsonrpc: "2.0";
  method: Method;
  params?: I;
}
