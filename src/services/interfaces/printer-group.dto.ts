export class PrinterGroupDto<KeyType = number> {
  printerId: KeyType;
  groupId: KeyType;
}

export class CreateGroupDto {
  name: string;
}
