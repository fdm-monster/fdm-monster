const supertest = require("supertest");
const { setupEnvConfig } = require("../../server/app-env");
const { serveDatabaseIssueFallbackRoutes } = require("../../server/app-fallbacks");
const { expectOkResponse } = require("../extensions");
const { setupExpressServer } = require("../../server/app-core");

let server;

async function setupDatabaseIssueApp() {
  setupEnvConfig(true);

  let { app } = setupExpressServer();
  await serveDatabaseIssueFallbackRoutes(app);
}

describe("DatabaseIssue server", () => {
  test.skip("should return database issue page when no database is connected", async () => {
    await setupDatabaseIssueApp();

    const response = await supertest(server).get("/").send();
    expectOkResponse(response);
    expect(response.text).toContain(
      "Docker mode:\n" + '                    <span class="badge badge-dark">false</span>'
    );
    expect(response.text).toContain(
      'const defaultMongoDBString = "mongodb://127.0.0.1:27017/3dpf";'
    );
  }, 15000);
});
