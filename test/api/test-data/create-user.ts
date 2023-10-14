import { Role, User } from "@/models";
import { ROLES } from "@/constants/authorization.constants";
import { hashPassword } from "@/utils/crypto.utils";
import { UserDto } from "@/services/interfaces/user.dto";
import { MongoIdType } from "@/shared.constants";
import { getDatasource } from "../../typeorm.manager";

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
  isVerified = true
) {
  const roleRepo = getDatasource().getRepository(Role);
  const userRepo = getDatasource().getRepository(User);

  const roleId = (await roleRepo.findOneBy({ name: role }))?.id;
  const roles = roleId ? [roleId.toString()] : [];

  const foundUser = await userRepo.findOneBy({ username: usernameIn });
  const { username, password } = getUserData(usernameIn, passwordIn);
  const hash = hashPassword(password);

  if (foundUser) {
    await userRepo.update({ id: foundUser.id }, { passwordHash: hash, needsPasswordChange, roles, isVerified });
    return {
      id: foundUser.id,
      isVerified,
      isRootUser: role === ROLES.ADMIN,
      isDemoUser: foundUser.isDemoUser,
      username: foundUser.username,
      needsPasswordChange: foundUser.needsPasswordChange,
      roles: foundUser.roles,
    } as UserDto<MongoIdType>;
  }

  const userr = await userRepo.create({
    username,
    passwordHash: hash,
    roles,
    isDemoUser: false,
    isRootUser: role === ROLES.ADMIN,
    isVerified,
    needsPasswordChange,
  });

  await userRepo.insert(userr);

  const user = userRepo.find(userr);
  return {
    id: user.id,
    username: user.username,
    isDemoUser: false,
    isRootUser: role === ROLES.ADMIN,
    isVerified,
    needsPasswordChange: user.needsPasswordChange,
    roles: user.roles,
  } as UserDto<MongoIdType>;
}
