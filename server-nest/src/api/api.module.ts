import { Module } from "@nestjs/common";
import { ApiService } from "./api.service";
import { ApiController } from "./api.controller";
import { HealthController } from "./health.controller";
import { TerminusModule } from "@nestjs/terminus";

@Module({
  imports: [TerminusModule],
  controllers: [ApiController, HealthController],
  providers: [ApiService]
})
export class ApiModule {}
