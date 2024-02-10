import { IdType } from "@/shared.constants";
import { PrinterGroup } from "@/entities/printer-group.entity";
import { CreateGroupDto, PrinterGroupDto } from "@/services/interfaces/printer-group.dto";
import { GroupWithPrintersDto } from "@/services/interfaces/group.dto";

export interface IPrinterGroupService<KeyType extends string | number = IdType, Entity = PrinterGroup> {
  toDto(document: Entity): PrinterGroupDto;

  listGroups(): Promise<GroupWithPrintersDto<KeyType>[]>;

  getGroupWithPrinters(printerId: KeyType): Promise<GroupWithPrintersDto<KeyType>>;

  createGroup(printerGroup: CreateGroupDto): Promise<GroupWithPrintersDto<KeyType>>;

  addPrinterToGroup(groupId: KeyType, printerId: KeyType): Promise<Entity>;

  removePrinterFromGroup(groupId: KeyType, printerId: KeyType): Promise<void>;

  deleteGroup(printerGroupId: KeyType): Promise<void>;
}
