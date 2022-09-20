const PrinterGroupModel = require("../models/PrinterGroup");
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

  constructor({ printerGroupService, loggerFactory }) {
    this.#printerGroupService = printerGroupService;
    this.#logger = loggerFactory("PrinterFloorService");
  }

  /**
   * Lists the printer groups present in the database.
   */
  async list() {
    return PrinterFloorModel.find({});
  }

  async get(groupId) {
    const printerFloor = await PrinterFloorModel.findOne({ _id: groupId });
    if (!printerFloor)
      throw new NotFoundException(`Printer floor with id ${groupId} does not exist.`);

    return printerFloor;
  }

  /**
   * Stores a new printer group into the database.
   * @param {Object} group object to create.
   * @throws {Error} If the printer group is not correctly provided.
   */
  async create(group) {
    if (!group) throw new Error("Missing printer-floor input to create");

    const validatedInput = await validateInput(group, createPrinterFloorRules);
    return PrinterFloorModel.create(validatedInput);
  }

  async updateName(printerGroupId, input) {
    const printerFloor = await this.get(printerGroupId);

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

  async addOrUpdatePrinterGroup(printerFloorId, printerGroupInFloor) {
    const printerFloor = await this.get(printerFloorId);
    if (!printerFloor) throw new NotFoundException("This floor does not exist", "printerFloorId");

    const validInput = await validateInput(printerGroupInFloor, printerGroupInFloorRules);

    const foundPrinterGroupInFloorIndex = printerFloor.printerGroups.findIndex(
      (pgif) => pgif.printerGroupId.toString() === validInput.printerGroupId
    );
    if (foundPrinterGroupInFloorIndex !== -1) {
      printerFloor.printerGroups[foundPrinterGroupInFloorIndex] = validInput;
      return printerFloor;
    } else {
      printerFloor.printerGroups.push(validInput);
    }

    await printerFloor.save();

    return printerFloor;
  }

  async removePrinterGroup(printerFloorId, input) {
    const validInput = await validateInput(input, printerGroupInFloorRules);
    const floor = await this.get(printerFloorId);
    if (!floor) throw new NotFoundException("This floor does not exist", "printerFloorId");

    const foundPrinterGroupInFloorIndex = floor.printerGroups.findIndex(
      (pgif) => pgif.printerGroupId.toString() === validInput.printerGroupId
    );
    if (foundPrinterGroupInFloorIndex === -1) return floor;
    floor.printerGroups.splice(foundPrinterGroupInFloorIndex, 1);
    return await floor.save();
  }

  async delete(printerFloorId) {
    return PrinterFloorModel.deleteOne({ _id: printerFloorId });
  }
}

module.exports = PrinterFloorService;
