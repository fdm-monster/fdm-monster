import supertest from "supertest";
import { setupTestApp } from "../test-server";
import { expectOkResponse } from "../extensions";
import { AppConstants } from "@/server.constants";
import {
  credentialSettingsKey,
  printerFileCleanSettingKey,
  frontendSettingKey,
  getDefaultFileCleanSettings,
  getDefaultFrontendSettings,
  getDefaultSettings,
  serverSettingsKey,
  wizardSettingKey,
} from "@/constants/server-settings.constants";
import { SettingsController } from "@/controllers/settings.controller";
import { isSqliteModeTest } from "../typeorm.manager";

let request: supertest.SuperTest<supertest.Test>;

const defaultRoute = `${AppConstants.apiRoute}/settings`;
const sensitiveSettingsRoute = `${defaultRoute}/sensitive`;
const credentialSettingsRoute = `${defaultRoute}/credential`;
const serverSettingsRoute = `${defaultRoute}/server`;
const experimentalMoonrakerSupport = `${defaultRoute}/experimental-moonraker-support`;
const experimentalClientNextSupport = `${defaultRoute}/experimental-client-next-support`;
const frontendSettingsRoute = `${defaultRoute}/frontend`;
const fileCleanSettingsRoute = `${defaultRoute}/file-clean`;
const serverWhitelistRoute = `${defaultRoute}/whitelist`;
const sentryDiagnosticsRoute = `${defaultRoute}/sentry-diagnostics`;

beforeAll(async () => {
  ({ request } = await setupTestApp(true));
});

describe(SettingsController.name, () => {
  it("should OK on GET settings", async () => {
    const response = await request.get(defaultRoute).send();
    expect(response.body).not.toBeNull();
    const defaultSettings = getDefaultSettings();
    defaultSettings[serverSettingsKey].loginRequired = false; // Test override
    defaultSettings[serverSettingsKey].experimentalTypeormSupport = isSqliteModeTest();
    delete defaultSettings[serverSettingsKey].whitelistEnabled;
    delete defaultSettings[serverSettingsKey].whitelistedIpAddresses;
    delete defaultSettings[serverSettingsKey].debugSettings;
    delete defaultSettings[credentialSettingsKey];
    defaultSettings[wizardSettingKey].wizardCompleted = true;
    defaultSettings[wizardSettingKey].wizardVersion = AppConstants.currentWizardVersion;
    delete defaultSettings[wizardSettingKey].wizardCompletedAt;
    expect(response.body).toMatchObject(defaultSettings);
    expect(response.body[credentialSettingsKey]).toBeFalsy();
    expect(response.body[serverSettingsKey].loginRequired).toBe(false);
    expect(response.body[serverSettingsKey].registration).toBe(false);
    expect(response.body[frontendSettingKey]).toMatchObject(getDefaultFrontendSettings());
    expect(response.body[printerFileCleanSettingKey]).toMatchObject(getDefaultFileCleanSettings());
    expectOkResponse(response);
  });

  it("should OK on GET sensitive settings", async () => {
    const response = await request.get(sensitiveSettingsRoute).send();
    expect(response.body).not.toBeNull();
    expectOkResponse(response);
  });

  it("should OK on PUT server settings ", async () => {
    const response = await request.put(serverSettingsRoute).send({
      registration: true,
      loginRequired: false,
    });
    expectOkResponse(response);
  });

  it("should OK on PUT experimental moonraker support setting", async () => {
    const response = await request.put(experimentalMoonrakerSupport).send({
      enabled: true,
    });
    expectOkResponse(response);
  });

  it("should OK on PUT experimental client next support setting", async () => {
    const response = await request.put(experimentalClientNextSupport).send({
      enabled: true,
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
    expect(response.body).toStrictEqual({});

    const sensitiveSettings = await request.get(sensitiveSettingsRoute).send();
    expect(sensitiveSettings.body).toMatchObject({
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

  it("should OK on PUT fileClean settings", async () => {
    const newFileCleanSettings = {
      autoRemoveOldFilesBeforeUpload: true,
      autoRemoveOldFilesAtBoot: true,
      autoRemoveOldFilesCriteriumDays: 30,
    };
    const response = await request.put(fileCleanSettingsRoute).send(newFileCleanSettings);
    expect(response.body).not.toBeNull();
    expect(response.body).toMatchObject({
      [printerFileCleanSettingKey]: newFileCleanSettings,
    });
    expectOkResponse(response);
  });

  it("should OK on PUT credentials settings", async () => {
    const newCredentialsSettings = {
      jwtExpiresIn: 120,
      refreshTokenAttempts: -1,
      refreshTokenExpiry: 3600,
    };

    const response = await request.put(credentialSettingsRoute).send(newCredentialsSettings);
    expect(response.body).toStrictEqual({});
    expectOkResponse(response);
  });

  it("should OK on PUT login-required", async () => {
    const response = await request.put(`${defaultRoute}/login-required`).send({
      loginRequired: false,
    });
    expectOkResponse(response);
  });

  it("should OK on PUT registration-enabled", async () => {
    const response = await request.put(`${defaultRoute}/registration-enabled`).send({
      registrationEnabled: true,
    });
    expectOkResponse(response);
  });

  it("should OK on PUT timeout", async () => {
    const response = await request.put(`${defaultRoute}/timeout`).send({
      apiTimeout: 1000,
    });
    expectOkResponse(response);
  });
});
