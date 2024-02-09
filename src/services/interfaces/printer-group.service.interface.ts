import { IdType } from "@/shared.constants";
import { PrinterGroup } from "@/entities/printer-group.entity";
import { CreateGroupDto, PrinterGroupDto } from "@/services/interfaces/printer-group.dto";
import { GroupWithPrinters } from "@/services/orm/printer-group.service";

export interface IPrinterGroupService<KeyType = IdType, Entity = PrinterGroup> {
  toDto(document: Entity): PrinterGroupDto;

  listGroups(): Promise<GroupWithPrinters[]>;

  getGroupWithPrinters(printerId: KeyType): Promise<GroupWithPrinters>;

  createGroup(printerGroup: CreateGroupDto): Promise<GroupWithPrinters>;

  addPrinterToGroup(groupId: KeyType, printerId: KeyType): Promise<Entity>;

  removePrinterFromGroup(groupId: KeyType, printerId: KeyType): Promise<void>;

  deleteGroup(printerGroupId: KeyType): Promise<void>;
}
