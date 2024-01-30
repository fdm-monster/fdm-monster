import { getExpectExtensions } from "./extensions";
import { isSqliteModeTest } from "./typeorm.manager";
import { closeDatabase } from "./mongo-memory.handler";

expect.extend(getExpectExtensions());

afterAll(async () => {
  if (!isSqliteModeTest()) {
    await closeDatabase();
  }
});
