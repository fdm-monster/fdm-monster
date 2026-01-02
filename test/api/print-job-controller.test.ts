import { setupTestApp } from "../test-server";

describe("PrintJobController", () => {
  let testRequest: any;

  beforeAll(async () => {
    const { request } = await setupTestApp(false, undefined, true, false);
    testRequest = request;
  });

  it("GET /api/print-jobs/search returns array", async () => {
    const res = await testRequest.get("/api/print-jobs/search").set("Accept", "application/json");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("GET /api/print-jobs/search-paged returns paged result", async () => {
    const res = await testRequest
      .get("/api/print-jobs/search-paged?page=1&pageSize=5")
      .set("Accept", "application/json");
    expect(res.status).toBe(200);
    expect(typeof res.body).toBe("object");
    expect(Array.isArray(res.body.items)).toBe(true);
    expect(typeof res.body.count).toBe("number");
    expect(typeof res.body.pages).toBe("number");
  });
});
