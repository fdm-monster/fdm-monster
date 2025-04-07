import { AppConstants } from "@/server.constants";
import { expectOkResponse } from "../../extensions";
import { Test } from "supertest";
import { SqliteIdType } from "@/shared.constants";
import { OctoprintType } from "@/services/printer-api.interface";
import TestAgent from "supertest/lib/agent";
import { PrinterDto } from "@/services/interfaces/printer.dto";

const printerRoute = AppConstants.apiRoute + "/printer";
export const testApiKey = "fdmonsterfdmonsterfdmonsterfdmon";

export async function createTestPrinter(
  request: TestAgent<Test>,
  enabled = false,
): Promise<PrinterDto<SqliteIdType>> {
  const createResponse = await request.post(printerRoute).query("forceSave=true").send({
    printerURL: "http://url.com",
    printerType: OctoprintType,
    apiKey: testApiKey,
    enabled,
    name: "testPrinter 123",
  });
  return expectOkResponse(createResponse, { enabled, id: expect.anything() });
}
