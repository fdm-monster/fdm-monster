const dbHandler = require("../db-handler");
const { AppConstants } = require("../../server.constants");
const { setupTestApp } = require("../test-server");
const { expectOkResponse, expectInternalServerError, expectNotFoundResponse, expectInvalidResponse } = require("../extensions");
const { createTestPrinter } = require("./test-data/create-printer");
const { createTestFloor, floorRoute } = require("./test-data/create-printer-floor");
const { Floor } = require("../../models/Floor");
const { DITokens } = require("../../container.tokens");

let Model = Floor;
const listRoute = `${AppConstants.apiRoute}/floor`;
const getRoute = (id) => `${listRoute}/${id}`;
const addPrinterToFloorRoute = (id) => `${listRoute}/${id}/printer`;
const deleteRoute = (id) => `${listRoute}/${id}`;
const updateNameRoute = (id) => `${getRoute(id)}/name`;
const updateFloorNumberRoute = (id) => `${getRoute(id)}/floor-number`;

let request;
let container;
let printerSocketStore;

beforeAll(async () => {
  await dbHandler.connect();
  ({ request, container } = await setupTestApp(true));
  printerSocketStore = container.resolve(DITokens.printerSocketStore);
});

beforeEach(async () => {
  Model.deleteMany({});
});

describe("FloorController", () => {
  it("should return non-empty floor list", async () => {
    const response = await request.get(listRoute).send();
    const data = expectOkResponse(response);
    expect(data).toHaveLength(1);
    expect(data[0].name).toBe("Default Floor");

    const getResponse = await request.get(getRoute(data[0]._id));
    expectOkResponse(getResponse);
  });

  it("should not be able to create falsy floor", async () => {
    const createResponse = await request.post(floorRoute).send({});
    expectInvalidResponse(createResponse);
  });

  it("should not be able to create floor with same floor level number", async () => {
    const floorNumber = 234;
    const body = await createTestFloor(request, "Floor101", floorNumber);
    expect(body.name).toBe("Floor101");
    const createResponse = await request.post(floorRoute).send({
      name: body.name,
      floor: floorNumber,
      printers: [],
    });
    expectInternalServerError(createResponse);
  });

  it("should be able to create floor with different floor numbers", async () => {
    const body = await createTestFloor(request, "Floor101", 1234);
    expect(body.name).toBe("Floor101");
    const body2 = await createTestFloor(request, "Floor102", 1235);
    expect(body2.name).toBe("Floor102");
  });

  it("should be able to get floor", async () => {
    const floor = await createTestFloor(request, "Floor123", 506);
    const response = await request.get(getRoute(floor._id)).send();
    expectOkResponse(response, { name: "Floor123" });
  });

  it("should throw on getting non-existing floor", async () => {
    const response = await request.get(getRoute("63452115122876ea11cd1656")).send();
    expectNotFoundResponse(response);
  });

  it("should be able to update floor name", async () => {
    const floor = await createTestFloor(request, "Floor123", 507);
    const response = await request.patch(updateNameRoute(floor._id)).send({
      name: "newName",
    });
    expectOkResponse(response, { name: "newName" });
  });

  it("should be able to update floor number", async () => {
    const floor = await createTestFloor(request, "Floor123", 5070);
    const response = await request.patch(updateFloorNumberRoute(floor._id)).send({
      floor: 5071,
    });
    expectOkResponse(response, { name: "Floor123", floor: 5071 });
  });

  it("should be able to delete floor", async () => {
    const floor = await createTestFloor(request, "Floor123", 508);
    const response = await request.delete(deleteRoute(floor._id)).send();
    expectOkResponse(response);
  });

  it("should not be able to add printer to non-existing floor", async () => {
    const printer = await createTestPrinter(request);

    const response = await request.post(addPrinterToFloorRoute("63452115122876ea11cd1656")).send({
      printerId: printer.id,
      x: 1,
      y: 1,
    });
    expectNotFoundResponse(response);
  });

  it("should be able to add printer to floor", async () => {
    const printer = await createTestPrinter(request);
    const floor = await createTestFloor(request, "Floor123", 509);
    expect(floor).toMatchObject({ _id: expect.any(String) });

    const response = await request.post(addPrinterToFloorRoute(floor._id)).send({
      printerId: printer.id,
      x: 1,
      y: 1,
    });
    expectOkResponse(response);

    // Sadly no distinctness criterium yet
    const response2 = await request.post(addPrinterToFloorRoute(floor._id)).send({
      printerId: printer.id,
      x: 1,
      y: 1,
    });
    expectOkResponse(response2);
  });

  it("should be able to remove printer from floor", async () => {
    const printer = await createTestPrinter(request);
    const floor = await createTestFloor(request, "Floor123", 510);
    expect(floor).toMatchObject({ _id: expect.any(String) });

    const response = await request.post(addPrinterToFloorRoute(floor._id)).send({
      printerId: printer.id,
      x: 1,
      y: 1,
    });
    expectOkResponse(response);

    const deleteResponse = await request.delete(addPrinterToFloorRoute(floor._id)).send({
      printerId: printer.id,
    });
    expectOkResponse(deleteResponse);

    const deleteResponse2 = await request.delete(addPrinterToFloorRoute(floor._id)).send({
      printerId: "63452115122876ea11cd1656",
    });
    expectNotFoundResponse(deleteResponse2);
  });
});
