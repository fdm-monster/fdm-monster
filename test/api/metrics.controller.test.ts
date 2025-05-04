import { setupTestApp } from "../test-server";
import { expectNotFoundResponse } from "../extensions";
import { AppConstants } from "@/server.constants";
import { Test } from "supertest";
import TestAgent from "supertest/lib/agent";
import { MetricsController } from "@/controllers/metrics.controller";

let request: TestAgent<Test>;

const getRoute = "/metrics";

beforeAll(async () => {
  ({ request } = await setupTestApp(true));
});

describe(MetricsController.name, () => {
  it("should return not-found when metrics disabled", async () => {
    expect(process.env[AppConstants.ENABLE_PROMETHEUS_METRICS]).toEqual("false");

    const response = await request.get(getRoute).send();
    expectNotFoundResponse(response);
    expect(response.text).toEqual("Metrics disabled");
  });
});
