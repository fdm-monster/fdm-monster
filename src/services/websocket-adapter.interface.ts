import { ISocketLogin } from "@/shared/dtos/socket-login.dto";
import { SocketState } from "@/shared/dtos/socket-state.type";
import { ApiState } from "@/shared/dtos/api-state.type";
import { LoginDto } from "@/services/interfaces/login.dto";

export interface IWebsocketAdapter {
  printerType: number;
  printerId?: number;
  socketState: SocketState;
  apiState: ApiState;
  login: LoginDto;
  lastMessageReceivedTimestamp: null | number;

  needsReopen(): boolean;

  needsSetup(): boolean;

  needsReauth(): boolean;

  isClosedOrAborted(): boolean;

  reauthSession(): Promise<void>;

  registerCredentials(socketLogin: ISocketLogin): void;

  open(): void;

  close(): void;

  setupSocketSession(): Promise<void>;

  resetSocketState(): void;

  allowEmittingEvents(): void;

  disallowEmittingEvents(): void;
}
