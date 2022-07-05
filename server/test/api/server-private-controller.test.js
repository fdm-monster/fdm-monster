const dbHandler = require("../db-handler");
const { setupTestApp } = require("../test-server");
const { expectOkResponse, expectInternalServerError } = require("../extensions");
const { AppConstants } = require("../../server.constants");

let request;

const defaultRoute = `${AppConstants.apiRoute}/server`;
const gitUpdateRoute = `${defaultRoute}/git-update`;
const restartRoute = `${defaultRoute}/restart`;

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

  it("should pull git updates", async function () {
    const response = await request.post(gitUpdateRoute).send();
    expectOkResponse(response);
  });

  it("should skip server restart - no daemon error", async function () {
    const response = await request.post(restartRoute).send();
    expectInternalServerError(response);
  });

  it("should do server restart when nodemon is detected", async function () {
    let valueBefore = process.env.npm_lifecycle_script;

    process.env.npm_lifecycle_script = "nodemon";
    const response = await request.post(restartRoute).send();
    expectOkResponse(response);

    process.env.npm_lifecycle_script = valueBefore;
  });
});
