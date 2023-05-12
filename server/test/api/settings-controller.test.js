const dbHandler = require("../db-handler");
const { setupTestApp } = require("../test-server");
const { AppConstants } = require("../../server.constants");
const { expectOkResponse } = require("../extensions");
const {
  printerFileCleanSettingKey,
  getDefaultPrinterFileCleanSettings,
  getDefaultSettings,
  serverSettingKey,
  frontendSettingKey,
  getDefaultFrontendSettings,
} = require("../../constants/server-settings.constants");

let request;
let container;

const defaultRoute = `${AppConstants.apiRoute}/settings`;
const frontendSettingsRoute = `${defaultRoute}/frontend`;
const serverWhitelistRoute = `${defaultRoute}/whitelist`;

beforeAll(async () => {
  await dbHandler.connect();
  ({ request, container } = await setupTestApp(true));
});

describe("SettingsController", () => {
  const newSettings = {
    [printerFileCleanSettingKey]: {
      autoRemoveOldFilesBeforeUpload: true,
    },
  };

  it("should OK on GET settings", async () => {
    const response = await request.get(serverRoute).send();
    expect(response.body).not.toBeNull();
    expect(response.body).toMatchObject(getDefaultSettings());
    expect(response.body[serverSettingKey].registration).toBeTruthy();
    expect(response.body[frontendSettingKey]).toMatchObject(getDefaultFrontendSettings());
    expect(response.body[printerFileCleanSettingKey]).toMatchObject(getDefaultPrinterFileCleanSettings());
    expectOkResponse(response);
  });

  it("should OK on PUT whitelist server-settings ", async () => {
    const response = await request.put(serverWhitelistRoute).send({
      whitelistEnabled: true,
      whitelistedIpAddresses: ["127.0.0", "192.178.168"],
    });
    expect(response.body).not.toBeNull();
    expect(response.body).toMatchObject({
      [serverSettingKey]: {
        whitelistEnabled: true,
        whitelistedIpAddresses: ["127.0.0", "192.178.168", "127.0.0.1"],
      },
    });
    expectOkResponse(response);
  });

  it("should OK on PUT settings", async () => {
    const response = await request.put(defaultRoute).send(newSettings);
    expect(response.body).not.toBeNull();
    expect(response.body).toMatchObject(newSettings);
    expectOkResponse(response);
  });

  it("should OK on PUT frontend settings", async () => {
    const newFrontendSettings = {
      gridCols: 6,
      gridRows: 6,
      largeTiles: false,
    };
    const response = await request.put(frontendSettingsRoute).send(newFrontendSettings);
    expect(response.body).not.toBeNull();
    expect(response.body).toMatchObject({
      [frontendSettingKey]: newFrontendSettings,
    });
    expectOkResponse(response);
  });
});
