import { CustomGcode } from "@/entities";
import { ICustomGcodeService } from "@/services/interfaces/custom-gcode.service.interface";
import { CustomGcodeDto } from "@/services/interfaces/custom-gcode.dto";
import { BaseService } from "@/services/orm/base.service";

export class CustomGcodeService
  extends BaseService(CustomGcode, CustomGcodeDto, CustomGcodeDto)
  implements ICustomGcodeService
{
  toDto(entity: CustomGcode): CustomGcodeDto {
    return {
      id: entity.id,
      name: entity.name,
      description: entity.description,
      gcode: [...entity.gcode],
    };
  }

  async create(gcodeScript: CustomGcodeDto): Promise<CustomGcode> {
    return await super.create(gcodeScript);
  }

  async delete(gcodeScriptId: number) {
    await super.delete(gcodeScriptId);
  }

  async get(gcodeScriptId: number): Promise<CustomGcode> {
    return await super.get(gcodeScriptId);
  }

  async list(): Promise<CustomGcode[]> {
    return await super.list();
  }

  async update(gcodeScriptId: number, updatedData: CustomGcodeDto): Promise<CustomGcode> {
    return await super.update(gcodeScriptId, updatedData);
  }
}
