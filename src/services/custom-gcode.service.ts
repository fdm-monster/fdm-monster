import { CustomGCode } from "@/models";
import { NotFoundException } from "@/exceptions/runtime.exceptions";
import { MongoIdType } from "@/shared.constants";

class CustomGCodeDto {
  name: string;
  description: string;
  gcode: string[];
}

export class CustomGCodeService {
  async get(gcodeScriptId: MongoIdType) {
    const document = await CustomGCode.findById(gcodeScriptId);
    if (!document) throw new NotFoundException(`Custom GCode script with id ${gcodeScriptId} does not exist.`);

    return document;
  }

  async list() {
    return CustomGCode.find();
  }

  async create(gcodeScript: CustomGCodeDto) {
    return CustomGCode.create(gcodeScript);
  }

  async delete(gcodeScriptId: MongoIdType) {
    const gcode = await this.get(gcodeScriptId);
    return CustomGCode.findByIdAndDelete(gcode.id);
  }

  async update(gcodeScriptId: MongoIdType, updatedData: CustomGCodeDto) {
    const customGcode = await this.get(gcodeScriptId);
    customGcode.name = updatedData.name;
    customGcode.description = updatedData.description;
    customGcode.gcode = updatedData.gcode;
    return await customGcode.save();
  }
}
