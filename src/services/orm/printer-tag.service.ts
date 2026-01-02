import { BaseService } from "@/services/orm/base.service";
import { PrinterTag } from "@/entities/printer-tag.entity";
import { CreateTagDto, PrinterTagDto } from "@/services/interfaces/printer-tag.dto";
import { IPrinterTagService } from "@/services/interfaces/printer-tag.service.interface";
import { Repository } from "typeorm";
import { Tag } from "@/entities/tag.entity";
import { TypeormService } from "@/services/typeorm/typeorm.service";
import { validate } from "class-validator";
import { NotFoundException } from "@/exceptions/runtime.exceptions";
import { TagWithPrintersDto } from "@/services/interfaces/tag.dto";

export class PrinterTagService extends BaseService(PrinterTag, PrinterTagDto) implements IPrinterTagService {
  private readonly tagRepository: Repository<Tag>;

  constructor(typeormService: TypeormService) {
    super(typeormService);

    this.tagRepository = typeormService.getDataSource().getRepository(Tag);
  }

  async listTags(): Promise<TagWithPrintersDto[]> {
    const tags = await this.tagRepository.find();
    const tagRecords: Record<number, TagWithPrintersDto> = {};
    for (const tag of tags) {
      tagRecords[tag.id] = {
        id: tag.id,
        name: tag.name,
        printers: [] as PrinterTagDto[],
      };
    }

    for (const group of tags) {
      tagRecords[group.id].printers = await this.repository.findBy({ tagId: group.id });
    }

    return Object.values(tagRecords);
  }

  async getTag(tagId: number) {
    const group = await this.tagRepository.findOneBy({ id: tagId });
    if (!group) {
      throw new NotFoundException("Group does not exist");
    }
    return group;
  }

  async getPrintersByTag(tagId: number): Promise<TagWithPrintersDto> {
    const group = await this.getTag(tagId);
    const printerTags = await this.repository.findBy({ tagId: group.id });
    return {
      id: group.id,
      name: group.name,
      printers: printerTags,
    };
  }

  async createTag(dto: CreateTagDto): Promise<TagWithPrintersDto> {
    await validate(dto);
    const entity = this.tagRepository.create(dto);
    await validate(entity);
    const group = await this.tagRepository.save(entity);

    return await this.getPrintersByTag(group.id);
  }

  async updateTagName(tagId: number, name: string): Promise<void> {
    const entity = await this.getTag(tagId);
    const updateDto = { name };
    await validate(updateDto);
    await validate(Object.assign(entity, updateDto));
    await this.tagRepository.update(entity.id, updateDto);
  }

  async deleteTag(tagId: number): Promise<void> {
    const group = await this.getTag(tagId);
    await this.tagRepository.delete({ id: group.id });
  }

  async addPrinterToTag(tagId: number, printerId: number): Promise<PrinterTag> {
    const group = await this.getTag(tagId);
    const alreadyExisting = await this.repository.findOneBy({
      tagId: group.id,
      printerId,
    });
    if (alreadyExisting) return alreadyExisting;

    return await this.create({
      tagId: group.id,
      printerId,
    });
  }

  async removePrinterFromTag(tagId: number, printerId: number): Promise<void> {
    await this.getTag(tagId);
    await this.repository.delete({ tagId, printerId });
  }

  toDto(entity: PrinterTag): PrinterTagDto {
    return {
      printerId: entity.printerId,
      tagId: entity.tagId,
    };
  }
}
