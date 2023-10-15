import { Role, User } from "@/models";
import { ROLES } from "@/constants/authorization.constants";
import { hashPassword } from "@/utils/crypto.utils";
import { UserDto } from "@/services/interfaces/user.dto";
import { MongoIdType } from "@/shared.constants";

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
  role = ROLES.ADMIN,
  isVerified = true,
  isRootUser = true
) {
  const roleId = (await Role.findOne({ name: role }))?.id;
  const roles = roleId ? [roleId.toString()] : [];

  const foundUser = await User.findOne({ username: usernameIn });
  const { username, password } = getUserData(usernameIn, passwordIn);
  const hash = hashPassword(password);

  if (foundUser) {
    await User.updateOne({ _id: foundUser.id }, { passwordHash: hash, needsPasswordChange, roles, isVerified, isRootUser });
    return {
      id: foundUser.id,
      isVerified,
      isRootUser,
      isDemoUser: foundUser.isDemoUser,
      username: foundUser.username,
      needsPasswordChange: foundUser.needsPasswordChange,
      roles: foundUser.roles,
    } as UserDto<MongoIdType>;
  }

  const user = await User.create({
    username,
    passwordHash: hash,
    roles,
    isDemoUser: false,
    isRootUser,
    isVerified,
    needsPasswordChange,
  });

  return {
    id: user.id,
    username: user.username,
    isDemoUser: false,
    isRootUser,
    isVerified,
    needsPasswordChange: user.needsPasswordChange,
    roles: user.roles,
  } as UserDto<MongoIdType>;
}
