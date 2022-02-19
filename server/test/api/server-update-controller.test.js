import * as dbHandler from "../db-handler.js";
import testServer from "../test-server.js";
import extensions from "../extensions.js";
const { setupTestApp } = testServer;
const { expectInvalidResponse } = extensions;
let request;
beforeAll(async () => {
    await dbHandler.connect();
    ({ request } = await setupTestApp());
});
describe("ServerUpdate Endpoint", () => {
    it("should return 400", async function () {
        process.env.npm_package_version = require("../../package.json").version;
        process.env.testlatest_package_version = require("../../package.json").version;
        const res = await request.post("/api/settings/server/update/server").send();
        expectInvalidResponse(res);
    }, 10000);
});
