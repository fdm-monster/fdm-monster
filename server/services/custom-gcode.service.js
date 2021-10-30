const CustomGCode = require("../models/CustomGCode");
const { NotFoundException } = require("../exceptions/runtime.exceptions");

class CustomGCodeService {
  async get(gcodeScriptId) {
    const document = CustomGCode.findById(gcodeScriptId);
    if (!document)
      throw new NotFoundException(`Custom GCode script with id ${gcodeScriptId} does not exist.`);

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

  async update(gcodeScriptId, update) {
    return CustomGCode.findByIdAndUpdate(gcodeScriptId, update);
  }
}

module.exports = CustomGCodeService;
