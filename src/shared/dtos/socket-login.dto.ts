import { WsProtocol } from "@/shared/websocket.adapter";
import { LoginDto } from "@/services/interfaces/login.dto";

export interface ISocketLogin {
  printerId: string;
  loginDto: LoginDto;
  protocol?: WsProtocol;
}
