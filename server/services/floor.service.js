const FloorModel = require("../models/Floor");
const { validateInput } = require("../handlers/validators");
const { NotFoundException } = require("../exceptions/runtime.exceptions");
const {
  createPrinterFloorRules,
  updatePrinterFloorNameRules,
  updatePrinterFloorNumberRules,
  printerInFloorRules,
} = require("./validators/printer-floor-service.validation");

class FloorService {
  #printerGroupService;
  #logger;

  constructor({ printerGroupService, loggerFactory }) {
    this.#printerGroupService = printerGroupService;
    this.#logger = loggerFactory("PrinterFloorService");
  }

  /**
   * Lists the floors present in the database.
   */
  async list() {
    return FloorModel.find({});
  }

  async get(floorId, throwError = true) {
    const printerFloor = await FloorModel.findOne({ _id: floorId });
    if (!printerFloor && throwError) {
      throw new NotFoundException(`Printer floor with id ${floorId} does not exist.`);
    }

    return printerFloor;
  }

  async createDefaultFloor() {
    return await this.create({
      name: "Default Floor",
      floor: 1,
    });
  }

  /**
   * Stores a new printer floor into the database.
   * @param {Object} floor object to create.
   * @throws {Error} If the printer floor is not correctly provided.
   */
  async create(floor) {
    const validatedInput = await validateInput(floor, createPrinterFloorRules);
    return FloorModel.create(validatedInput);
  }

  async updateName(floorId, input) {
    const printerFloor = await this.get(floorId);

    const { name } = await validateInput(input, updatePrinterFloorNameRules);
    printerFloor.name = name;
    return await printerFloor.save();
  }

  async updateFloorNumber(floorId, input) {
    const printerFloor = await this.get(floorId);

    const { floor } = await validateInput(input, updatePrinterFloorNumberRules);
    printerFloor.floor = floor;
    return await printerFloor.save();
  }

  async addOrUpdatePrinter(floorId, printerInFloor) {
    const floor = await this.get(floorId, true);
    const validInput = await validateInput(printerInFloor, printerInFloorRules);

    const foundPrinterInFloorIndex = floor.printers.findIndex((pif) => pif.printerId.toString() === validInput.printerId);
    if (foundPrinterInFloorIndex !== -1) {
      floor.printers[foundPrinterInFloorIndex] = validInput;
      return floor;
    } else {
      floor.printers.push(validInput);
    }

    await floor.save();
    return floor;
  }

  async removePrinter(floorId, input) {
    const floor = await this.get(floorId, true);
    const validInput = await validateInput(input, printerInFloorRules);

    const foundPrinterInFloorIndex = floor.printerGroups.findIndex(
      (pif) => pif.printerId.toString() === validInput.printerGroupId
    );
    if (foundPrinterInFloorIndex === -1) return floor;
    floor.printers.splice(foundPrinterInFloorIndex, 1);
    return await floor.save();
  }

  async delete(floorId) {
    return FloorModel.deleteOne({ _id: floorId });
  }
}

module.exports = FloorService;
