const OctoprintRxjsWebsocketAdapter = require("../../../services/octoprint/octoprint-rxjs-websocket.adapter");

describe("OctoPrint-rjxs-websocket-adapter", () => {
  it("should construct without problems", () => {
    const adapter = new OctoprintRxjsWebsocketAdapter({
      id: "asd",
      webSocketURL: "wss://demo.piesocket.com/",
      currentUser: "asd",
      sessionKey: "asd",
      throttle: 1
    });
    adapter.sendThrottleMessage();

    expect(adapter.getOctoPrintMeta()).toBeTruthy();
    expect(adapter.getPrinterJob()).toBeTruthy();
    expect(adapter.getWebSocketState()).toBeTruthy();
    expect(adapter.getPrinterState()).toBeTruthy();
    expect(adapter.resetPrinterState()).toBeFalsy();
    expect(adapter.getCurrentStateData()).toBeTruthy();

    // Should have pipe
    expect(adapter.getMessages$()).toBeTruthy();
    adapter.close();
  });
});
