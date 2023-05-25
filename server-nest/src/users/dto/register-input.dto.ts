import { IsNotEmpty, IsString, MinLength } from "class-validator";
import { UserConstants } from "../user.constants";

export class RegisterInputDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(UserConstants.minUsernameLength)
  username: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(UserConstants.minPasswordLength)
  password: string;
}
