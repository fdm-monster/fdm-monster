import { WebsocketAdapter } from "@/shared/websocket.adapter";
import { JsonRpcResponseDto } from "@/services/moonraker/dto/rpc/json-rpc-response.dto";
import { Data } from "ws";
import { JsonRpcRequestDto } from "@/services/moonraker/dto/rpc/json-rpc-request.dto";
import { ILoggerFactory } from "@/handlers/logger-factory";
import { LoggerService } from "@/handlers/logger";
import { JsonRpcEventDto } from "@/services/moonraker/dto/websocket/json-rpc-event.dto";

export abstract class WebsocketRpcExtendedAdapter extends WebsocketAdapter {
  protected declare logger: LoggerService;

  protected constructor(loggerFactory: ILoggerFactory) {
    super(loggerFactory);

    this.logger = loggerFactory(WebsocketRpcExtendedAdapter.name);

    this.requestMap = new Map();
  }

  private requestMap: Map<
    number,
    {
      resolve: (value: JsonRpcResponseDto<any>) => void;
      reject: (reason: any) => void;
      timeout: NodeJS.Timeout;
    }
  >;

  sendRequest<R, I = any>(request: JsonRpcRequestDto<I>, options = { timeout: 10000 }): Promise<JsonRpcResponseDto<R>> {
    request.id = request.id++;

    // Create a registered promise for the response
    const requestId = request.id;
    const promise = new Promise<JsonRpcResponseDto<R>>((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.clearRequest(requestId);
        reject(new Error(`Websocket RPC Request by ID ${requestId} timed out`));
      }, Math.min(3000, options?.timeout) ?? 10000);

      this.requestMap.set(requestId, { resolve, reject, timeout });
    });

    // Send the request
    this.socket.send(JSON.stringify(request));

    return promise;
  }

  private clearRequest(requestId: number): void {
    const request = this.requestMap.get(requestId);
    if (request) {
      clearTimeout(request.timeout);
      this.requestMap.delete(requestId);
    }
  }

  /**
   * @abstract
   * @param message
   * @protected
   */
  protected abstract onEventMessage(message: JsonRpcEventDto): void;

  protected onMessage(message: Data): void {
    const response: JsonRpcResponseDto<any> = JSON.parse(message.toString());
    const requestId = response.id;
    if (!requestId) {
      const event = response as unknown as JsonRpcEventDto;
      return this.onEventMessage(event);
    }

    const request = this.requestMap.get(requestId);
    if (!request) {
      this.logger.warn(
        `No request was associated with the provided request id ${response.id}, websocket RPC response has been dropped`,
      );
      return;
    }

    if (request) {
      clearTimeout(request.timeout);
      request.resolve(response);
      this.requestMap.delete(requestId);
    }
  }
}
