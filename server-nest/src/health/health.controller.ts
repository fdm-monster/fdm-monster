import { Controller, Get, VERSION_NEUTRAL } from "@nestjs/common";
import { HealthService } from "./health.service";
import { Public } from "@/shared/decorators/public.decorator";
import { ApiTags } from "@nestjs/swagger";

@Controller({
  path: "health",
  version: VERSION_NEUTRAL,
})
@ApiTags("Health")
@Public()
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  apiStatus() {
    return { status: "up" };
  }

  @Get("check-database")
  checkDatabaseConnected() {
    const result = this.healthService.isDatabaseConnected();
    return {
      isDatabaseConnected: result,
    };
  }

  @Get("check-api-status")
  checkApiStatus() {
    return {
      apiVersion: process.env?.npm_package_version,
    };
  }
}
