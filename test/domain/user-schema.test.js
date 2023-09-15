const dbHandler = require("../db-handler");
const User = require("../../models/Auth/User");
const bcrypt = require("bcryptjs");

/**
 * Connect to a new in-memory database before running any tests.
 */
beforeAll(async () => {
  await dbHandler.connect();
});

/**
 * Remove and close the db and server.
 */
afterAll(async () => {
  await dbHandler.closeDatabase();
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
    const salt = bcrypt.genSaltSync(10);
    expect(salt).not.toBeUndefined();
    const hash = bcrypt.hashSync(newUser.passwordHash, salt);
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
