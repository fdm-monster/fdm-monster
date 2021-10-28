const User = require("../../../server/models/Auth/User");
const bcrypt = require("bcryptjs");

async function createTestUser(password = "testpassword") {
  const salt = await bcrypt.genSaltSync(10);
  const hash = await bcrypt.hash(password, salt);

  return await User.create({
    name: "Tester",
    username: "tester",
    password: hash
  });
}

module.exports = {
  createTestUser
};
