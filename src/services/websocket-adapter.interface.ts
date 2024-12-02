import { IdType } from "@/shared.constants";
import { ISocketLogin } from "@/shared/dtos/socket-login.dto";
import { SocketState } from "@/shared/dtos/socket-state.type";
import { ApiState } from "@/shared/dtos/api-state.type";

export interface IWebsocketAdapter<T = IdType> {
  printerType: number;
  printerId?: T;
  socketState: SocketState;
  apiState: ApiState;

  needsReopen(): boolean;

  needsSetup(): boolean;

  needsReauth(): boolean;

  reauthSession(): void;

  registerCredentials(socketLogin: ISocketLogin): void;

  open(): void;

  close(): void;

  setupSocketSession(): Promise<void>;

  resetSocketState(): void;

  allowEmittingEvents(): void;

  disallowEmittingEvents(): void;
}
