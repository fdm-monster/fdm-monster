const groupName = "Row0_0";
const testApiKey = "fdmonsterfdmonsterfdmonsterfdmon";

const testPrinterData = {
  printerURL: "http://url.com",
  webSocketURL: "ws://url.com",
  apiKey: testApiKey,
  enabled: false,
  group: groupName,
  settingsAppearance: {
    name: "testPrinter 123"
  }
};

const validNewPrinterState = {
  apiKey: "asdasasdasdasdasdasdasdasdasdasd",
  webSocketURL: "ws://asd.com/",
  printerURL: "https://asd.com:81",
  camURL: "http://asd.com:81"
};

module.exports = {
  testPrinterData,
  validNewPrinterState
};
