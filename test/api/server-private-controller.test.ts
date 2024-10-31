import { setupTestApp } from "../test-server";
import { expectInternalServerError, expectOkResponse, expectUnauthenticatedResponse } from "../extensions";
import { load } from "js-yaml";
import { exportYamlBuffer1_3_1 } from "../application/test-data/yaml-import";
import { AppConstants } from "@/server.constants";
import { DITokens } from "@/container.tokens";
import { validateInput } from "@/handlers/validators";
import { importPrintersFloorsYamlRules } from "@/services/validators/yaml-service.validation";
import { AwilixContainer } from "awilix";
import { Test } from "supertest";
import { SettingsStore } from "@/state/settings.store";
import { ServerPrivateController } from "@/controllers/server-private.controller";
import TestAgent from "supertest/lib/agent";
import nock from "nock";

let request: TestAgent<Test>;
let container: AwilixContainer;
let settingsStore: SettingsStore;

const defaultRoute = `${AppConstants.apiRoute}/server`;
const getClientReleasesRoute = `${defaultRoute}/client-releases`;
const gitUpdateRoute = `${defaultRoute}/git-update`;
const exportPrintersAndFloorsRoute = `${defaultRoute}/export-printers-floors-yaml`;
const importPrintersAndFloorsRoute = `${defaultRoute}/import-printers-floors-yaml`;
const restartRoute = `${defaultRoute}/restart`;

beforeAll(async () => {
  ({ request, container } = await setupTestApp());
  settingsStore = container.resolve(DITokens.settingsStore);
});

describe(ServerPrivateController.name, () => {
  it("should get client releases", async () => {
    nock("https://api.github.com/")
      .get("/repos/fdm-monster/fdm-monster-client/releases/latest")
      .reply(200, require("./test-data/github-releases-latest-client-slim-oct-2024.data.json"))
      .get("/repos/fdm-monster/fdm-monster-client/releases")
      .reply(200, require("./test-data/github-releases-client-slim-oct-2024.data.json"));

    expect(nock.activeMocks()).toHaveLength(2);

    const response = await request.get(getClientReleasesRoute).send();
    expectOkResponse(response);
    expect(response.body.latest.tag_name).toEqual("1.6.4");

    expect(nock.activeMocks()).toHaveLength(0);
  });

  it("should get update info", async () => {
    process.env[AppConstants.VERSION_KEY] = require("../../package.json").version;

    const response = await request.get(defaultRoute).send();
    expectOkResponse(response, {
      airGapped: null,
      latestRelease: null,
      installedRelease: null,
      serverVersion: process.env.npm_package_version,
      installedReleaseFound: null,
      updateAvailable: null,
      synced: false,
    });
  });

  it("should pull git updates", async () => {
    const response = await request.post(gitUpdateRoute).send();
    expectOkResponse(response);
  });

  it("should skip server restart - no daemon error", async () => {
    const response = await request.post(restartRoute).send();
    expectInternalServerError(response);
  });

  it("should not allow unauthenticated server restart", async () => {
    await settingsStore.setLoginRequired();
    const response = await request.post(restartRoute).send();
    expectUnauthenticatedResponse(response);
    await settingsStore.setLoginRequired(false);
  });

  it("should do server restart when nodemon is detected", async () => {
    let valueBefore = process.env.npm_lifecycle_script;

    process.env.npm_lifecycle_script = "nodemon";
    const response = await request.post(restartRoute).send();
    expectOkResponse(response);

    process.env.npm_lifecycle_script = valueBefore;
  });

  it("should export YAML and return valid object", async () => {
    const response = await request.post(exportPrintersAndFloorsRoute).send({
      exportPrinters: true,
      exportFloorGrid: true,
      exportFloors: true,
      printerComparisonStrategiesByPriority: ["name"],
      floorComparisonStrategiesByPriority: "name",
      notes: "Some export from 2023",
    });
    expectOkResponse(response);

    const yamlObject = load(response.text);
    await validateInput(yamlObject, importPrintersFloorsYamlRules(true, true, true, true));
  });

  test.skip("should import YAML and have data loaded", async () => {
    const response = await request.post(importPrintersAndFloorsRoute).attach("file", exportYamlBuffer1_3_1);
    expectOkResponse(response);
  });
});
