import { AppConstants } from "@/server.constants";
import { setupTestApp } from "../test-server";
import { expectOkResponse } from "../extensions";
import { createTestPrinter } from "./test-data/create-printer";
import { Test } from "supertest";
import { PluginFirmwareUpdateController } from "@/controllers/plugin-firmware-update.controller";
import nock from "nock";
import TestAgent from "supertest/lib/agent";
import { IdType } from "@/shared.constants";

const defaultRoute = AppConstants.apiRoute + "/plugin/firmware-update";
const listRoute = `${defaultRoute}/`;
const scanRoute = `${defaultRoute}/scan`;
const syncReleasesRoute = `${defaultRoute}/releases/sync`;
const downloadFirmwareRoute = `${defaultRoute}/download-firmware`;
const isPluginInstalledRoute = (id: IdType) => `${defaultRoute}/${id}/is-plugin-installed`;
const installPluginRoute = (id: IdType) => `${defaultRoute}/${id}/install-firmware-update-plugin`;
const pluginStatusRoute = (id: IdType) => `${defaultRoute}/${id}/status`;
const configurePluginSettingsRoute = (id: IdType) => `${defaultRoute}/${id}/configure-plugin-settings`;
const flashFirmwareRoute = (id: IdType) => `${defaultRoute}/${id}/flash-firmware`;

let request: TestAgent<Test>;

beforeAll(async () => {
  ({ request } = await setupTestApp(true));
});

describe(PluginFirmwareUpdateController.name, () => {
  it(`should be able to GET ${listRoute} empty cache`, async () => {
    const response = await request.get(listRoute).send();
    expectOkResponse(response);
  });

  it(`should be able to POST ${scanRoute} to perform scan`, async () => {
    await createTestPrinter(request);
    const response = await request.post(scanRoute).send();
    expectOkResponse(response);
  });

  it("should query GitHub releases", async () => {
    nock("https://api.github.com/")
      .get("/repos/prusa3d/Prusa-Firmware/releases")
      .reply(200, require("./test-data/prusa-github-releases.data.json"));

    const syncResponse = await request.post(syncReleasesRoute).send();
    expectOkResponse(syncResponse);
    expect(syncResponse.body).toHaveLength(30);
  });

  it("should indicate plugin is installed", async () => {
    const testPrinter = await createTestPrinter(request);

    nock(testPrinter.printerURL)
      .get(`/plugin/pluginmanager/plugins`)
      .reply(200, { plugins: [{ key: "firmwareupdater" }] });

    const response = await request.get(isPluginInstalledRoute(testPrinter.id)).send();
    expectOkResponse(response);
    expect(response.body.isInstalled).toBeTruthy();
  });

  it("should not install plugin when already installed", async () => {
    const testPrinter = await createTestPrinter(request);

    nock(testPrinter.printerURL)
      .get(`/plugin/pluginmanager/plugins`)
      .reply(200, { plugins: [{ key: "firmwareupdater" }] });

    const response = await request.post(installPluginRoute(testPrinter.id)).send();
    expectOkResponse(response, {
      isInstalled: true,
      installing: false,
    });
  });

  it("should get idle firmware updater status", async () => {
    const testPrinter = await createTestPrinter(request);

    // Replacing httpClient.saveMockResponse with nock
    nock(testPrinter.printerURL).get("/plugin/firmwareupdater/status").reply(200, { flashing: false });

    const response = await request.get(pluginStatusRoute(testPrinter.id)).send();
    expectOkResponse(response, { flashing: false });
  });

  it("should configure plugin settings", async () => {
    const testPrinter = await createTestPrinter(request);

    nock(testPrinter.printerURL).post(`/api/settings`).reply(200, { plugins: [] });

    const response = await request.post(configurePluginSettingsRoute(testPrinter.id)).send();
    expectOkResponse(response);
  });

  it("should not trigger flash firmware action on illegal files", async () => {
    const testPrinter = await createTestPrinter(request);

    nock(testPrinter.printerURL).post(`/plugin/pluginmanager/plugins`).reply(200, { flashing: true });

    const response = await request.post(flashFirmwareRoute(testPrinter.id)).send();
    expect(response.status).not.toBe(200);
  });

  // This is too intrusive still (needs fs isolation)
  test.skip(`should be able to POST ${downloadFirmwareRoute} to let server download firmware`, async () => {
    const testPrinter = await createTestPrinter(request);
    nock("https://api.github.com")
      .get("/repos/prusa3d/Prusa-Firmware/releases")
      .reply(200, require("./test-data/prusa-github-releases.data.json"));

    const syncResponse = await request.post(syncReleasesRoute).send();
    expectOkResponse(syncResponse);
    expect(syncResponse.body).toHaveLength(30);

    nock(testPrinter.printerURL).post("/plugin/pluginmanager/plugins").reply(200, []);

    const response = await request.post(downloadFirmwareRoute).send();
    expectOkResponse(response);

    const response2 = await request.post(downloadFirmwareRoute).send();
    expectOkResponse(response2);
  });
});
