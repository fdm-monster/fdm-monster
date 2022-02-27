const dbHandler = require("../db-handler");
const { AppConstants } = require("../../server.constants");
const { setupTestApp } = require("../test-server");
const { expectOkResponse } = require("../extensions");
const DITokens = require("../../container.tokens");

let container;
let updateService;
let releaseService;
let mockedHttpClient;
let request;

const welcomeRoute = AppConstants.apiRoute;
const getRoute = welcomeRoute;
const versionRoute = `${welcomeRoute}/version`;

beforeAll(async () => {
  await dbHandler.connect();
  ({ request, container } = await setupTestApp(true));
  updateService = container.resolve(DITokens.serverUpdateService);
  releaseService = container.resolve(DITokens.serverReleaseService);
  mockedHttpClient = container.resolve(DITokens.httpClient);
});

describe("AppController", () => {
  it("should return welcome", async function () {
    const response = await request.get(getRoute).send();
    expect(response.body).toMatchObject({
      message:
        "Login not required. Please load UI instead by requesting any route with text/html Content-Type"
    });
    expectOkResponse(response);
  });

  it("should return unsynced state response", async function () {
    const response = await request.get(versionRoute).send();
    expectOkResponse(response, {
      isDockerContainer: false,
      isPm2: false,
      update: {
        synced: false,
        includingPrerelease: null,
        airGapped: null,
        updateAvailable: null
      }
    });
  });

  it("should return airGapped response", async function () {
    await releaseService.syncLatestRelease(false);

    const response = await request.get(versionRoute).send();
    expectOkResponse(response, {
      isDockerContainer: false,
      isPm2: false,
      update: {
        synced: true,
        includingPrerelease: false,
        airGapped: true, // AxiosMock causes this
        updateAvailable: null
      }
    });
  });

  it("should return update-to-date response", async function () {
    const githubReleasesResponse = require("./test-data/github-releases.data.json");
    mockedHttpClient.saveMockResponse(githubReleasesResponse,200);

    await releaseService.syncLatestRelease(false);

    const response = await request.get(versionRoute).send();
    expectOkResponse(response, {
      isDockerContainer: false,
      isPm2: false,
      update: {
        synced: true,
        includingPrerelease: false,
        airGapped: false,
        updateAvailable: false // package.json is respected
      }
    });
  });
});
