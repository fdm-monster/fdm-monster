import { Role, User } from "@/entities";
import { RoleName, ROLES } from "@/constants/authorization.constants";
import { hashPassword } from "@/utils/crypto.utils";
import { UserDto } from "@/services/interfaces/user.dto";
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
  roleName: RoleName = ROLES.ADMIN,
  isVerified = true,
  isRootUser = true,
): Promise<UserDto> {

  const roleRepo = getDatasource().getRepository(Role);
  const userRepo = getDatasource().getRepository(User);
  const userRoleRepo = getDatasource().getRepository(UserRole);

  const roleId = (await roleRepo.findOneBy({name: roleName}))?.id;
  const roleIds = roleId ? [roleId] : [];

  const foundUser = await userRepo.findOneBy({username: usernameIn});
  const {username, password} = getUserData(usernameIn, passwordIn);
  const hash = hashPassword(password);

  if (foundUser) {
    await userRepo.update(foundUser.id, {passwordHash: hash, needsPasswordChange, isVerified, isRootUser});
    await userRoleRepo.upsert(
      roleIds.map((r) => ({
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
      roles: [roleName],
      createdAt: foundUser.createdAt,
    } satisfies UserDto;
  }

  const createdUser = userRepo.create({
    username,
    passwordHash: hash,
    isDemoUser: false,
    isRootUser,
    isVerified,
    needsPasswordChange,
  });

  await userRepo.insert(createdUser);
  await userRoleRepo.upsert(
    roleIds.map((r) => ({
      userId: createdUser.id,
      roleId: r,
    })),
    {
      skipUpdateIfNoValuesChanged: true,
      conflictPaths: ["userId", "roleId"],
    },
  );

  const finalFoundUser = await userRepo.findOneBy({id: createdUser.id});
  if (!finalFoundUser) {
    throw new Error("Could not find user with id " + createdUser.id);
  }
  return {
    id: finalFoundUser.id,
    username: finalFoundUser.username,
    isDemoUser: false,
    isRootUser,
    isVerified,
    needsPasswordChange: finalFoundUser.needsPasswordChange,
    roles: [roleName],
    createdAt: finalFoundUser.createdAt,
  } satisfies UserDto;
}
