import { Role, User } from "@/entities";
import { ROLES } from "@/constants/authorization.constants";
import { hashPassword } from "@/utils/crypto.utils";
import { UserDto } from "@/services/interfaces/user.dto";
import { SqliteIdType } from "@/shared.constants";
import { getDatasource } from "../../typeorm.manager";
import { UserRole } from "@/entities/user-role.entity";

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
  isRootUser = true,
): Promise<UserDto> {

  const roleRepo = getDatasource().getRepository(Role);
  const userRepo = getDatasource().getRepository(User);
  const userRoleRepo = getDatasource().getRepository(UserRole);

  const roleId = (await roleRepo.findOneBy({ name: role }))?.id;
  const roles = roleId ? [roleId] : [];

  const foundUser = await userRepo.findOneBy({ username: usernameIn });
  const { username, password } = getUserData(usernameIn, passwordIn);
  const hash = hashPassword(password);

  if (foundUser) {
    await userRepo.update(foundUser.id, { passwordHash: hash, needsPasswordChange, isVerified, isRootUser });
    await userRoleRepo.upsert(
      roles.map((r) => ({
        userId: foundUser.id,
        roleId: r,
      })),
      {
        skipUpdateIfNoValuesChanged: true,
        conflictPaths: ["userId", "roleId"],
      },
    );
    return {
      id: foundUser.id,
      isVerified,
      isRootUser,
      isDemoUser: foundUser.isDemoUser,
      username: foundUser.username,
      needsPasswordChange: foundUser.needsPasswordChange,
      roles: foundUser.roles?.map((r) => r.roleId),
    } as UserDto<SqliteIdType>;
  }

  const userr = userRepo.create({
    username,
    passwordHash: hash,
    isDemoUser: false,
    isRootUser,
    isVerified,
    needsPasswordChange,
  });

  await userRepo.insert(userr);
  await userRoleRepo.upsert(
    roles.map((r) => ({
      userId: userr.id,
      roleId: r,
    })),
    {
      skipUpdateIfNoValuesChanged: true,
      conflictPaths: ["userId", "roleId"],
    },
  );
  const user = await userRepo.findOneBy({ id: userr.id });
  if (!user) {
    throw new Error("Could not find user with id " + userr.id);
  }

  return {
    id: user.id,
    username: user.username,
    isDemoUser: false,
    isRootUser,
    isVerified,
    needsPasswordChange: user.needsPasswordChange,
    roles: user.roles?.map((r) => r.roleId),
  } as UserDto<SqliteIdType>;
}
