import { GET, route } from "awilix-express";
import { register } from "prom-client";
import { Request, Response } from "express";
import { IConfigService } from "@/services/core/config.service";
import { AppConstants } from "@/server.constants";

@route("/metrics")
export class MetricsController {
  constructor(private readonly configService: IConfigService) {}

  @GET()
  @route("")
  async getMetrics(req: Request, res: Response) {
    if (this.configService.get<string>(AppConstants.ENABLE_PROMETHEUS_METRICS) !== "true") {
      return res.status(404).send("Metrics disabled");
    }
    res.setHeader("Content-Type", register.contentType);
    res.end(await register.metrics());
  }
}
