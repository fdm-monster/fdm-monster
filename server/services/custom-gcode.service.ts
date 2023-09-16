import { CustomGCode } from "../models";
import { NotFoundException } from "../exceptions/runtime.exceptions";

export class CustomGCodeService {
  async get(gcodeScriptId) {
    const document = await CustomGCode.findById(gcodeScriptId);
    if (!document) throw new NotFoundException(`Custom GCode script with id ${gcodeScriptId} does not exist.`);

    return document;
  }

  async list() {
    return CustomGCode.find();
  }

  async create(gcodeScript) {
    return CustomGCode.create(gcodeScript);
  }

  async delete(gcodeScriptId) {
    const gcode = await this.get(gcodeScriptId);
    return CustomGCode.findByIdAndDelete(gcode.id);
  }

  async update(gcodeScriptId, updatedData) {
    const customGcode = await this.get(gcodeScriptId);
    customGcode.name = updatedData.name;
    customGcode.description = updatedData.description;
    customGcode.gcode = updatedData.gcode;
    return await customGcode.save();
  }
}
