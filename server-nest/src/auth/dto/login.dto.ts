import { IsDefined, IsString } from "class-validator";

export class LoginDto {
  @IsDefined()
  @IsString()
  username: string;

  @IsString()
  password: string;
}
