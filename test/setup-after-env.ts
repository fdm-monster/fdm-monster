import nock from "nock";
import { createStaticLogger } from "@/handlers/logging/static.logger";
const jestConsole = console;

beforeAll(async () => {
  nock.disableNetConnect();
  // nock.enableNetConnect("127.0.0.1");
  nock.enableNetConnect((host) => {
    if (
      host.startsWith("127.0.0.1") ||
      host.startsWith("localhost") ||
      host.startsWith("0.0.0.0") ||
      host.startsWith("::1")
    ) {
      return true;
    } else {
      console.error("Illegal Network access: " + host);
      return false;
    }
  });

  // Debug mode to see which requests are being intercepted
  // nock.emitter.on("no match", (req) => {
  //   console.log("No match for request:", {
  //     method: req.method,
  //     host: req.host,
  //     path: req.path,
  //     headers: req.headers,
  //   });
  // });

  createStaticLogger({ enableFileLogs: false });
});

// https://github.com/jestjs/jest/issues/10322
beforeEach(() => {
  global.console = require("console");
});

afterEach(() => {
  global.console = jestConsole;
});

afterAll(async () => {
  nock.enableNetConnect();
  nock.cleanAll();
});
