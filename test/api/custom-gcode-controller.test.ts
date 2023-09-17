import { AppConstants } from "@/server.constants";
import { connect } from "../db-handler";
import { setupTestApp } from "../test-server";
import { expectInvalidResponse, expectNotFoundResponse, expectOkResponse } from "../extensions";
import { CustomGCode } from "@/models";
import { createTestPrinter } from "./test-data/create-printer";
import supertest from "supertest";

let Model = CustomGCode;
const defaultRoute = `${AppConstants.apiRoute}/custom-gcode`;
const createRoute = defaultRoute;
const emergencyGCodeRoute = (printerId: string) => `${defaultRoute}/send-emergency-m112/${printerId}`;
const getRoute = (id: string) => `${defaultRoute}/${id}`;
const deleteRoute = (id: string) => `${defaultRoute}/${id}`;
const updateRoute = (id: string) => `${defaultRoute}/${id}`;

let request: supertest.SuperTest<supertest.Test>;

beforeAll(async () => {
  await connect();
  ({ request } = await setupTestApp(true));
});

beforeEach(async () => {
  return Model.deleteMany({});
});

function getGCodeScript() {
  return {
    name: "custom-script",
    gcode: "G28\nG28",
  };
}

async function createNormalGCodeScript(request) {
  const response = await request.post(createRoute).send(getGCodeScript());
  expectOkResponse(response);
  return response.body;
}

describe("CustomGCodeController", () => {
  it("should send emergency gcode command", async function () {
    const printer = await createTestPrinter(request);
    const response = await request.post(emergencyGCodeRoute(printer.id)).send();
    expectOkResponse(response, null, response.body);
  });

  it("should return empty gcode script list", async function () {
    const response = await request.get(defaultRoute).send();
    expect(response.body).toMatchObject([]);
    expectOkResponse(response);
  });

  it("should create new gcode script", async function () {
    await createNormalGCodeScript(request);
  });

  it("should update existing gcode script", async function () {
    const existingScript = await createNormalGCodeScript(request);

    const data = {
      ...existingScript,
      name: "newName",
    };
    const response = await request.put(updateRoute(existingScript._id)).send(data);
    expectOkResponse(response, {
      name: "newName",
    });
  });

  it("should delete existing gcode script", async () => {
    const gcodeScript = await createNormalGCodeScript(request);
    const response = await request.delete(updateRoute(gcodeScript._id)).send();
    expectOkResponse(response);
  });

  it("should not accept bad id for gcode script", async () => {
    const response = await request.get(getRoute("fake")).send();
    expectInvalidResponse(response);
  });

  it("should not get non-existing gcode script", async () => {
    const response = await request.get(getRoute("62e0e02478368d2013aff094")).send();
    expectNotFoundResponse(response);
  });

  it("should create new gcode script", async function () {
    const script = await createNormalGCodeScript(request);

    const response = await request.get(getRoute(script._id)).send();
    expectOkResponse(response);
  });
});
