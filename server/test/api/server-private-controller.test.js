const dbHandler = require("../db-handler");
const { setupTestApp } = require("../test-server");
const { expectOkResponse } = require("../extensions");
const { AppConstants } = require("../../server.constants");

let request;

const defaultRoute = `${AppConstants.apiRoute}/server`;

beforeAll(async () => {
  await dbHandler.connect();
  ({ request } = await setupTestApp());
});

describe("ServerPrivateController", () => {
  it("should get update info", async function () {
    process.env[AppConstants.VERSION_KEY] = require("../../package.json").version;

    const response = await request.get(defaultRoute).send();
    expectOkResponse(response, {
      includingPrerelease: false,
      airGapped: true,
      latestRelease: null,
      installedRelease: null,
      serverVersion: process.env.npm_package_version,
      installedReleaseFound: null,
      updateAvailable: null,
      synced: true
    });
  });
});
