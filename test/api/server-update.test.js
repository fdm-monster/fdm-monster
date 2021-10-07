const dbHandler = require("../db-handler");
const supertest = require("supertest");
const { setupTestApp } = require("../../server/app-test");

let request;

beforeAll(async () => {
  await dbHandler.connect();
  const { server } = await setupTestApp();

  request = supertest(server);
});

describe("ServerUpdate Endpoint", () => {
  it("should return 400", async function () {
    process.env.npm_package_version = require("../../package.json").version;
    process.env.testlatest_package_version = require("../../package.json").version;

    const res = await request.post("/api/settings/server/update/server").send();
    expect(res.statusCode).toEqual(400);
    // expect(res.text).toEqual("Found. Redirecting to /users/login");
  }, 10000);
});
