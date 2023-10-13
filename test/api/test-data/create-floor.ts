import { AppConstants } from "@/server.constants";
import { expectOkResponse } from "../../extensions";
import supertest from "supertest";

export const floorRoute = AppConstants.apiRoute + "/floor";

export async function createTestFloor(request: supertest.SuperTest<supertest.Test>, name = "Floor101", floorNumber = 1) {
  const createResponse = await request.post(floorRoute).send({
    name,
    floor: floorNumber,
    printers: [],
  });
  return expectOkResponse(createResponse, {
    name,
    printers: expect.any(Array),
  });
}
