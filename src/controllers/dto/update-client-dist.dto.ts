import { IsBoolean, IsOptional, IsSemVer, IsString } from "class-validator";
import { AppConstants } from "@/server.constants";

export class UpdateClientDistDto {
  @IsOptional()
  @IsString()
  @IsSemVer()
  downloadRelease?: string = AppConstants.defaultClientMinimum;

  @IsOptional()
  @IsBoolean()
  allowDowngrade?: boolean = false;
}
