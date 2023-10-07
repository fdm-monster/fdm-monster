import { connect, closeDatabase } from "../db-handler";
import { hashPassword } from "@/utils/crypto.utils";
import { User } from "@/models";

/**
 * Connect to a new in-memory database before running any tests.
 */
beforeAll(async () => {
  await connect();
});

/**
 * Remove and close the db and server.
 */
afterAll(async () => {
  await closeDatabase();
});

describe("User:Schema", function () {
  it("should not tolerate duplicate usernames", async () => {
    const newUser = new User({
      name: "testname",
      username: "SAMENAME",
      passwordHash: "pwpwpwpw123",
      group: "User",
    });
    const newUser2 = new User({
      name: "testname2",
      username: "SAMENAME",
      passwordHash: "pwpwpwpw123",
      group: "User",
    });

    // Hash Password
    const hash = hashPassword(newUser.passwordHash);
    expect(hash).not.toBeUndefined();

    // Set password to hashed
    newUser.passwordHash = hash;
    newUser2.passwordHash = hash;
    // Save new User
    await newUser.save();
    let wasThrown = false;

    await User.syncIndexes();

    try {
      await newUser2.save();
    } catch (e) {
      wasThrown = true;
    }
    expect(wasThrown).toBe(true);

    const users = await User.find({ username: "SAMENAME" });
    expect(users).toHaveLength(1);
  });
});
