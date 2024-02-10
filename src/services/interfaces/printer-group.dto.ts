import { IsNotEmpty } from "class-validator";

export class PrinterGroupDto<KeyType = number> {
  printerId: KeyType;
  groupId: KeyType;
}

export class CreateGroupDto {
  @IsNotEmpty()
  name: string;
}
