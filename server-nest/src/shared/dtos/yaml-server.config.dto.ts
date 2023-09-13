import { IsDefined } from "class-validator";

export class YamlServerConfigDto {
  @IsDefined()
  requireLogin: boolean = true;
}
