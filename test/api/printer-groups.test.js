jest.mock("../../server/middleware/auth");

const dbHandler = require("../db-handler");
const { AppConstants } = require("../../server/app.constants");
const { setupTestApp } = require("../../server/app-test");
const { expectOkResponse } = require("../extensions");
const PrinterGroup = require("../../server/models/PrinterGroup");

let Model = PrinterGroup;
const listRoute = `${AppConstants.apiRoute}/printer-group`;
const createRoute = listRoute;
const getRoute = (id) => `${listRoute}/${id}`;
const deleteRoute = (id) => `${listRoute}/${id}`;
const updateRoute = (id) => `${listRoute}/${id}`;

let request;

beforeAll(async () => {
  await dbHandler.connect();
  ({ request } = await setupTestApp(true));
});

beforeEach(async () => {
  Model.deleteMany({});
});

describe("PrinterGroupsController", () => {
  it("should return empty printer group list", async function () {
    const response = await request.get(listRoute).send();
    expect(response.body).toMatchObject([]);
    expectOkResponse(response);
  });
});
