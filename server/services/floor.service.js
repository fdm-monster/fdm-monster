const { Floor } = require("../models/Floor");
const { validateInput } = require("../handlers/validators");
const { NotFoundException } = require("../exceptions/runtime.exceptions");
const {
  createFloorRules,
  updateFloorNameRules,
  updateFloorNumberRules,
  printerInFloorRules, removePrinterInFloorRules,
} = require("./validators/floor-service.validation");
const { model } = require("mongoose");

class FloorService {
  printerService;
  #logger;

  constructor({ printerService, loggerFactory }) {
    this.printerService = printerService;
    this.#logger = loggerFactory("PrinterFloorService");
  }

  /**
   * Lists the floors present in the database.
   */
  async list() {
    return Floor.find({});
  }

  async get(floorId, throwError = true) {
    const floor = await Floor.findOne({ _id: floorId });
    if (!floor && throwError) {
      throw new NotFoundException(`Floor with id ${floorId} does not exist.`);
    }

    return floor;
  }

  async createDefaultFloor() {
    return await this.create({
      name: "Default Floor",
      floor: 1,
    });
  }

  /**
   * Stores a new floor into the database.
   * @param {Object} floor object to create.
   * @throws {Error} If the printer floor is not correctly provided.
   */
  async create(floor) {
    const validatedInput = await validateInput(floor, createFloorRules);
    return Floor.create(validatedInput);
  }

  async updateName(floorId, input) {
    const floor = await this.get(floorId);

    const { name } = await validateInput(input, updateFloorNameRules);
    floor.name = name;
    return await floor.save();
  }

  async updateFloorNumber(floorId, input) {
    const floor = await this.get(floorId);
    const { floor: level } = await validateInput(input, updateFloorNumberRules);
    floor.floor = level;
    return await floor.save();
  }

  async deletePrinterFromAnyFloor(printerId) {
    return Floor.updateMany(
      {},
      {
        $pull: {
          printers: {
            printerId: {
              $in: [printerId],
            },
          },
        },
      }
    );
  }

  async addOrUpdatePrinter(floorId, printerInFloor) {
    const floor = await this.get(floorId, true);
    const validInput = await validateInput(printerInFloor, printerInFloorRules);

    const foundPrinterInFloorIndex = floor.printers.findIndex((pif) => pif.printerId.toString() === validInput.printerId);
    if (foundPrinterInFloorIndex !== -1) {
      floor.printers[foundPrinterInFloorIndex] = validInput;
    } else {
      floor.printers.push(validInput);
    }

    await floor.save();
    return floor;
  }

  async removePrinter(floorId, input) {
    const floor = await this.get(floorId, true);
    const validInput = await validateInput(input, removePrinterInFloorRules);

    const foundPrinterInFloorIndex = floor.printers.findIndex((pif) => pif.printerId.toString() === validInput.printerId);
    if (foundPrinterInFloorIndex === -1) return floor;
    floor.printers.splice(foundPrinterInFloorIndex, 1);
    await floor.save();
    return floor;
  }

  async delete(floorId) {
    return Floor.deleteOne({ _id: floorId });
  }
}

module.exports = FloorService;
