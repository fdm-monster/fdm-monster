import { Test } from "supertest";
import { setupTestApp } from "../test-server";
import { expectInvalidResponse, expectOkResponse } from "../extensions";
import { AppConstants } from "@/server.constants";
import {
  credentialSettingsKey,
  frontendSettingKey,
  getDefaultFrontendSettings,
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
const frontendSettingsRoute = `${defaultRoute}/frontend`;
const sentryDiagnosticsRoute = `${defaultRoute}/sentry-diagnostics`;
const slicerApiKeyRoute = `${defaultRoute}/slicer-api-key`;
const regenerateSlicerApiKeyRoute = `${slicerApiKeyRoute}/regenerate`;

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
      experimentalMoonrakerSupport: true
    });
    expect(body[wizardSettingKey]).toMatchObject({
      wizardCompleted: true,
      wizardVersion: AppConstants.currentWizardVersion,
    });
    expect(body[frontendSettingKey]).toMatchObject(getDefaultFrontendSettings());
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
    ]);
  });

  describe("Slicer API Key", () => {
    it("should return null slicerApiKey when none exists", async () => {
      const response = await request.get(slicerApiKeyRoute).send();
      expectOkResponse(response);
      expect(response.body).toMatchObject({
        slicerApiKey: null,
      });
    });

    it("should generate a new slicer API key", async () => {
      const response = await request.post(regenerateSlicerApiKeyRoute).send();
      expectOkResponse(response);
      expect(response.body).toHaveProperty("slicerApiKey");
      expect(response.body.slicerApiKey).toBeTruthy();
      expect(typeof response.body.slicerApiKey).toBe("string");
      // UUID format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
      expect(response.body.slicerApiKey).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      );
    });

    it("should return existing slicer API key after generation", async () => {
      // First generate a key
      const generateResponse = await request.post(regenerateSlicerApiKeyRoute).send();
      expectOkResponse(generateResponse);
      const generatedKey = generateResponse.body.slicerApiKey;

      // Then get the key
      const getResponse = await request.get(slicerApiKeyRoute).send();
      expectOkResponse(getResponse);
      expect(getResponse.body.slicerApiKey).toBe(generatedKey);
    });

    it("should regenerate a different slicer API key", async () => {
      // Generate first key
      const firstResponse = await request.post(regenerateSlicerApiKeyRoute).send();
      expectOkResponse(firstResponse);
      const firstKey = firstResponse.body.slicerApiKey;

      // Regenerate key
      const secondResponse = await request.post(regenerateSlicerApiKeyRoute).send();
      expectOkResponse(secondResponse);
      const secondKey = secondResponse.body.slicerApiKey;

      // Keys should be different
      expect(secondKey).not.toBe(firstKey);
    });

    it("should delete slicer API key", async () => {
      // First generate a key
      await request.post(regenerateSlicerApiKeyRoute).send();

      // Delete the key
      const deleteResponse = await request.delete(slicerApiKeyRoute).send();
      expectOkResponse(deleteResponse);
      expect(deleteResponse.body).toMatchObject({
        slicerApiKey: null,
      });

      // Verify it's deleted
      const getResponse = await request.get(slicerApiKeyRoute).send();
      expectOkResponse(getResponse);
      expect(getResponse.body.slicerApiKey).toBeNull();
    });
  });
});
