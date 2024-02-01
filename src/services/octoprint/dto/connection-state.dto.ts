import { ApiState, SocketState } from "@/services/octoprint/dto/state.dto";

export class ConnectionStateDto {
  correlationId: number;
  socketState: SocketState;
  apiState: ApiState;
  apiStateUpdateTimestamp: number;
  stateUpdateTimestamp: number;
  lastMessageReceivedTimestamp: number;
  reauthRequiredTimestamp: number;
}
