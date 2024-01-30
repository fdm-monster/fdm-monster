import { AppConstants } from "@/server.constants";
import { setupTestApp } from "../test-server";
import { expectInvalidResponse, expectNotFoundResponse, expectOkResponse } from "../extensions";
import { createTestPrinter } from "./test-data/create-printer";
import supertest from "supertest";
import { CustomGcodeDto } from "@/services/interfaces/custom-gcode.dto";
import { IdType, SqliteIdType } from "@/shared.constants";
import { getDatasource, isSqliteModeTest } from "../typeorm.manager";
import { CustomGcode } from "@/entities";
import { CustomGcode as CustomGcodeMongo } from "@/models";
import { CustomGcodeController } from "@/controllers/custom-gcode.controller";

const defaultRoute = `${AppConstants.apiRoute}/custom-gcode`;
const createRoute = defaultRoute;
const emergencyGCodeRoute = (printerId: string) => `${defaultRoute}/send-emergency-m112/${printerId}`;
const getRoute = (id: IdType) => `${defaultRoute}/${id}`;
const deleteRoute = (id: IdType) => `${defaultRoute}/${id}`;
const updateRoute = (id: IdType) => `${defaultRoute}/${id}`;

let request: supertest.SuperTest<supertest.Test>;

beforeAll(async () => {
  ({ request } = await setupTestApp(true));
});

beforeEach(async () => {
  if (isSqliteModeTest()) {
    return getDatasource().getRepository(CustomGcode).clear();
  } else {
    await CustomGcodeMongo.deleteMany({});
  }
});

function getGCodeScript() {
  return {
    name: "custom-script",
    gcode: "G28\nG28",
  };
}

async function createNormalGcodeScript(request: supertest.SuperTest<supertest.Test>) {
  const response = await request.post(createRoute).send(getGCodeScript());
  expectOkResponse(response);
  return response.body as CustomGcodeDto<SqliteIdType>;
}

describe(CustomGcodeController.name, () => {
  it("should send emergency gcode command", async function () {
    const printer = await createTestPrinter(request);
    const response = await request.post(emergencyGCodeRoute(printer.id)).send();
    expectOkResponse(response, null);
  });

  it("should return empty gcode script list", async function () {
    const response = await request.get(defaultRoute).send();
    expect(response.body).toMatchObject([]);
    expectOkResponse(response);
  });

  it("should create new gcode script", async function () {
    await createNormalGcodeScript(request);
  });

  it("should update existing gcode script", async function () {
    const existingScript = await createNormalGcodeScript(request);

    const data = {
      ...existingScript,
      name: "newName",
    };
    const response = await request.put(updateRoute(existingScript.id)).send(data);
    expectOkResponse(response, {
      name: "newName",
    });
  });

  it("should delete existing gcode script", async () => {
    const gcodeScript = await createNormalGcodeScript(request);
    const response = await request.delete(updateRoute(gcodeScript.id)).send();
    expectOkResponse(response);
  });

  it("should not accept bad id for gcode script", async () => {
    const response = await request.get(getRoute("fake")).send();
    expectInvalidResponse(response);
  });

  it("should not get non-existing gcode script", async () => {
    const response = await request.get(getRoute(isSqliteModeTest() ? 1234 : "648f3e6d372112628bb8e404")).send();
    console.log(response.body);
    expectNotFoundResponse(response);
  });

  it("should create new gcode script", async function () {
    const script = await createNormalGcodeScript(request);

    const response = await request.get(getRoute(script.id)).send();
    expectOkResponse(response);
  });
});
