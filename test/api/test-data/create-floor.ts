import { AppConstants } from "@/server.constants";
import { expectOkResponse } from "../../extensions";
import { Test } from "supertest";
import { FloorDto } from "@/services/interfaces/floor.dto";
import TestAgent from "supertest/lib/agent";

export const floorRoute = AppConstants.apiRoute + "/floor";

export async function createTestFloor(request: TestAgent<Test>, name = "Floor101", order = 1) {
  const createResponse = await request.post(floorRoute).send({
    name,
    order,
    printers: [],
  });
  return expectOkResponse(createResponse, {
    name,
    printers: expect.any(Array),
  }) as FloorDto;
}
