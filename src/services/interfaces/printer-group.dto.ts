import { IsNotEmpty } from "class-validator";

export class PrinterGroupDto {
  printerId: number;
  groupId: number;
}

export class CreateGroupDto {
  @IsNotEmpty()
  name: string;
}
