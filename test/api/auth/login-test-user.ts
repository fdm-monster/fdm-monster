const { ensureTestUserCreated } = require("../test-data/create-user");
const { AppConstants } = require("@/server.constants");
const { ROLES } = require("@/constants/authorization.constants");

const baseRoute = AppConstants.apiRoute + "/auth";
const loginRoute = `${baseRoute}/login`;

export async function loginTestUser(request, usernameIn = "default", password = "testFDMMonster", role = ROLES.ADMIN) {
  const { username } = await ensureTestUserCreated(usernameIn, password, false, role);
  const response = await request.post(loginRoute).send({ username, password });

  return response.body;
}
