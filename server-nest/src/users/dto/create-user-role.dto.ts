import { IsEnum, IsNotEmpty, IsString, MinLength } from "class-validator";
import { Role, UserConstants } from "../user.constants";
import { UserUsernameIsNew } from "@/users/validators/username-validator.rule";

export class CreateUserRoleDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(UserConstants.minUsernameLength)
  @UserUsernameIsNew()
  userId: number;

  @IsNotEmpty()
  @IsString()
  @IsEnum(Role)
  role: Role;
}
