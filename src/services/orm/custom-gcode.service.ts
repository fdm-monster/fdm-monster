import { SqliteIdType } from "@/shared.constants";
import { CustomGcode } from "@/entities";
import { ICustomGcodeService } from "@/services/interfaces/custom-gcode.service.interface";
import { CustomGcodeDto } from "@/services/interfaces/custom-gcode.dto";
import { BaseService } from "@/services/orm/base.service";

export class CustomGcodeService
  extends BaseService(CustomGcode, CustomGcodeDto)
  implements ICustomGcodeService<SqliteIdType, CustomGcode>
{
  toDto(entity: CustomGcode): CustomGcodeDto {
    return {
      id: entity.id,
      name: entity.name,
      description: entity.description,
      gcode: [...entity.gcode],
    };
  }

  async create(gcodeScript: CustomGcodeDto<SqliteIdType>): Promise<CustomGcode> {
    return await super.create(gcodeScript);
  }

  async delete(gcodeScriptId: SqliteIdType, throwIfNotFound?: boolean) {
    return await super.delete(gcodeScriptId, throwIfNotFound);
  }

  async get(gcodeScriptId: SqliteIdType): Promise<CustomGcode> {
    return await super.get(gcodeScriptId);
  }

  async list(): Promise<CustomGcode[]> {
    return await super.list();
  }

  async update(gcodeScriptId: SqliteIdType, updatedData: CustomGcodeDto<SqliteIdType>): Promise<CustomGcode> {
    return await super.update(gcodeScriptId, updatedData);
  }
}
