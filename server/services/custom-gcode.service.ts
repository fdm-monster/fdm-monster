const Model = require("../models/CustomGCode");
const { NotFoundException } = require("../exceptions/runtime.exceptions");

export class CustomGCodeService {
  async get(gcodeScriptId) {
    const document = await Model.findById(gcodeScriptId);
    if (!document) throw new NotFoundException(`Custom GCode script with id ${gcodeScriptId} does not exist.`);

    return document;
  }

  async list() {
    return Model.find();
  }

  async create(gcodeScript) {
    return Model.create(gcodeScript);
  }

  async delete(gcodeScriptId) {
    const gcode = await this.get(gcodeScriptId);
    return Model.findByIdAndDelete(gcode.id);
  }

  async update(gcodeScriptId, updatedData) {
    const customGcode = await this.get(gcodeScriptId);
    customGcode.name = updatedData.name;
    customGcode.description = updatedData.description;
    customGcode.gcode = updatedData.gcode;
    return await customGcode.save();
  }
}

module.exports = CustomGCodeService;
