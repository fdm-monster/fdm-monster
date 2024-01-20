import { AppConstants } from "@/server.constants";
import { expectOkResponse } from "../../extensions";
import supertest from "supertest";
import { PrinterDto, PrinterUnsafeDto } from "@/services/interfaces/printer.dto";
import { SqliteIdType } from "@/shared.constants";

const printerRoute = AppConstants.apiRoute + "/printer";
export const testApiKey = "fdmonsterfdmonsterfdmonsterfdmon";

export async function createTestPrinter(
  request: supertest.SuperTest<supertest.Test>,
  enabled = false
): Promise<PrinterUnsafeDto<SqliteIdType>> {
  const createResponse = await request.post(printerRoute).send({
    printerURL: "http://url.com",
    apiKey: testApiKey,
    enabled,
    name: "testPrinter 123",
  });
  return expectOkResponse(createResponse, { enabled, id: expect.anything() });
}
