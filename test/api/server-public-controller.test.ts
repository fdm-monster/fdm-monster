import { AwilixContainer } from "awilix";
import { setupTestApp } from "../test-server";
import { expectOkResponse, expectUnauthenticatedResponse } from "../extensions";
import { AppConstants } from "@/server.constants";
import { DITokens } from "@/container.tokens";
import { loginTestUser } from "./auth/login-test-user";
import githubReleasesResponse from "./test-data/github-releases.data.json";
import { ServerReleaseService } from "@/services/core/server-release.service";
import { SettingsStore } from "@/state/settings.store";
import { AxiosMock } from "../mocks/axios.mock";
import supertest from "supertest";
import { ServerPublicController } from "@/controllers/server-public.controller";
import { isDocker } from "@/utils/is-docker";

let container: AwilixContainer;
let releaseService: ServerReleaseService;
let settingsStore: SettingsStore;
let mockedHttpClient: AxiosMock;
let request: supertest.SuperTest<supertest.Test>;

const welcomeRoute = AppConstants.apiRoute;
const getRoute = welcomeRoute;
const testRoute = `${welcomeRoute}/test`;
const versionRoute = `${welcomeRoute}/version`;

beforeAll(async () => {
  ({ request, container } = await setupTestApp(true));
  releaseService = container.resolve(DITokens.serverReleaseService);
  settingsStore = container.resolve(DITokens.settingsStore);
  mockedHttpClient = container.resolve(DITokens.httpClient);
});

describe(ServerPublicController.name, () => {
  it("should return auth-based welcome", async function () {
    const response = await request.get(getRoute).send();
    expect(response.body).toMatchObject({
      message: "Login required. Please load the Vue app.",
    });
    expectOkResponse(response);
  });

  it("test should work for loginRequired true/false /", async function () {
    await settingsStore.setLoginRequired();
    const response = await request.get(testRoute).send();
    expectOkResponse(response);
    await settingsStore.setLoginRequired(false);
    const response2 = await request.get(testRoute).send();
    expectOkResponse(response2);
  });

  it("should not be authorized on /", async function () {
    await settingsStore.setLoginRequired();
    const response = await request.get(getRoute).send();
    expect(response.body).toMatchObject({
      error: "Not authenticated",
    });
    expectUnauthenticatedResponse(response);
    // Return to default
    await settingsStore.setLoginRequired(false);
  });

  it("should get login error", async function () {
    await settingsStore.setLoginRequired();
    const response = await request.get(getRoute).send();
    expect(response.body).toMatchObject({
      error: "Not authenticated",
    });
    expectUnauthenticatedResponse(response);
    // Return to default
    await settingsStore.setLoginRequired(false);
  });

  it("should get welcome message", async function () {
    await settingsStore.setLoginRequired();

    const { token } = await loginTestUser(request);
    const response = await request.get(getRoute).set("Authorization", `Bearer ${token}`).send();
    expect(response.body).toMatchObject({
      message: "Login required. Please load the Vue app.",
    });
    expectOkResponse(response);
    // Return to default
    await settingsStore.setLoginRequired(false);
  });

  it("should return unsynced state response", async function () {
    const response = await request.get(versionRoute).send();
    expectOkResponse(response, {
      isDockerContainer: isDocker(),
      isPm2: false,
      update: {
        synced: false,
        airGapped: null,
        updateAvailable: null,
      },
    });
  });

  it("should return airGapped response", async function () {
    mockedHttpClient.saveMockResponse(undefined, 0, false, true);
    await releaseService.syncLatestRelease(false);

    const response = await request.get(versionRoute).send();
    expectOkResponse(response, {
      isDockerContainer: isDocker(),
      isPm2: false,
      update: {
        synced: false,
        airGapped: null,
        updateAvailable: null,
      },
    });
  });

  it("should return update-to-date response", async function () {
    mockedHttpClient.saveMockResponse(githubReleasesResponse, 200);

    await releaseService.syncLatestRelease(false);

    const response = await request.get(versionRoute).send();
    expectOkResponse(response, {
      isDockerContainer: isDocker(),
      isPm2: false,
      update: {
        airGapped: null,
        synced: false,
        updateAvailable: null, // package.json is respected
      },
    });
  });
});
