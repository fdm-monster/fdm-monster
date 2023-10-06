import { Role, User } from "@/models";
import { ROLES } from "@/constants/authorization.constants";
import { hashPassword } from "@/utils/crypto.utils";

export function getUserData(username = "tester", password = "testpassword") {
  return {
    username,
    password,
  };
}

export async function ensureTestUserCreated(
  usernameIn = "test",
  passwordIn = "test",
  needsPasswordChange = false,
  isVerified = true,
  role = ROLES.ADMIN
) {
  const roleId = (await Role.findOne({ name: role }))?._id;
  const roles = roleId ? [roleId.toString()] : [];

  const foundUser = await User.findOne({ username: usernameIn });
  const { username, password } = getUserData(usernameIn, passwordIn);
  const hash = await hashPassword(password);

  if (foundUser) {
    await User.updateOne({ _id: foundUser.id }, { passwordHash: hash, needsPasswordChange, roles, isVerified });
    return {
      id: foundUser.id,
      isVerified,
      username: foundUser.username,
      needsPasswordChange: foundUser.needsPasswordChange,
      roles: foundUser.roles,
      isRootUser: role === ROLES.ADMIN,
    };
  }

  const user = await User.create({
    username,
    passwordHash: hash,
    roles,
    isRootUser: role === ROLES.ADMIN,
    isVerified,
    needsPasswordChange,
  });

  return {
    id: user.id,
    username: user.username,
    needsPasswordChange: user.needsPasswordChange,
    roles: user.roles,
    isVerified,
    isRootUser: role === ROLES.ADMIN,
  };
}
