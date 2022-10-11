const dbHandler = require("../db-handler");
const { AppConstants } = require("../../server.constants");
const { setupTestApp } = require("../test-server");
const { expectOkResponse, expectInternalServerError } = require("../extensions");
const PrinterGroup = require("../../models/PrinterGroup");
const { createTestPrinterGroup } = require("./test-data/create-printer-group");
const { createTestPrinterFloor, printerFloorRoute } = require("./test-data/create-printer-floor");

let Model = PrinterGroup;
const listRoute = `${AppConstants.apiRoute}/printer-floor`;
const getRoute = (id) => `${listRoute}/${id}`;
const getSelectedFloorRoute = `${listRoute}/selected-floor`;
const addPrinterGroupToFloorRoute = (id) => `${listRoute}/${id}/printer-group`;
const deleteRoute = (id) => `${listRoute}/${id}`;
const updateRoute = (id) => `${listRoute}/${id}`;
const updateNameRoute = (id) => `${getRoute(id)}/name`;
const updateFloorNumberRoute = (id) => `${getRoute(id)}/floor-number`;

let request;

beforeAll(async () => {
  await dbHandler.connect();
  ({ request } = await setupTestApp(true));
});

beforeEach(async () => {
  Model.deleteMany({});
});

describe("PrinterFloorController", () => {
  it("should return empty printer floor list", async () => {
    const response = await request.get(listRoute).send();
    expectOkResponse(response, []);
  });

  it("should not be able to create printer floor with same floor level number", async () => {
    const floorNumber = 234;
    const body = await createTestPrinterFloor(request, "Floor101", floorNumber);
    expect(body.name).toBe("Floor101");
    const createResponse = await request.post(printerFloorRoute).send({
      name: body.name,
      floor: floorNumber,
      printerGroups: [],
    });
    expectInternalServerError(createResponse);
  });

  it("should be able to create printer floor with different floor numbers", async () => {
    const body = await createTestPrinterFloor(request, "Floor101", 1234);
    expect(body.name).toBe("Floor101");
    const body2 = await createTestPrinterFloor(request, "Floor102", 1235);
    expect(body2.name).toBe("Floor102");
  });

  it("should be able to get printer floor", async () => {
    const floor = await createTestPrinterFloor(request, "Floor123", 506);
    const response = await request.get(getRoute(floor._id)).send();
    expectOkResponse(response, { name: "Floor123" });
  });

  it("should be able to get selected printer floor", async () => {
    const response = await request.get(getSelectedFloorRoute).send();
    expectOkResponse(response, { name: "default floor" });
  });

  it("should be able to update printer floor name", async () => {
    const floor = await createTestPrinterFloor(request, "Floor123", 507);
    const response = await request.patch(updateNameRoute(floor._id)).send({
      name: "newName",
    });
    expectOkResponse(response, { name: "newName" });
  });

  it("should be able to update printer floor number", async () => {
    const floor = await createTestPrinterFloor(request, "Floor123", 5070);
    const response = await request.patch(updateFloorNumberRoute(floor._id)).send({
      floor: 5071,
    });
    expectOkResponse(response, { name: "Floor123", floor: 5071 });
  });

  it("should be able to delete printer floor", async () => {
    const floor = await createTestPrinterFloor(request, "Floor123", 508);
    const response = await request.delete(deleteRoute(floor._id)).send();
    expectOkResponse(response);
  });

  it("should be able to add printer-group to floor", async () => {
    const printerGroup = await createTestPrinterGroup(request, "Floor123", 509);
    const floor = await createTestPrinterFloor(request);
    expect(floor).toMatchObject({ _id: expect.any(String) });

    const response = await request.post(addPrinterGroupToFloorRoute(floor._id)).send({
      printerGroupId: printerGroup._id,
    });
    expectOkResponse(response);
  });

  it("should be able to remove printer group from floor", async () => {
    const printerGroup = await createTestPrinterGroup(request);
    const floor = await createTestPrinterFloor(request, "Floor123", 510);
    expect(floor).toMatchObject({ _id: expect.any(String) });
    const response = await request.post(addPrinterGroupToFloorRoute(floor._id)).send({
      printerGroupId: printerGroup._id,
    });
    expectOkResponse(response);

    const deleteResponse = await request.delete(addPrinterGroupToFloorRoute(floor._id)).send({
      printerGroupId: printerGroup._id,
    });
    expectOkResponse(deleteResponse);
  });
});
