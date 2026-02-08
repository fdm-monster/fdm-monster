import { PrinterTag } from "@/entities/printer-tag.entity";
import type { TagWithPrintersDto } from "@/services/interfaces/tag.dto";
import type { CreateTagDto, PrinterTagDto } from "@/services/interfaces/printer-tag.dto";

export interface IPrinterTagService<Entity = PrinterTag> {
  toDto(document: Entity): PrinterTagDto;

  listTags(): Promise<TagWithPrintersDto[]>;

  getPrintersByTag(tagId: number): Promise<TagWithPrintersDto>;

  createTag(tag: CreateTagDto): Promise<TagWithPrintersDto>;

  updateTagName(tagId: number, name: string): Promise<void>;

  updateTagColor(tagId: number, color: string): Promise<void>;

  deleteTag(tagId: number): Promise<void>;

  addPrinterToTag(tagId: number, printerId: number): Promise<Entity>;

  removePrinterFromTag(tagId: number, printerId: number): Promise<void>;
}
