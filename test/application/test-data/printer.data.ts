import { OctoprintType } from "@/services/printer-api.interface";

const testApiKey = "fdmonsterfdmonsterfdmonsterfdmon";

export const testPrinterData = {
  printerURL: "http://url.com",
  printerType: OctoprintType,
  apiKey: testApiKey,
  enabled: false,
  name: "testPrinter 123",
};

export const validNewPrinterState = {
  apiKey: "asdasasdasdasdasdasdasdasdasdasd",
  printerURL: "https://asd.com:81",
  printerType: OctoprintType,
  name: "TestPrinter",
};

/**
 * Mock data
 */
export class PrinterMockData {
  static get PrinterMock() {
    return {
      name: "Printuh",
      printerURL: "http://test.com/",
      printerType: OctoprintType,
      apiKey: "asdasasdasdasdasdasdasdasdasdasd",
    };
  }
}
