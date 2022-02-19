const { AppConstants } = require("../../server.constants");
const dbHandler = require("../db-handler");
const { setupTestApp } = require("../test-server");
const { expectOkResponse } = require("../extensions");
const CustomGCode = require("../../models/CustomGCode");

let Model = CustomGCode;
const listRoute = `${AppConstants.apiRoute}/custom-gcode`;
const createRoute = listRoute;
const getRoute = (id) => `${listRoute}/${id}`;
const deleteRoute = (id) => `${listRoute}/${id}`;
const updateRoute = (id) => `${listRoute}/${id}`;

let container;
let request;

beforeAll(async () => {
  await dbHandler.connect();
  ({ request, container } = await setupTestApp(true));
});

beforeEach(async () => {
  return Model.deleteMany({});
});

function getGCodeScript() {
  return {
    name: "custom-script",
    gcode: "G28\nG28"
  };
}

async function createNormalGCodeScript(request) {
  const response = await request.post(createRoute).send(getGCodeScript());
  expectOkResponse(response);
  return response.body;
}

describe("CustomGCodeController", () => {
  it("should return empty gcode script list", async function () {
    const response = await request.get(listRoute).send();
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
      name: "newName"
    };
    const response = await request.put(updateRoute(existingScript._id)).send(data);
    expectOkResponse(response, {
      name: "newName"
    });
  });

  it("should delete existing gcode script", async function () {
    const gcodeScript = await createNormalGCodeScript(request);
    const response = await request.delete(updateRoute(gcodeScript._id)).send();
    expectOkResponse(response);
  });
});
