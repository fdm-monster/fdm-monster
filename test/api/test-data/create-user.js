const User = require("../../../server/models/Auth/User");
const bcrypt = require("bcryptjs");

function getUserData(password = "testpassword") {
  return {
    name: "Tester",
    username: "tester",
    password
  };
}

async function createTestUser(passwordIn) {
  const { name, username, password } = getUserData(passwordIn);
  const salt = await bcrypt.genSaltSync(10);
  const hash = await bcrypt.hash(password, salt);

  const user = await User.create({
    name,
    username,
    passwordHash: hash
  });

  return {
    username: user.username,
    name: user.name
  };
}

module.exports = {
  createTestUser,
  getUserData
};
