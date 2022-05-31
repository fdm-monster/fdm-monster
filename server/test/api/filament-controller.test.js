const dbHandler = require("../db-handler");
const { AppConstants } = require("../../server.constants");
const { setupTestApp } = require("../test-server");
const {
  expectInvalidResponse,
  expectOkResponse,
  expectNotFoundResponse
} = require("../extensions");

const defaultRoute = `${AppConstants.apiRoute}/filament`;
const getRoute = (id) => `${defaultRoute}/${id}`;
const createRoute = defaultRoute;

let request;

beforeAll(async () => {
  await dbHandler.connect();
  ({ request } = await setupTestApp(true));
});

beforeEach(async () => {});

describe("FilamentController", () => {
  const badSpool = {};
  const newSpool = {
    name: "PLA",
    cost: 20.5,
    weight: 500.0,
    consumedRatio: 0.0,
    printTemperature: 215.0
  };
  const newSpoolManufacturer = {
    ...newSpool,
    manufacturer: "BigRoller"
  };

  it(`should LIST spools with ${defaultRoute}`, async () => {
    const response = await request.get(defaultRoute).send();
    expectOkResponse(response);
  });

  it("should not create spool from incorrect input", async () => {
    const response = await request.post(createRoute).send(badSpool);
    expectInvalidResponse(
      response,
      ["name", "cost", "weight", "consumedRatio", "printTemperature"],
      true
    );
  });

  it("should create spool correctly", async () => {
    const response = await request.post(createRoute).send(newSpool);
    expectOkResponse(response, { _id: expect.any(String) });
  });

  it("should create and get spool correctly", async () => {
    const response = await request.post(createRoute).send(newSpool);
    const data = expectOkResponse(response, { _id: expect.any(String) });

    const getResponse = await request.get(getRoute(data._id)).send();
    expectOkResponse(getResponse, { _id: data._id });
  });
});
