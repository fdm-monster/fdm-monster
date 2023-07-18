const { ensureTestUserCreated } = require("../test-data/create-user");
const { AppConstants } = require("../../../server.constants");

const baseRoute = AppConstants.apiRoute + "/auth";
const loginRoute = `${baseRoute}/login`;

async function loginTestUser(request, usernameIn = "default", password = "testFDMMonster") {
  const { username } = await ensureTestUserCreated(usernameIn, password);
  const response = await request.post(loginRoute).send({ username, password });

  return response.body;
}

module.exports = {
  loginTestUser,
};
