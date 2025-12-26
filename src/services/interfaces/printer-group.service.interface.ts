import { PrinterGroup } from "@/entities/printer-group.entity";
import { CreateGroupDto, PrinterGroupDto } from "@/services/interfaces/printer-group.dto";
import { GroupWithPrintersDto } from "@/services/interfaces/group.dto";

export interface IPrinterGroupService<Entity = PrinterGroup> {
  toDto(document: Entity): PrinterGroupDto;

  listGroups(): Promise<GroupWithPrintersDto[]>;

  getGroupWithPrinters(groupId: number): Promise<GroupWithPrintersDto>;

  createGroup(group: CreateGroupDto): Promise<GroupWithPrintersDto>;

  updateGroupName(groupId: number, name: string): Promise<void>;

  deleteGroup(groupId: number): Promise<void>;

  addPrinterToGroup(groupId: number, printerId: number): Promise<Entity>;

  removePrinterFromGroup(groupId: number, printerId: number): Promise<void>;
}
