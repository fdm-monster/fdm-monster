import { AppConstants } from "@/server.constants";
import { expectOkResponse } from "../../extensions";

const printerRoute = AppConstants.apiRoute + "/printer";
export const testApiKey = "fdmonsterfdmonsterfdmonsterfdmon";

export async function createTestPrinter(request, enabled = false) {
  const createResponse = await request.post(printerRoute).send({
    printerURL: "http://url.com",
    apiKey: testApiKey,
    enabled,
    settingsAppearance: {
      name: "testPrinter 123",
    },
  });
  return expectOkResponse(createResponse, { enabled });
}
