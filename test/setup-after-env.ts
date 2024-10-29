import { getExpectExtensions } from "./extensions";
import { isSqliteModeTest } from "./typeorm.manager";
import { closeDatabase, connect } from "./mongo-memory.handler";
const jestConsole = console;
expect.extend(getExpectExtensions());

// https://github.com/jestjs/jest/issues/10322
beforeEach(() => {
  global.console = require("console");
  process.env["NODE_NO_WARNINGS"] = "1";
});

afterEach(() => {
  global.console = jestConsole;
});

beforeAll(async () => {
  if (!isSqliteModeTest()) {
    await connect();
  }
});

afterAll(async () => {
  if (!isSqliteModeTest()) {
    await closeDatabase();
  }
});
