import { CustomGcode } from "@/models";
import { NotFoundException } from "@/exceptions/runtime.exceptions";
import { MongoIdType } from "@/shared.constants";
import { CustomGcodeDto } from "@/services/interfaces/custom-gcode.dto";
import { ICustomGcodeService } from "@/services/interfaces/custom-gcode.service.interface";
import { ICustomGcode } from "@/models/CustomGcode";

export class CustomGcodeService implements ICustomGcodeService<MongoIdType> {
  toDto(document: ICustomGcode): CustomGcodeDto {
    return {
      id: document.id,
      name: document.name,
      description: document.description,
      gcode: [...document.gcode],
    };
  }
  async get(gcodeScriptId: MongoIdType) {
    const document = await CustomGcode.findById(gcodeScriptId);
    if (!document) throw new NotFoundException(`Custom GCode script with id ${gcodeScriptId} does not exist.`);

    return document;
  }

  async list() {
    return CustomGcode.find();
  }

  async create(gcodeScript: CustomGcodeDto) {
    return CustomGcode.create(gcodeScript);
  }

  async delete(gcodeScriptId: MongoIdType) {
    const gcode = await this.get(gcodeScriptId);
    return CustomGcode.findByIdAndDelete(gcode.id);
  }

  async update(gcodeScriptId: MongoIdType, updatedData: CustomGcodeDto) {
    const customGcode = await this.get(gcodeScriptId);
    customGcode.name = updatedData.name;
    customGcode.description = updatedData.description;
    customGcode.gcode = updatedData.gcode;
    return await customGcode.save();
  }
}
