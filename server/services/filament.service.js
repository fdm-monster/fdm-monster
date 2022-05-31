const Model = require("../models/Filament");
const { NotFoundException } = require("../exceptions/runtime.exceptions");

class FilamentService {
  async list() {
    return Model.find();
  }

  async get(entityId) {
    const document = await Model.findById(entityId);
    if (!document)
      throw new NotFoundException(`Filament entity with id ${entityId} does not exist.`);

    return document;
  }

  async create(input) {
    return Model.create(input);
  }

  async delete(entityId) {
    const filamentDoc = await this.get(entityId);
    return Model.findByIdAndDelete(filamentDoc.id);
  }
}

module.exports = FilamentService;
