const testApiKey = "fdmonsterfdmonsterfdmonsterfdmon";

export const testPrinterData = {
  printerURL: "http://url.com",
  printerType: 0,
  webSocketURL: "ws://url.com",
  apiKey: testApiKey,
  enabled: false,
  name: "testPrinter 123",
};

export const validNewPrinterState = {
  apiKey: "asdasasdasdasdasdasdasdasdasdasd",
  webSocketURL: "ws://asd.com/",
  printerURL: "https://asd.com:81",
  printerType: 0,
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
      printerType: 1,
      webSocketURL: "ws://test/",
      apiKey: "asdasasdasdasdasdasdasdasdasdasd",
    };
  }
}
