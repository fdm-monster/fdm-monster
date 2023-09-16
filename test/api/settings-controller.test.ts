import supertest from "supertest";
import { connect } from "../db-handler";
import { setupTestApp } from "../test-server";
import { expectOkResponse } from "../extensions";
import { AppConstants } from "@/server.constants";
import {
  fileCleanSettingKey,
  getDefaultFileCleanSettings,
  getDefaultSettings,
  serverSettingsKey,
  frontendSettingKey,
  getDefaultFrontendSettings,
  credentialSettingsKey,
} from "@/constants/server-settings.constants";

let request: supertest.SuperTest<supertest.Test>;

const defaultRoute = `${AppConstants.apiRoute}/settings/server`;
const frontendSettingsRoute = `${defaultRoute}/frontend`;
const serverWhitelistRoute = `${defaultRoute}/whitelist`;

beforeAll(async () => {
  await connect();
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
