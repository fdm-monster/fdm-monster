import { IsNotEmpty, IsString, MinLength } from "class-validator";
import { UserConstants } from "../user.constants";
import { UserUsernameIsNew } from "@/users/validators/username-validator.rule";

export class CreateUserDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(UserConstants.minUsernameLength)
  @UserUsernameIsNew()
  username: string;
}
