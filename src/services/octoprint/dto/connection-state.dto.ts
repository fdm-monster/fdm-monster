import { API_STATE, ApiState, SOCKET_STATE, SocketState } from "@/octoprint/dto/state.dto";
import { ApiProperty } from "@nestjs/swagger";
import { AxiosError } from "axios";

export class ConnectionStateDto {
  correlationId: number;
  @ApiProperty({ enumName: "SocketState", enum: Object.values(SOCKET_STATE) })
  socketState: SocketState;
  @ApiProperty({ enumName: "ApiState", enum: Object.values(API_STATE) })
  apiState: ApiState;
  apiStateUpdateTimestamp: number;
  stateUpdateTimestamp: number;
  lastMessageReceivedTimestamp: number;
  reauthRequiredTimestamp: number;
}
