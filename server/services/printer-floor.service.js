const PrinterFloorModel = require("../models/PrinterFloor");
const _ = require("lodash");
const { validateInput } = require("../handlers/validators");
const { NotFoundException } = require("../exceptions/runtime.exceptions");
const {
  createPrinterFloorRules,
  updatePrinterFloorNameRules,
  printerGroupInFloorRules
} = require("./validators/printer-floor-service.validation");

class PrinterFloorService {
  #printerGroupService;
  #logger;

  #selectedFloorId = null;

  constructor({ printerGroupService, loggerFactory }) {
    this.#printerGroupService = printerGroupService;
    this.#logger = loggerFactory("PrinterFloorService");
  }

  async setSelectedFloor(arrayIndex = null) {
    const floors = await this.list();
    if (!floors?.length) {
      this.#logger.info("Creating default floor as non existed");

      const floor = await this.create({
        name: "default floor",
        floor: 1
      });
      this.#selectedFloorId = floor._id;
    } else {
      const index = arrayIndex || 0;
      this.#selectedFloorId = floors[index]._id;
    }

    this.#logger.debug(`Set selected floor to ${this.#selectedFloorId}`);
  }

  /**
   * Lists the printer groups present in the database.
   */
  async list() {
    return PrinterFloorModel.find({});
  }

  async get(floorId) {
    const printerFloor = await PrinterFloorModel.findOne({ _id: floorId });
    if (!printerFloor)
      throw new NotFoundException(`Printer floor with id ${floorId} does not exist.`);

    return printerFloor;
  }

  /**
   * Stores a new printer group into the database.
   * @param {Object} floor object to create.
   * @throws {Error} If the printer group is not correctly provided.
   */
  async create(floor) {
    if (!floor) throw new Error("Missing printer-floor input to create");

    const validatedInput = await validateInput(floor, createPrinterFloorRules);
    return PrinterFloorModel.create(validatedInput);
  }

  async updateName(floorId, input) {
    const printerFloor = await this.get(floorId);

    const { name } = await validateInput(input, updatePrinterFloorNameRules);
    printerFloor.name = name;
    return await printerFloor.save();
  }

  /**
   * Updates the printerGroup present in the database.
   * @param {Object} printerFloor object to create.
   */
  async update(printerFloor) {
    return PrinterFloorModel.updateOne(printerFloor.id, printerFloor);
  }

  async addOrUpdatePrinterGroup(floorId, printerGroupInFloor) {
    const floor = await this.get(floorId);
    if (!floor) throw new NotFoundException("This floor does not exist", "floorId");

    const validInput = await validateInput(printerGroupInFloor, printerGroupInFloorRules);

    const foundPrinterGroupInFloorIndex = floor.printerGroups.findIndex(
      (pgif) => pgif.printerGroupId.toString() === validInput.printerGroupId
    );
    if (foundPrinterGroupInFloorIndex !== -1) {
      floor.printerGroups[foundPrinterGroupInFloorIndex] = validInput;
      return floor;
    } else {
      floor.printerGroups.push(validInput);
    }

    await floor.save();

    return floor;
  }

  async removePrinterGroup(floorId, input) {
    const validInput = await validateInput(input, printerGroupInFloorRules);
    const floor = await this.get(floorId);
    if (!floor) throw new NotFoundException("This floor does not exist", "printerFloorId");

    const foundPrinterGroupInFloorIndex = floor.printerGroups.findIndex(
      (pgif) => pgif.printerGroupId.toString() === validInput.printerGroupId
    );
    if (foundPrinterGroupInFloorIndex === -1) return floor;
    floor.printerGroups.splice(foundPrinterGroupInFloorIndex, 1);
    return await floor.save();
  }

  async delete(floorId) {
    return PrinterFloorModel.deleteOne({ _id: floorId });
  }
}

module.exports = PrinterFloorService;
