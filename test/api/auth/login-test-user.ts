import { ensureTestUserCreated } from "../test-data/create-user";
import { AppConstants } from "@/server.constants";
import { ROLES } from "@/constants/authorization.constants";
import supertest from "supertest";

const baseRoute = AppConstants.apiRoute + "/auth";
const loginRoute = `${baseRoute}/login`;

export async function loginTestUser(
  request: supertest.SuperTest<supertest.Test>,
  usernameIn = "default",
  password = "testFDMMonster",
  role = ROLES.ADMIN
) {
  const { username } = await ensureTestUserCreated(usernameIn, password, false, role);
  const response = await request.post(loginRoute).send({ username, password });

  return response.body;
}
