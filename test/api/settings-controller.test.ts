import { beforeAll, describe, expect, it } from "@jest/globals";
const dbHandler = require("../db-handler");
const { setupTestApp } = require("../test-server");
const { expectOkResponse } = require("../extensions");
const { AppConstants } = require("@/server.constants");
const {
  fileCleanSettingKey,
  getDefaultFileCleanSettings,
  getDefaultSettings,
  serverSettingsKey,
  frontendSettingKey,
  getDefaultFrontendSettings,
  credentialSettingsKey,
} = require("@/constants/server-settings.constants");

let request;

const defaultRoute = `${AppConstants.apiRoute}/settings/server`;
const frontendSettingsRoute = `${defaultRoute}/frontend`;
const serverWhitelistRoute = `${defaultRoute}/whitelist`;

beforeAll(async () => {
  await dbHandler.connect();
  ({ request } = await setupTestApp(true));
});

describe("SettingsController", () => {
  const newSettings = {
    [fileCleanSettingKey]: {
      autoRemoveOldFilesBeforeUpload: true,
    },
  };

  it("should OK on GET settings", async () => {
    const response = await request.get(defaultRoute).send();
    expect(response.body).not.toBeNull();
    const defaultSettings = getDefaultSettings();
    delete defaultSettings[credentialSettingsKey];
    expect(response.body).toMatchObject(defaultSettings);
    expect(response.body[credentialSettingsKey]).toBeFalsy();
    expect(response.body[serverSettingsKey].registration).toBeTruthy();
    expect(response.body[frontendSettingKey]).toMatchObject(getDefaultFrontendSettings());
    expect(response.body[fileCleanSettingKey]).toMatchObject(getDefaultFileCleanSettings());
    expectOkResponse(response);
  });

  it("should OK on PUT whitelist server-settings ", async () => {
    const response = await request.put(serverWhitelistRoute).send({
      whitelistEnabled: true,
      whitelistedIpAddresses: ["127.0.0", "192.178.168"],
    });
    expect(response.body).not.toBeNull();
    expect(response.body).toMatchObject({
      [serverSettingsKey]: {
        whitelistEnabled: true,
        whitelistedIpAddresses: ["127.0.0", "192.178.168", "127.0.0.1"],
      },
    });
    expectOkResponse(response);
  });

  // Removed in 1.5.0
  test.skip("should OK on PUT settings", async () => {
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
