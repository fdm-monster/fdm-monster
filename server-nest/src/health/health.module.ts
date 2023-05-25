import { Module } from "@nestjs/common";
import { HealthService } from "./health.service";
import { HealthController } from "./health.controller";
import { TerminusModule } from "@nestjs/terminus";

@Module({
  imports: [TerminusModule],
  controllers: [HealthController],
  providers: [HealthService],
})
export class HealthModule {}
