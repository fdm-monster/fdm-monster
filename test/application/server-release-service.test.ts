import { AppConstants } from "@/server.constants";
import { configureContainer } from "@/container";
import { DITokens } from "@/container.tokens";
import { asClass, AwilixContainer } from "awilix";
import { AxiosMock } from "../mocks/axios.mock";
import { ServerReleaseService } from "@/services/core/server-release.service";
import nock from "nock";
import githubReleasesResponse from "../api/test-data/github-releases-server-feb-2022.data.json";

let container: AwilixContainer;
let service: ServerReleaseService;
const v1 = "1.0.0";

beforeAll(async () => {
  container = configureContainer();
  container.register(DITokens.httpClient, asClass(AxiosMock).singleton());

  service = container.resolve(DITokens.serverReleaseService);
});

describe(ServerReleaseService.name, () => {
  it("should know process version", () => {
    expect(process.env[AppConstants.VERSION_KEY]).toEqual(v1);
    expect(container.resolve(DITokens.serverVersion)).toEqual(v1);
  });

  it("should return github releases", async () => {
    // TODO these dont work yet (octokit undici/native-fetch)
    nock("https://api.github.com").get("/repos/fdm-monster/fdm-monster/releases/").reply(200, githubReleasesResponse);

    await service.syncLatestRelease();
    expect(service.getState()).toMatchObject({
      airGapped: null,
      installedRelease: null,
      installedReleaseFound: null,
      latestRelease: null,
      serverVersion: v1,
      updateAvailable: null,
      synced: false,
    });
  });

  it("should log server version", () => {
    service.logServerVersionState();
  });
});
