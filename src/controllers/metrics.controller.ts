import { GET, route } from "awilix-express";
import { register } from "prom-client";
import { Request, Response } from "express";

@route("/metrics")
export class MetricsController {
  @GET()
  @route("")
  async getMetrics(req: Request, res: Response) {
    res.setHeader("Content-Type", register.contentType);
    res.end(await register.metrics());
  }
}
