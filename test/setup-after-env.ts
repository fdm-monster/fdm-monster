import { getExpectExtensions } from "./extensions";
import { isSqliteModeTest } from "./typeorm.manager";
import { closeDatabase, connect } from "./mongo-memory.handler";

expect.extend(getExpectExtensions());

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
