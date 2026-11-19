import { DITokens } from "@/container.tokens";
import { setupTestApp } from "../../test-server";
import { AwilixContainer } from "awilix";
import { MoonrakerClient } from "@/services/moonraker/moonraker.client";
import { MoonrakerType } from "@/services/printer-api.interface";
import nock from "nock";

let moonrakerClient: MoonrakerClient;
let container: AwilixContainer;

beforeAll(async () => {
  ({ container } = await setupTestApp(true));
  moonrakerClient = container.resolve(DITokens.moonrakerClient);
  await container.resolve(DITokens.settingsStore).loadSettings();
});

describe(MoonrakerClient.name, () => {
  const printerURL = "http://someurl/";

  it("should send X-Api-Key header when apiKey is configured", async () => {
    const apiKey = "surewhynotsurewhynotsurewhynotsu";
    const auth = { apiKey, printerURL, printerType: MoonrakerType };

    const scope = nock(printerURL, {
      reqheaders: {
        "x-api-key": apiKey,
      },
    })
      .get("/server/info")
      .reply(200, {});

    const result = await moonrakerClient.getServerInfo(auth);
    expect(result.data).toStrictEqual({});
    expect(scope.isDone()).toBe(true);
  });

  it("should not send X-Api-Key header when apiKey is not configured", async () => {
    const auth = { printerURL, printerType: MoonrakerType };

    const scope = nock(printerURL, {
      badheaders: ["x-api-key"],
    })
      .get("/server/info")
      .reply(200, {});

    const result = await moonrakerClient.getServerInfo(auth);
    expect(result.data).toStrictEqual({});
    expect(scope.isDone()).toBe(true);
  });
});
