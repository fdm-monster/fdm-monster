import { setupTestApp } from "../test-server";
import {
  expectInternalServerError,
  expectInvalidResponse,
  expectNotFoundResponse,
  expectOkResponse,
} from "../extensions";
import { createTestPrinter } from "./test-data/create-printer";
import { createTestFloor, floorRoute } from "./test-data/create-floor";
import { Floor } from "@/entities";
import { AppConstants } from "@/server.constants";
import { Test } from "supertest";
import { FloorController } from "@/controllers/floor.controller";
import { getDatasource } from "../typeorm.manager";
import TestAgent from "supertest/lib/agent";

const listRoute = `${ AppConstants.apiRoute }/floor`;
const getRoute = (id: number) => `${ listRoute }/${ id }`;
const addPrinterToFloorRoute = (id: number) => `${ listRoute }/${ id }/printer`;
const deleteRoute = (id: number) => `${ listRoute }/${ id }`;
const updateNameRoute = (id: number) => `${ getRoute(id) }/name`;
const updateFloorNumberRoute = (id: number) => `${ getRoute(id) }/floor-number`;

let request: TestAgent<Test>;

beforeAll(async () => {
  ({request} = await setupTestApp(true));
});

beforeEach(async () => {
  return getDatasource().getRepository(Floor).clear();
});

describe(FloorController.name, () => {
  it("should return non-empty floor list", async () => {
    const response = await request.get(listRoute).send();
    const data = expectOkResponse(response);
    expect(data).toHaveLength(1);
    expect(data[0].name).toBe("Default Floor");

    const getResponse = await request.get(getRoute(data[0].id));
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
    const response = await request.get(getRoute(floor.id)).send();
    expectOkResponse(response, {name: "Floor123"});
  });

  it("should throw on getting non-existing floor", async () => {
    const response = await request.get(getRoute(12345)).send();
    expectNotFoundResponse(response);
  });

  it("should be able to update floor name", async () => {
    const floor = await createTestFloor(request, "Floor123", 507);
    const response = await request.patch(updateNameRoute(floor.id)).send({
      name: "newName",
    });
    expectOkResponse(response, {name: "newName"});
  });

  it("should be able to update floor number", async () => {
    const floor = await createTestFloor(request, "Floor123", 5070);
    const response = await request.patch(updateFloorNumberRoute(floor.id)).send({
      floor: 5071,
    });
    expectOkResponse(response, {name: "Floor123", floor: 5071});
  });

  it("should be able to delete floor", async () => {
    const floor = await createTestFloor(request, "Floor123", 508);
    const response = await request.delete(deleteRoute(floor.id)).send();
    expectOkResponse(response);
  });

  it("should not be able to add printer to non-existing floor", async () => {
    const printer = await createTestPrinter(request);

    const response = await request
      .post(addPrinterToFloorRoute(1234))
      .send({
        printerId: printer.id,
        x: 1,
        y: 1,
      });
    expectNotFoundResponse(response);
  });

  it("should be able to add printer to floor", async () => {
    const printer = await createTestPrinter(request);
    const floor = await createTestFloor(request, "Floor1234", 510);
    expect(floor).toMatchObject({id: expect.any(Number)});

    const response = await request.post(addPrinterToFloorRoute(floor.id)).send({
      printerId: printer.id,
      x: 1,
      y: 1,
    });
    expectOkResponse(response);

    // Sadly no distinctness criterium yet
    const response2 = await request.post(addPrinterToFloorRoute(floor.id)).send({
      printerId: printer.id,
      x: 1,
      y: 1,
    });
    expectOkResponse(response2);
  });

  it("should be able to remove printer from floor", async () => {
    const printer = await createTestPrinter(request);
    const floor = await createTestFloor(request, "Floor123", 510);
    expect(floor).toMatchObject({id: expect.any(Number)});

    const response = await request.post(addPrinterToFloorRoute(floor.id)).send({
      printerId: printer.id,
      x: 1,
      y: 1,
    });
    expectOkResponse(response);

    const deleteResponse = await request.delete(addPrinterToFloorRoute(floor.id)).send({
      printerId: printer.id,
    });
    expectOkResponse(deleteResponse);

    const deleteResponse2 = await request.delete(addPrinterToFloorRoute(floor.id)).send({
      printerId: 1234,
    });
    expectNotFoundResponse(deleteResponse2);
  });
});
