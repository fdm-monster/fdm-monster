import { setupTestApp } from "../test-server";
import { expectOkResponse } from "../extensions";
import { load } from "js-yaml";
import { exportYamlBuffer1_3_1 } from "../application/test-data/yaml-import";
import { AppConstants } from "@/server.constants";
import { validateInput } from "@/handlers/validators";
import { Test } from "supertest";
import { ServerPrivateController } from "@/controllers/server-private.controller";
import TestAgent from "supertest/lib/agent";
import nock from "nock";
import { importPrintersFloorsYamlSchema, YamlExportSchema } from "@/services/validators/yaml-service.validation";

let request: TestAgent<Test>;

const defaultRoute = `${AppConstants.apiRoute}/server`;
const getClientReleasesRoute = `${defaultRoute}/client-releases`;
const exportPrintersAndFloorsRoute = `${defaultRoute}/yaml-export`;
const importPrintersAndFloorsRoute = `${defaultRoute}/yaml-import`;

beforeAll(async () => {
  ({ request } = await setupTestApp());
});

describe(ServerPrivateController.name, () => {
  it("should get client releases", async () => {
    // TODO these dont work yet (octokit undici/native-fetch)
    nock("https://api.github.com/")
      .get("/repos/fdm-monster/fdm-monster-client-next/releases/latest")
      .reply(200, require("./test-data/github-releases-latest-client-slim-oct-2024.data.json"))
      .get("/repos/fdm-monster/fdm-monster-client-next/releases")
      .reply(200, require("./test-data/github-releases-client-slim-oct-2024.data.json"));

    expect(nock.activeMocks()).toHaveLength(2);

    const response = await request.get(getClientReleasesRoute).send();
    expectOkResponse(response);
    // Technically speaking this should not query live data (but sadly octokit is not nock-compatible right now)
    // expect(response.body.latest.tag_name).toEqual("1.6.3");

    // TODO here you see the mock issue
    expect(nock.activeMocks()).toHaveLength(2);
  });

  it("should get update info", async () => {
    const response = await request.get(defaultRoute).send();
    expectOkResponse(response, {
      airGapped: null,
      latestRelease: null,
      installedRelease: null,
      // test version
      serverVersion: "1.0.0",
      installedReleaseFound: null,
      updateAvailable: null,
      synced: false,
    });
  });

  it("should export YAML and return valid object", async () => {
    const response = await request.post(exportPrintersAndFloorsRoute).send({
      exportPrinters: true,
      exportFloorGrid: true,
      exportFloors: true,
      exportGroups: true,
      printerComparisonStrategiesByPriority: ["name"],
      floorComparisonStrategiesByPriority: "name",
      notes: "Some export from 2023",
    });
    expectOkResponse(response);

    const yamlObject = load(response.text) as YamlExportSchema;
    expect(yamlObject).toBeDefined();
    await validateInput(yamlObject, importPrintersFloorsYamlSchema);
  });

  it("should import YAML and have data loaded", async () => {
    const response = await request
      .post(importPrintersAndFloorsRoute)
      .attach("file", Buffer.from(exportYamlBuffer1_3_1), "export.yaml");
    expectOkResponse(response);
  });
});
