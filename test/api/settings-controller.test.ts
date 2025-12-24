import { Test } from "supertest";
import { setupTestApp } from "../test-server";
import { expectInvalidResponse, expectOkResponse } from "../extensions";
import { AppConstants } from "@/server.constants";
import {
  credentialSettingsKey,
  frontendSettingKey,
  getDefaultFileCleanSettings,
  getDefaultFrontendSettings,
  printerFileCleanSettingKey,
  serverSettingsKey,
  timeoutSettingKey,
  wizardSettingKey,
} from "@/constants/server-settings.constants";
import { SettingsController } from "@/controllers/settings.controller";
import TestAgent from "supertest/lib/agent";
import { FrontendSettingsDto } from "@/services/interfaces/settings.dto";

let request: TestAgent<Test>;

const defaultRoute = `${AppConstants.apiRoute}/settings`;
const sensitiveSettingsRoute = `${defaultRoute}/sensitive`;
const credentialSettingsRoute = `${defaultRoute}/credential`;
const experimentalMoonrakerSupport = `${defaultRoute}/experimental-moonraker-support`;
const experimentalClientSupport = `${defaultRoute}/experimental-client-support`;
const frontendSettingsRoute = `${defaultRoute}/frontend`;
const fileCleanSettingsRoute = `${defaultRoute}/file-clean`;
const sentryDiagnosticsRoute = `${defaultRoute}/sentry-diagnostics`;

beforeAll(async () => {
  ({ request } = await setupTestApp(true));
});

describe(SettingsController.name, () => {
  it("should OK on GET settings", async () => {
    const response = await request.get(defaultRoute).send();

    expectOkResponse(response);
    const body = response.body;
    expect(body).not.toBeNull();

    expect(body[serverSettingsKey]).toMatchObject({
      sentryDiagnosticsEnabled: false,
      loginRequired: false,
      registration: false,
      experimentalMoonrakerSupport: true,
      experimentalClientSupport: false,
      experimentalThumbnailSupport: false,
    });
    expect(body[wizardSettingKey]).toMatchObject({
      wizardCompleted: true,
      wizardVersion: AppConstants.currentWizardVersion,
    });
    expect(body[frontendSettingKey]).toMatchObject(getDefaultFrontendSettings());
    expect(body[printerFileCleanSettingKey]).toMatchObject(getDefaultFileCleanSettings());
    expect(body.connection).toMatchObject({
      clientIp: expect.any(String),
      version: expect.any(String),
    });
    expect(body[timeoutSettingKey]).toMatchObject({
      apiTimeout: 10000,
      apiUploadTimeout: 30000,
    });

    // Removed property
    expect(body[credentialSettingsKey]).toBeFalsy();
  });

  it("should OK on GET sensitive settings", async () => {
    const response = await request.get(sensitiveSettingsRoute).send();
    expect(response.body).not.toBeNull();
    expectOkResponse(response);
  });

  it("should OK on PUT experimental moonraker support setting", async () => {
    const response = await request.put(experimentalMoonrakerSupport).send({
      enabled: true,
    });
    expectOkResponse(response);
  });

  it("should OK on PUT experimental client support setting", async () => {
    const response = await request.put(experimentalClientSupport).send({
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

  it("should OK on PUT frontend settings", async () => {
    const newFrontendSettings: FrontendSettingsDto = {
      gridCols: 6,
      gridRows: 6,
      largeTiles: false,
      tilePreferCancelOverQuickStop: false,
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
      apiUploadTimeout: 10000,
    });
    expectOkResponse(response);
  });

  it("should not OK on PUT timeout which is too low", async () => {
    const response = await request.put(`${defaultRoute}/timeout`).send({
      apiTimeout: 1000,
      apiUploadTimeout: 9000,
    });
    expectInvalidResponse(response, [
        {
          path: "apiUploadTimeout",
          code: "too_small",
        },
      ],
    );
  });
});
