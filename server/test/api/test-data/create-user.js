const User = require("../../../models/Auth/User");
const bcrypt = require("bcryptjs");

function getUserData(username = "tester", password = "testpassword") {
  return {
    username,
    password,
  };
}

async function ensureTestUserCreated(usernameIn = "test", passwordIn = "test", needsPasswordChange = false) {
  const foundUser = await User.findOne({ username: usernameIn });
  if (foundUser)
    return {
      id: foundUser.id,
      username: foundUser.username,
    };

  const { username, password } = getUserData(usernameIn, passwordIn);
  const salt = await bcrypt.genSaltSync(10);
  const hash = await bcrypt.hash(password, salt);

  const user = await User.create({
    username,
    passwordHash: hash,
    needsPasswordChange,
  });

  return {
    id: user.id,
    username: user.username,
    needsPasswordChange: user.needsPasswordChange,
  };
}

module.exports = {
  ensureTestUserCreated,
  getUserData,
};
