import { AppConstants } from "@/server.constants";
import { expectOkResponse } from "../../extensions";
import { Test } from "supertest";
import { TagWithPrintersDto } from "@/services/interfaces/tag.dto";
import TestAgent from "supertest/lib/agent";

export const tagRoute = AppConstants.apiRoute + "/printer-tag";

export async function createTestTag(request: TestAgent<Test>, name = "TestTag", color = "#FFFFFF") {
  const createResponse = await request.post(tagRoute).send({
    name,
    color,
  });
  return expectOkResponse(createResponse, {
    name,
    color,
    printers: expect.any(Array),
  }) as TagWithPrintersDto;
}
