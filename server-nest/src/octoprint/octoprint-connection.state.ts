import { Injectable, Scope } from "@nestjs/common";
import { CorrelationId } from "@/octoprint/interfaces/correlation-id.interface";
import { ConfigService } from "@nestjs/config";

@Injectable({
  scope: Scope.TRANSIENT,
})
export class OctoPrintConnectionState implements CorrelationId {
  constructor(private configService: ConfigService) {}

  getCorrelationId(): number {
    return 0;
  }

  setCorrelationId(correlationId: number): void {}
}
