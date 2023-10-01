import supertest from "supertest";
import { connect } from "../db-handler";
import { setupTestApp } from "../test-server";
import { expectOkResponse } from "../extensions";
import { AppConstants } from "@/server.constants";
import {
  credentialSettingsKey,
  fileCleanSettingKey,
  frontendSettingKey,
  getDefaultFileCleanSettings,
  getDefaultFrontendSettings,
  getDefaultSettings,
  serverSettingsKey,
} from "@/constants/server-settings.constants";
import { SettingsController } from "@/controllers/settings.controller";

let request: supertest.SuperTest<supertest.Test>;

const defaultRoute = `${AppConstants.apiRoute}/settings`;
const serverSettingsRoute = `${defaultRoute}/server`;
const frontendSettingsRoute = `${defaultRoute}/frontend`;
const serverWhitelistRoute = `${defaultRoute}/whitelist`;
const sentryDiagnosticsRoute = `${defaultRoute}/sentry-diagnostics`;

beforeAll(async () => {
  await connect();
  ({ request } = await setupTestApp(true));
});

describe(SettingsController.name, () => {
  const newSettings = {
    [fileCleanSettingKey]: {
      autoRemoveOldFilesBeforeUpload: true,
    },
  };

  it("should OK on GET settings", async () => {
    const response = await request.get(defaultRoute).send();
    expect(response.body).not.toBeNull();
    const defaultSettings = getDefaultSettings();
    defaultSettings[serverSettingsKey].loginRequired = false; // Test override
    delete defaultSettings[credentialSettingsKey];
    expect(response.body).toMatchObject(defaultSettings);
    expect(response.body[credentialSettingsKey]).toBeFalsy();
    expect(response.body[serverSettingsKey].registration).toBeFalsy();
    expect(response.body[frontendSettingKey]).toMatchObject(getDefaultFrontendSettings());
    expect(response.body[fileCleanSettingKey]).toMatchObject(getDefaultFileCleanSettings());
    expectOkResponse(response);
  });

  it("should OK on PUT server settings ", async () => {
    const response = await request.put(serverSettingsRoute).send({
      registration: true,
      loginRequired: true,
    });
    expectOkResponse(response);
  });

  it("should OK on PATCH sentry diagnostics ", async () => {
    const response = await request.patch(sentryDiagnosticsRoute).send({
      enabled: true,
    });
    expectOkResponse(response);
  });

  it("should OK on PUT whitelist settings ", async () => {
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
