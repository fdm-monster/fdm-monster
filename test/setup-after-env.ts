import { getExpectExtensions } from "./extensions";
import { isSqliteModeTest } from "./typeorm.manager";
import { closeDatabase, connect } from "./mongo-memory.handler";
import nock from "nock";
const jestConsole = console;
expect.extend(getExpectExtensions());

// https://github.com/jestjs/jest/issues/10322
beforeEach(() => {
  global.console = require("console");
});

afterEach(() => {
  global.console = jestConsole;
});

beforeAll(async () => {
  nock.disableNetConnect();
  nock.enableNetConnect("127.0.0.1");
  nock.enableNetConnect((host) => {
    if (host.startsWith("127.0.0.1") || host.startsWith("localhost") || host.startsWith("0.0.0.0") || host.startsWith("::1")) {
      return true;
    } else {
      console.error("Illegal Network access: " + host);
      return false;
    }
  });
  if (!isSqliteModeTest()) {
    await connect();
  }
});

afterAll(async () => {
  nock.enableNetConnect();
  nock.cleanAll();
  if (!isSqliteModeTest()) {
    await closeDatabase();
  }
});
