const dbHandler = require("../db-handler");
const { AppConstants } = require("../../server.constants");
const { setupTestApp } = require("../test-server");
const { expectOkResponse } = require("../extensions");
const PrinterGroup = require("../../models/PrinterGroup");
const { createTestPrinterGroup } = require("./test-data/create-printer-group");
const { createTestPrinterFloor } = require("./test-data/create-printer-floor");

let Model = PrinterGroup;
const listRoute = `${AppConstants.apiRoute}/printer-floor`;
const getRoute = (id) => `${listRoute}/${id}`;
const addPrinterGroupToFloorRoute = (id) => `${listRoute}/${id}/printer-group`;
const deleteRoute = (id) => `${listRoute}/${id}`;
const updateRoute = (id) => `${listRoute}/${id}`;
const updateNameRoute = (id) => `${getRoute(id)}/name`;

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

  it("should be able to create printer floor", async () => {
    const body = await createTestPrinterFloor(request, "Floor101");
    expect(body.name).toBe("Floor101");
    const body2 = await createTestPrinterFloor(request, "Floor102");
    expect(body2.name).toBe("Floor102");
  });

  it("should be able to get printer floor", async () => {
    const floor = await createTestPrinterFloor(request);
    const response = await request.get(getRoute(floor._id)).send();
    expectOkResponse(response, { name: "Floor101" });
  });

  it("should be able to update printer floor name", async () => {
    const floor = await createTestPrinterFloor(request);
    const response = await request.patch(updateNameRoute(floor._id)).send({
      name: "newName"
    });
    expectOkResponse(response, { name: "newName" });
  });

  it("should be able to delete printer floor", async () => {
    const floor = await createTestPrinterFloor(request);
    const response = await request.delete(deleteRoute(floor._id)).send();
    expectOkResponse(response);
  });

  it("should be able to add printer-group to floor", async () => {
    const printerGroup = await createTestPrinterGroup(request);
    const floor = await createTestPrinterFloor(request);
    expect(floor).toMatchObject({ _id: expect.any(String) });

    const response = await request.post(addPrinterGroupToFloorRoute(floor._id)).send({
      printerGroupId: printerGroup._id
    });
    expectOkResponse(response);
  });

  it("should be able to remove printer group from floor", async () => {
    const printerGroup = await createTestPrinterGroup(request);
    const floor = await createTestPrinterFloor(request);
    expect(floor).toMatchObject({ _id: expect.any(String) });
    const response = await request.post(addPrinterGroupToFloorRoute(floor._id)).send({
      printerGroupId: printerGroup._id
    });
    expectOkResponse(response);

    const deleteResponse = await request.delete(addPrinterGroupToFloorRoute(floor._id)).send({
      printerGroupId: printerGroup._id
    });
    expectOkResponse(deleteResponse);
  });
});
